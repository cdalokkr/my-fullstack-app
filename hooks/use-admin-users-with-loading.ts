// ============================================
// hooks/use-admin-users-with-loading.ts
// ============================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useDualLayerCoordinator } from '@/components/dashboard/dual-layer-loading-coordinator'
import { 
  DualLayerCoordinatorState, 
  DatabaseOperationType 
} from '@/components/dashboard/dual-layer-loading-coordinator'
import { 
  UserOperationModalState,
  USER_OPERATION_MODAL_CONFIG 
} from '@/components/dashboard/user-operation-modal-overlay'
import { LoadingPriority } from '@/components/ui/loading-states'
import { Profile, UserRole } from '@/types'
import toast from 'react-hot-toast'

// Query configuration types
interface UserQueryConfig {
  page: number
  limit: number
  search?: string
  role?: UserRole | 'all'
}

// Enhanced query results with loading coordination
interface CoordinatedQueryResult {
  data: {
    users: Profile[]
    total: number
    pages: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  cancel: () => void
  // Performance metrics
  metrics: {
    queryStartTime: number
    dataReadyTime: number | null
    totalDuration: number | null
  }
  // Loading coordination helpers
  isDataReady: boolean
  canRetry: boolean
  isStale: boolean
}

// Mutation result with optimistic updates
interface CoordinatedMutationResult<TData = any> {
  mutate: (variables: any) => Promise<TData>
  mutateAsync: (variables: any) => Promise<TData>
  isPending: boolean
  error: Error | null
  reset: () => void
  // Optimistic update support
  optimisticData: TData | null
  isOptimistic: boolean
  // Loading coordination
  operationType: DatabaseOperationType | null
  customLoadingMessage: string
  customErrorMessage: string
}

// Main integration hook return type
interface UseAdminUsersWithLoadingReturn {
  // Query management
  usersQuery: CoordinatedQueryResult
  
  // Mutation management
  createUserMutation: CoordinatedMutationResult<Profile>
  updateUserMutation: CoordinatedMutationResult<Profile>
  deleteUserMutation: CoordinatedMutationResult<{ success: boolean }>
  updateUserRoleMutation: CoordinatedMutationResult<Profile>
  
  // Loading coordination
  isLoading: boolean
  currentOperation: DatabaseOperationType | null
  loadingProgress: {
    current: number
    total: number
    label: string
  } | null
  
  // Performance and monitoring
  performance: {
    totalQueryTime: number
    averageMutationTime: number
    errorCount: number
    successCount: number
    lastOperationDuration: number | null
    isSlowOperation: boolean
  }
  
  // Utility functions
  refreshAll: () => Promise<void>
  cancelAllOperations: () => void
  retryFailedOperation: () => void
  clearCache: () => void
  updateConfig: (config: Partial<UserQueryConfig>) => void
  searchUsers: (searchTerm: string) => void
  filterByRole: (role: UserRole | 'all') => void
  goToPage: (page: number) => void
}

// Query hook with dual-layer loading integration
function useCoordinatedUsersQuery(
  config: UserQueryConfig,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    refetchOnWindowFocus?: boolean
  }
): CoordinatedQueryResult {
  const { state, actions, helpers } = useDualLayerCoordinator()
  const [metrics, setMetrics] = useState({
    queryStartTime: 0,
    dataReadyTime: null as number | null,
    totalDuration: null as number | null
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const query = trpc.admin.users.getUsers.useQuery(config, {
    ...options,
    enabled: options?.enabled !== false
  })

  // Handle query state changes
  useEffect(() => {
    if (query.data && !query.isLoading && !query.error) {
      // Mark data as ready when query succeeds
      if (state.currentState === DualLayerCoordinatorState.LOADING_DATA) {
        actions.dataReady()
      }
      
      setMetrics(prev => ({
        ...prev,
        dataReadyTime: Date.now(),
        totalDuration: Date.now() - prev.queryStartTime
      }))
    }
  }, [query.data, query.isLoading, query.error, state.currentState, actions])

  useEffect(() => {
    if (query.error) {
      // Handle errors through the coordinator
      const error = new Error(query.error.message || 'Query failed')
      actions.setError(error)
      
      // Log performance metrics
      console.warn('User query failed:', {
        duration: Date.now() - metrics.queryStartTime,
        error: query.error.message,
        state: state.currentState
      })
    }
  }, [query.error, metrics.queryStartTime, state.currentState, actions])

  // Start loading coordination when query starts
  useEffect(() => {
    if (query.isFetching && !query.isLoading && state.currentState === DualLayerCoordinatorState.INITIALIZING) {
      actions.initialize(DatabaseOperationType.FETCH_USERS)
      setMetrics(prev => ({
        ...prev,
        queryStartTime: Date.now(),
        dataReadyTime: null,
        totalDuration: null
      }))
    }
  }, [query.isFetching, query.isLoading, state.currentState, actions])

  // Auto-transition to data loading after initialization delay
  useEffect(() => {
    if (state.currentState === DualLayerCoordinatorState.INITIALIZING) {
      const timer = setTimeout(() => {
        actions.startDataLoading(DatabaseOperationType.FETCH_USERS, LoadingPriority.HIGH)
      }, state.config.initialLoadDelay)
      
      return () => clearTimeout(timer)
    }
  }, [state.currentState, state.config.initialLoadDelay, actions])

  const cancel = useCallback(() => {
    // Cancel current query
    trpc.useUtils().admin.users.getUsers.invalidate()
  }, [])

  const refetch = useCallback(async () => {
    await trpc.useUtils().admin.users.getUsers.invalidate()
  }, [])

  const isStale = query.isStale

  return {
    data: query.data,
    isLoading: query.isLoading || helpers.isLoading,
    error: query.error ? new Error(query.error.message) : null,
    refetch,
    cancel,
    metrics,
    isDataReady: !query.isLoading && !query.error && !!query.data,
    canRetry: !!query.error && state.retryCount < state.config.maxRetries,
    isStale
  }
}

// Mutation hook with optimistic updates and loading coordination
function useCoordinatedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onMutate?: (variables: TVariables) => void
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
    optimisticUpdate?: boolean
    loadingMessage?: string
    errorMessage?: string
    operationType: DatabaseOperationType
  }
): CoordinatedMutationResult<TData> {
  const { state, actions } = useDualLayerCoordinator()
  const [optimisticData, setOptimisticData] = useState<TData | null>(null)
  const [isOptimistic, setIsOptimistic] = useState(false)
  const operationStartTime = useRef<number>(0)

  const [mutationState, setMutationState] = useState<{
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    error: Error | null
  }>({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null
  })

  // Hook into the actual mutation via React Query patterns
  const trpcMutation = trpc.useUtils().client

  useEffect(() => {
    if (mutationState.isPending) {
      operationStartTime.current = Date.now()
      actions.startOperation(options?.operationType || DatabaseOperationType.UPDATE_USER, {
        priority: LoadingPriority.HIGH,
        customMessage: options?.loadingMessage,
        showProgress: true
      })
    } else if (mutationState.isSuccess || mutationState.isError) {
      actions.operationComplete()
      setIsOptimistic(false)
    }
  }, [mutationState.isPending, mutationState.isSuccess, mutationState.isError, actions, options])

  const mutate = useCallback(async (variables: TVariables) => {
    setMutationState({ isPending: true, isSuccess: false, isError: false, error: null })

    // Start optimistic update if enabled
    if (options?.optimisticUpdate) {
      setIsOptimistic(true)
      setOptimisticData(null) // Will be set by onMutate
      
      // Trigger optimistic update callback
      if (options.onMutate) {
        options.onMutate(variables)
      }
    }

    try {
      const result = await mutationFn(variables)
      
      setMutationState({ isPending: false, isSuccess: true, isError: false, error: null })
      
      // Success handling
      if (options?.onSuccess) {
        options.onSuccess(result, variables)
      }
      
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Operation failed')
      setMutationState({ isPending: false, isSuccess: false, isError: true, error: errorObj })
      
      // Error handling
      if (options?.onError) {
        options.onError(errorObj, variables)
      } else {
        toast.error(options?.errorMessage || 'Operation failed')
      }
      throw errorObj
    }
  }, [mutationFn, options])

  const mutateAsync = mutate

  return {
    mutate,
    mutateAsync,
    isPending: mutationState.isPending,
    error: mutationState.error,
    reset: () => setMutationState({ isPending: false, isSuccess: false, isError: false, error: null }),
    optimisticData,
    isOptimistic,
    operationType: options?.operationType || null,
    customLoadingMessage: options?.loadingMessage || 'Processing...',
    customErrorMessage: options?.errorMessage || 'Operation failed'
  }
}

// Main integration hook
export function useAdminUsersWithLoading(
  initialConfig?: Partial<UserQueryConfig>
): UseAdminUsersWithLoadingReturn {
  const [config, setConfig] = useState<UserQueryConfig>({
    page: 1,
    limit: 50,
    ...initialConfig
  })

  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalQueryTime: 0,
    averageMutationTime: 0,
    errorCount: 0,
    successCount: 0,
    lastOperationDuration: null as number | null,
    mutationTimes: [] as number[]
  })

  const { state, actions, helpers } = useDualLayerCoordinator()

  // Coordinated query
  const usersQuery = useCoordinatedUsersQuery(config)

  // Coordinated mutations
  const utils = trpc.useUtils()

  const createUserMutation = useCoordinatedMutation<Profile, {
    email: string
    password: string
    firstName: string
    lastName: string
    mobileNo?: string
    dateOfBirth?: string
    role: UserRole
  }>(
    async (variables) => {
      const result = await trpc.admin.users.createUser.mutateAsync(variables)
      return result
    },
    {
      operationType: DatabaseOperationType.CREATE_USER,
      loadingMessage: 'Creating user account...',
      errorMessage: 'Failed to create user',
      optimisticUpdate: true,
      onSuccess: (data) => {
        toast.success('User created successfully')
        // Refresh queries to get updated data
        utils.admin.users.getUsers.invalidate()
      }
    }
  )

  const updateUserMutation = useCoordinatedMutation<Profile, {
    userId: string
    firstName?: string
    lastName?: string
    mobileNo?: string
    dateOfBirth?: string
  }>(
    async (variables) => {
      const result = await trpc.admin.users.updateUserProfile.mutateAsync(variables)
      return result
    },
    {
      operationType: DatabaseOperationType.UPDATE_USER,
      loadingMessage: 'Updating user profile...',
      errorMessage: 'Failed to update user',
      optimisticUpdate: true
    }
  )

  const updateUserRoleMutation = useCoordinatedMutation<Profile, {
    userId: string
    role: UserRole
  }>(
    async (variables) => {
      const result = await trpc.admin.users.updateUserRole.mutateAsync(variables)
      return result
    },
    {
      operationType: DatabaseOperationType.UPDATE_USER,
      loadingMessage: 'Updating user role...',
      errorMessage: 'Failed to update user role',
      optimisticUpdate: true,
      onSuccess: (data) => {
        toast.success('User role updated successfully')
      }
    }
  )

  const deleteUserMutation = useCoordinatedMutation<{ success: boolean }, {
    userId: string
  }>(
    async (variables) => {
      const result = await trpc.admin.users.deleteUser.mutateAsync(variables)
      return result
    },
    {
      operationType: DatabaseOperationType.DELETE_USER,
      loadingMessage: 'Deleting user account...',
      errorMessage: 'Failed to delete user',
      optimisticUpdate: false,
      onSuccess: () => {
        toast.success('User deleted successfully')
        // Refresh queries after deletion
        utils.admin.users.getUsers.invalidate()
      }
    }
  )

  // Update config helper
  const updateConfig = useCallback((newConfig: Partial<UserQueryConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Search helper
  const searchUsers = useCallback((searchTerm: string) => {
    updateConfig({ search: searchTerm || undefined, page: 1 })
  }, [updateConfig])

  // Filter helper
  const filterByRole = useCallback((role: UserRole | 'all') => {
    updateConfig({ role, page: 1 })
  }, [updateConfig])

  // Pagination helper
  const goToPage = useCallback((page: number) => {
    updateConfig({ page })
  }, [updateConfig])

  // Refresh all queries
  const refreshAll = useCallback(async () => {
    await utils.admin.users.getUsers.invalidate()
    actions.reset()
  }, [utils, actions])

  // Cancel all operations
  const cancelAllOperations = useCallback(() => {
    usersQuery.cancel()
    actions.reset()
  }, [usersQuery.cancel, actions])

  // Retry failed operation
  const retryFailedOperation = useCallback(() => {
    if (usersQuery.error) {
      usersQuery.refetch()
    } else {
      actions.retry()
    }
  }, [usersQuery, actions])

  // Clear cache
  const clearCache = useCallback(() => {
    utils.admin.users.getUsers.invalidate()
  }, [utils])

  // Performance monitoring
  useEffect(() => {
    if (state.currentState === DualLayerCoordinatorState.READY && usersQuery.metrics.totalDuration) {
      setPerformanceMetrics(prev => ({
        ...prev,
        totalQueryTime: usersQuery.metrics.totalDuration || 0
      }))
    }
  }, [state.currentState, usersQuery.metrics.totalDuration])

  // Calculate performance metrics
  const averageMutationTime = useMemo(() => {
    if (performanceMetrics.mutationTimes.length === 0) return 0
    return performanceMetrics.mutationTimes.reduce((a, b) => a + b, 0) / performanceMetrics.mutationTimes.length
  }, [performanceMetrics.mutationTimes])

  const isSlowOperation = useMemo(() => {
    return performanceMetrics.lastOperationDuration ? performanceMetrics.lastOperationDuration > 2000 : false
  }, [performanceMetrics.lastOperationDuration])

  return {
    // Query
    usersQuery,
    
    // Mutations
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    updateUserRoleMutation,
    
    // Loading state
    isLoading: helpers.isLoading,
    currentOperation: state.operationType,
    loadingProgress: state.showProgress ? state.progress || null : null,
    
    // Performance
    performance: {
      ...performanceMetrics,
      averageMutationTime,
      isSlowOperation
    },
    
    // Utility functions
    refreshAll,
    cancelAllOperations,
    retryFailedOperation,
    clearCache,
    updateConfig,
    searchUsers,
    filterByRole,
    goToPage
  }
}

export default useAdminUsersWithLoading
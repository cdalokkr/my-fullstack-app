'use client'

import React, { useReducer, useEffect, useCallback, useRef } from 'react'
import { UserManagementSkeleton } from './skeletons/user-management-skeleton'
import { 
  UserOperationModalOverlay, 
  UserOperationModalState, 
  UserOperationModalOverlayProps 
} from './user-operation-modal-overlay'
import { cn } from '@/lib/utils'
import { LoadingPriority } from '@/components/ui/loading-states'

// ====================
// STATE MACHINE TYPES
// ====================

/**
 * DualLayerLoadingCoordinator State Machine
 * Manages coordination between Layer 1 (Skeleton) and Layer 2 (Modal)
 */
export enum DualLayerCoordinatorState {
  INITIALIZING = 'initializing',        // <50ms: Show skeleton immediately
  LOADING_DATA = 'loading_data',        // 50-200ms+: Show modal during DB ops
  READY = 'ready',                      // Data ready: Remove both layers
  ERROR = 'error',                      // Error occurred: Show error state
  UPDATING = 'updating',                // User modifications in progress
  SEARCHING = 'searching'               // Search operations in progress
}

// Database operation types
export enum DatabaseOperationType {
  FETCH_USERS = 'fetch_users',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  SEARCH_USERS = 'search_users',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  BULK_OPERATION = 'bulk_operation'
}

// Coordinator configuration
export interface CoordinatorConfig {
  initialLoadDelay: number              // Time before showing modal overlay
  dataReadyThreshold: number           // Min time to show actual data
  skeletonFadeOutDuration: number      // Skeleton fade-out animation duration
  modalFadeOutDuration: number         // Modal fade-out animation duration
  errorRetryDelay: number              // Delay before allowing retry
  maxRetries: number                   // Maximum retry attempts
  enablePerformanceMonitoring: boolean // Enable performance tracking
  debugMode: boolean                   // Enable debug logging
}

// Performance metrics
export interface PerformanceMetrics {
  phase1Time: number                   // Time to initial skeleton render
  phase2Time: number                   // Time to modal overlay render
  totalLoadTime: number                // Total time to data ready
  operationStartTime: number           // Current operation start time
  renderCount: number                  // Number of re-renders
  lastUpdate: number                   // Last update timestamp
}

// State interface
export interface DualLayerCoordinatorStateData {
  currentState: DualLayerCoordinatorState
  previousState: DualLayerCoordinatorState | null
  isLayer1Visible: boolean             // UserManagementSkeleton visibility
  isLayer2Visible: boolean             // UserOperationModalOverlay visibility
  operationType: DatabaseOperationType | null
  modalState: UserOperationModalState
  priority: LoadingPriority
  error: Error | null
  retryCount: number
  metrics: PerformanceMetrics
  transitionStartTime: number
  config: CoordinatorConfig
  customMessage?: string
  customDescription?: string
  showProgress: boolean
  progress?: {
    current: number
    total: number
    label: string
  }
}

// ====================
// ACTION TYPES
// ====================

export enum CoordinatorActionType {
  // State transitions
  START_INITIALIZATION = 'start_initialization',
  START_DATA_LOADING = 'start_data_loading',
  DATA_READY = 'data_ready',
  START_OPERATION = 'start_operation',
  OPERATION_COMPLETE = 'operation_complete',
  OPERATION_ERROR = 'operation_error',
  START_SEARCH = 'start_search',
  SEARCH_COMPLETE = 'search_complete',
  
  // Layer visibility
  SHOW_LAYER_1 = 'show_layer_1',
  HIDE_LAYER_1 = 'hide_layer_1',
  SHOW_LAYER_2 = 'show_layer_2',
  HIDE_LAYER_2 = 'hide_layer_2',
  
  // Error handling
  SET_ERROR = 'set_error',
  CLEAR_ERROR = 'clear_error',
  RETRY_OPERATION = 'retry_operation',
  
  // Configuration
  UPDATE_CONFIG = 'update_config',
  RESET_COORDINATOR = 'reset_coordinator',
  
  // Performance
  RECORD_METRIC = 'record_metric'
}

// Action interface
export interface CoordinatorAction {
  type: CoordinatorActionType
  payload?: {
    operationType?: DatabaseOperationType
    priority?: LoadingPriority
    error?: Error
    customMessage?: string
    customDescription?: string
    showProgress?: boolean
    progress?: {
      current: number
      total: number
      label: string
    }
    config?: Partial<CoordinatorConfig>
    metric?: keyof PerformanceMetrics
    value?: number
  }
}

// ====================
// DEFAULT CONFIGURATION
// ====================

const DEFAULT_CONFIG: CoordinatorConfig = {
  initialLoadDelay: 50,                // 50ms before showing modal
  dataReadyThreshold: 200,             // 200ms minimum to show data
  skeletonFadeOutDuration: 300,        // 300ms skeleton fade-out
  modalFadeOutDuration: 250,           // 250ms modal fade-out
  errorRetryDelay: 1000,               // 1s before retry
  maxRetries: 3,                       // Max 3 retries
  enablePerformanceMonitoring: true,   // Enable metrics
  debugMode: false                     // Debug logging off by default
}

// ====================
// INITIAL STATE
// ====================

const createInitialState = (config: CoordinatorConfig = DEFAULT_CONFIG): DualLayerCoordinatorStateData => ({
  currentState: DualLayerCoordinatorState.INITIALIZING,
  previousState: null,
  isLayer1Visible: true,               // Start with skeleton visible
  isLayer2Visible: false,
  operationType: null,
  modalState: UserOperationModalState.PROCESSING,
  priority: LoadingPriority.MEDIUM,
  error: null,
  retryCount: 0,
  metrics: {
    phase1Time: 0,
    phase2Time: 0,
    totalLoadTime: 0,
    operationStartTime: 0,
    renderCount: 0,
    lastUpdate: Date.now()
  },
  transitionStartTime: 0,
  config,
  showProgress: false
})

// ====================
// REDUCER
// ====================

function coordinatorReducer(
  state: DualLayerCoordinatorStateData,
  action: CoordinatorAction
): DualLayerCoordinatorStateData {
  const debugLog = (message: string, data?: any) => {
    if (state.config.debugMode) {
      console.log(`[DualLayerCoordinator] ${message}`, data)
    }
  }

  debugLog(`Action: ${action.type}`, action.payload)

  switch (action.type) {
    case CoordinatorActionType.START_INITIALIZATION: {
      const now = Date.now()
      const metrics = {
        ...state.metrics,
        phase1Time: now,
        renderCount: state.metrics.renderCount + 1,
        lastUpdate: now
      }

      return {
        ...state,
        currentState: DualLayerCoordinatorState.INITIALIZING,
        previousState: state.currentState,
        isLayer1Visible: true,
        isLayer2Visible: false,
        operationType: action.payload?.operationType || null,
        transitionStartTime: now,
        metrics
      }
    }

    case CoordinatorActionType.START_DATA_LOADING: {
      const now = Date.now()
      const metrics = {
        ...state.metrics,
        phase2Time: now,
        operationStartTime: now,
        renderCount: state.metrics.renderCount + 1,
        lastUpdate: now
      }

      return {
        ...state,
        currentState: DualLayerCoordinatorState.LOADING_DATA,
        previousState: state.currentState,
        isLayer1Visible: true,        // Keep skeleton visible
        isLayer2Visible: true,        // Show modal overlay
        operationType: action.payload?.operationType || DatabaseOperationType.FETCH_USERS,
        priority: action.payload?.priority || LoadingPriority.HIGH,
        customMessage: action.payload?.customMessage,
        customDescription: action.payload?.customDescription,
        showProgress: action.payload?.showProgress || false,
        progress: action.payload?.progress,
        transitionStartTime: now,
        metrics
      }
    }

    case CoordinatorActionType.DATA_READY: {
      const now = Date.now()
      const totalLoadTime = now - state.metrics.phase1Time
      const metrics = {
        ...state.metrics,
        totalLoadTime,
        renderCount: state.metrics.renderCount + 1,
        lastUpdate: now
      }

      debugLog('Data ready, transitioning to READY state', { totalLoadTime })

      return {
        ...state,
        currentState: DualLayerCoordinatorState.READY,
        previousState: state.currentState,
        isLayer1Visible: false,       // Hide skeleton
        isLayer2Visible: false,       // Hide modal
        operationType: null,
        error: null,                  // Clear any errors
        retryCount: 0,                // Reset retry count
        transitionStartTime: now,
        metrics
      }
    }

    case CoordinatorActionType.START_OPERATION: {
      const now = Date.now()
      const operationType = action.payload?.operationType || DatabaseOperationType.UPDATE_USER
      
      // Map operation type to modal state
      const modalStateMap: Record<DatabaseOperationType, UserOperationModalState> = {
        [DatabaseOperationType.FETCH_USERS]: UserOperationModalState.LOADING_USERS,
        [DatabaseOperationType.CREATE_USER]: UserOperationModalState.CREATING_USER,
        [DatabaseOperationType.UPDATE_USER]: UserOperationModalState.UPDATING_USER,
        [DatabaseOperationType.DELETE_USER]: UserOperationModalState.DELETING_USER,
        [DatabaseOperationType.SEARCH_USERS]: UserOperationModalState.SEARCHING_USERS,
        [DatabaseOperationType.EXPORT_DATA]: UserOperationModalState.EXPORTING_DATA,
        [DatabaseOperationType.IMPORT_DATA]: UserOperationModalState.IMPORTING_DATA,
        [DatabaseOperationType.BULK_OPERATION]: UserOperationModalState.PROCESSING
      }

      return {
        ...state,
        currentState: DualLayerCoordinatorState.UPDATING,
        previousState: state.currentState,
        isLayer1Visible: true,        // Keep skeleton for context
        isLayer2Visible: true,        // Show modal for operation
        operationType,
        modalState: modalStateMap[operationType],
        priority: action.payload?.priority || LoadingPriority.HIGH,
        customMessage: action.payload?.customMessage,
        customDescription: action.payload?.customDescription,
        showProgress: action.payload?.showProgress || false,
        progress: action.payload?.progress,
        transitionStartTime: now,
        metrics: {
          ...state.metrics,
          operationStartTime: now,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: now
        }
      }
    }

    case CoordinatorActionType.OPERATION_COMPLETE: {
      const now = Date.now()
      
      // If this was a critical operation, go back to ready state
      const shouldShowData = state.priority === LoadingPriority.CRITICAL ||
                            state.currentState === DualLayerCoordinatorState.SEARCHING

      return {
        ...state,
        currentState: shouldShowData ? DualLayerCoordinatorState.READY : state.currentState,
        isLayer1Visible: !shouldShowData,
        isLayer2Visible: !shouldShowData,
        operationType: null,
        transitionStartTime: now,
        metrics: {
          ...state.metrics,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: now
        }
      }
    }

    case CoordinatorActionType.START_SEARCH: {
      const now = Date.now()
      
      return {
        ...state,
        currentState: DualLayerCoordinatorState.SEARCHING,
        previousState: state.currentState,
        isLayer1Visible: true,
        isLayer2Visible: true,
        operationType: DatabaseOperationType.SEARCH_USERS,
        modalState: UserOperationModalState.SEARCHING_USERS,
        priority: LoadingPriority.MEDIUM,
        transitionStartTime: now,
        metrics: {
          ...state.metrics,
          operationStartTime: now,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: now
        }
      }
    }

    case CoordinatorActionType.SEARCH_COMPLETE: {
      return {
        ...state,
        currentState: DualLayerCoordinatorState.READY,
        isLayer1Visible: false,
        isLayer2Visible: false,
        operationType: null,
        metrics: {
          ...state.metrics,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: Date.now()
        }
      }
    }

    case CoordinatorActionType.OPERATION_ERROR: {
      const now = Date.now()
      const error = action.payload?.error || new Error('Operation failed')
      const retryCount = state.retryCount + 1

      return {
        ...state,
        currentState: DualLayerCoordinatorState.ERROR,
        previousState: state.currentState,
        isLayer1Visible: true,        // Keep skeleton for context
        isLayer2Visible: true,        // Show error in modal
        modalState: UserOperationModalState.PROCESSING,
        error,
        retryCount,
        transitionStartTime: now,
        metrics: {
          ...state.metrics,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: now
        }
      }
    }

    case CoordinatorActionType.SET_ERROR: {
      return {
        ...state,
        currentState: DualLayerCoordinatorState.ERROR,
        error: action.payload?.error || null,
        isLayer1Visible: true,
        isLayer2Visible: true,
        metrics: {
          ...state.metrics,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: Date.now()
        }
      }
    }

    case CoordinatorActionType.CLEAR_ERROR: {
      return {
        ...state,
        error: null,
        metrics: {
          ...state.metrics,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: Date.now()
        }
      }
    }

    case CoordinatorActionType.RETRY_OPERATION: {
      const now = Date.now()
      return {
        ...state,
        currentState: DualLayerCoordinatorState.LOADING_DATA,
        error: null,
        retryCount: 0,                // Reset retry count
        transitionStartTime: now,
        metrics: {
          ...state.metrics,
          renderCount: state.metrics.renderCount + 1,
          lastUpdate: now
        }
      }
    }

    case CoordinatorActionType.UPDATE_CONFIG: {
      const newConfig = { ...state.config, ...action.payload?.config }
      return {
        ...state,
        config: newConfig
      }
    }

    case CoordinatorActionType.RESET_COORDINATOR: {
      return createInitialState(state.config)
    }

    case CoordinatorActionType.RECORD_METRIC: {
      const { metric, value } = action.payload || {}
      if (metric && value !== undefined) {
        return {
          ...state,
          metrics: {
            ...state.metrics,
            [metric]: value,
            lastUpdate: Date.now()
          }
        }
      }
      return state
    }

    default:
      return state
  }
}

// ====================
// HOOKS
// ====================

/**
 * Custom hook for dual-layer coordinator logic
 */
export function useDualLayerCoordinator(initialConfig?: Partial<CoordinatorConfig>) {
  const config = { ...DEFAULT_CONFIG, ...initialConfig }
  const [state, dispatch] = useReducer(coordinatorReducer, createInitialState(config))
  
  // Refs for timing and cleanup
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const operationStartRef = useRef<number>(0)

  // Cleanup function
  const cleanup = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  // Set timer with cleanup
  const setTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    timersRef.current.add(timer)
    return timer
  }, [])

  // Clear specific timer
  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer)
    timersRef.current.delete(timer)
  }, [])

  // Action creators
  const actions = {
    // Initialization
    initialize: useCallback((operationType?: DatabaseOperationType) => {
      dispatch({
        type: CoordinatorActionType.START_INITIALIZATION,
        payload: { operationType }
      })

      // Auto-transition to data loading after initial delay
      setTimer(() => {
        dispatch({
          type: CoordinatorActionType.START_DATA_LOADING,
          payload: { operationType }
        })
      }, state.config.initialLoadDelay)
    }, [state.config.initialLoadDelay, setTimer]),

    // Data operations
    startDataLoading: useCallback((operationType?: DatabaseOperationType, priority?: LoadingPriority) => {
      dispatch({
        type: CoordinatorActionType.START_DATA_LOADING,
        payload: { operationType, priority }
      })
    }, []),

    dataReady: useCallback(() => {
      dispatch({ type: CoordinatorActionType.DATA_READY })
    }, []),

    // Operation management
    startOperation: useCallback((
      operationType: DatabaseOperationType,
      options?: {
        priority?: LoadingPriority
        customMessage?: string
        customDescription?: string
        showProgress?: boolean
        progress?: { current: number; total: number; label: string }
      }
    ) => {
      operationStartRef.current = Date.now()
      dispatch({
        type: CoordinatorActionType.START_OPERATION,
        payload: { operationType, ...options }
      })
    }, []),

    operationComplete: useCallback(() => {
      dispatch({ type: CoordinatorActionType.OPERATION_COMPLETE })
    }, []),

    // Search operations
    startSearch: useCallback(() => {
      dispatch({ type: CoordinatorActionType.START_SEARCH })
    }, []),

    searchComplete: useCallback(() => {
      dispatch({ type: CoordinatorActionType.SEARCH_COMPLETE })
    }, []),

    // Error handling
    setError: useCallback((error: Error) => {
      dispatch({
        type: CoordinatorActionType.OPERATION_ERROR,
        payload: { error }
      })
    }, []),

    clearError: useCallback(() => {
      dispatch({ type: CoordinatorActionType.CLEAR_ERROR })
    }, []),

    retry: useCallback(() => {
      dispatch({ type: CoordinatorActionType.RETRY_OPERATION })
    }, []),

    // Configuration
    updateConfig: useCallback((config: Partial<CoordinatorConfig>) => {
      dispatch({
        type: CoordinatorActionType.UPDATE_CONFIG,
        payload: { config }
      })
    }, []),

    // Reset
    reset: useCallback(() => {
      cleanup()
      dispatch({ type: CoordinatorActionType.RESET_COORDINATOR })
    }, [cleanup]),

    // Performance metrics
    recordMetric: useCallback((metric: keyof PerformanceMetrics, value: number) => {
      dispatch({
        type: CoordinatorActionType.RECORD_METRIC,
        payload: { metric, value }
      })
    }, [])
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // Performance monitoring
  useEffect(() => {
    if (state.config.enablePerformanceMonitoring && state.metrics.renderCount > 0) {
      const now = Date.now()
      const timeSinceLastUpdate = now - state.metrics.lastUpdate
      
      if (timeSinceLastUpdate > 100) { // Log if update took > 100ms
        console.warn('[DualLayerCoordinator] Slow update detected:', {
          state: state.currentState,
          renderTime: timeSinceLastUpdate,
          renderCount: state.metrics.renderCount
        })
      }
    }
  }, [state.currentState, state.metrics.renderCount, state.config.enablePerformanceMonitoring, state.metrics.lastUpdate])

  return {
    state,
    actions,
    helpers: {
      isLoading: state.currentState !== DualLayerCoordinatorState.READY,
      canRetry: state.retryCount < state.config.maxRetries,
      shouldShowSkeleton: state.isLayer1Visible,
      shouldShowModal: state.isLayer2Visible,
      getCurrentOperationTime: () => Date.now() - operationStartRef.current
    }
  }
}

// ====================
// MAIN COMPONENT
// ====================

export interface DualLayerLoadingCoordinatorProps {
  // Content to render when data is ready
  children: React.ReactNode
  
  // Configuration
  config?: Partial<CoordinatorConfig>
  
  // Event callbacks
  onStateChange?: (state: DualLayerCoordinatorState) => void
  onError?: (error: Error) => void
  onOperationComplete?: () => void
  
  // Styling
  className?: string
  skeletonClassName?: string
  modalClassName?: string
  
  // Accessibility
  ariaLabel?: string
  skeletonAriaLabel?: string
  
  // Integration hooks
  enableAutoStart?: boolean        // Auto-start on mount
  integrationMode?: 'manual' | 'trpc' | 'event-driven'
  
  // Performance
  enableMetrics?: boolean
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

/**
 * DualLayerLoadingCoordinator Component
 * 
 * The brain of the dual-layer loading system that coordinates between:
 * - Layer 1: UserManagementSkeleton (immediate feedback)
 * - Layer 2: UserOperationModalOverlay (database operation feedback)
 * 
 * Features:
 * - State machine with 6 phases (INITIALIZING, LOADING_DATA, READY, ERROR, UPDATING, SEARCHING)
 * - Smooth fade-in/fade-out transitions
 * - Performance monitoring and optimization
 * - Comprehensive error handling and recovery
 * - Integration with tRPC hooks and event systems
 */
export function DualLayerLoadingCoordinator({
  children,
  config,
  onStateChange,
  onError,
  onOperationComplete,
  className,
  skeletonClassName,
  modalClassName,
  ariaLabel = 'User management interface',
  skeletonAriaLabel = 'Loading user management interface',
  enableAutoStart = false,
  integrationMode = 'manual',
  enableMetrics = false,
  onMetricsUpdate
}: DualLayerLoadingCoordinatorProps) {
  const { state, actions, helpers } = useDualLayerCoordinator(config)

  // State change callback
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state.currentState)
    }
  }, [state.currentState, onStateChange])

  // Error callback
  useEffect(() => {
    if (state.error && onError) {
      onError(state.error)
    }
  }, [state.error, onError])

  // Metrics callback
  useEffect(() => {
    if (enableMetrics && onMetricsUpdate) {
      onMetricsUpdate(state.metrics)
    }
  }, [state.metrics, enableMetrics, onMetricsUpdate])

  // Operation complete callback
  useEffect(() => {
    if (state.currentState === DualLayerCoordinatorState.READY && onOperationComplete) {
      onOperationComplete()
    }
  }, [state.currentState, onOperationComplete])

  // Auto-start initialization
  useEffect(() => {
    if (enableAutoStart) {
      actions.initialize()
    }
  }, [enableAutoStart, actions])

  // Modal overlay props
  const modalProps: UserOperationModalOverlayProps = {
    isVisible: helpers.shouldShowModal,
    state: state.modalState,
    className: modalClassName,
    zIndex: 9999,
    showProgress: state.showProgress,
    customMessage: state.customMessage,
    customDescription: state.customDescription,
    priority: state.priority,
    onClose: state.error ? actions.clearError : undefined,
    onCancel: state.modalState === UserOperationModalState.SEARCHING_USERS ? actions.clearError : undefined
  }

  return (
    <div 
      className={cn('relative', className)}
      role="main"
      aria-label={ariaLabel}
    >
      {/* Layer 1: UserManagementSkeleton */}
      {helpers.shouldShowSkeleton && (
        <div 
          className={cn(
            'transition-opacity duration-300 ease-in-out',
            state.currentState === DualLayerCoordinatorState.READY ? 'opacity-0 pointer-events-none' : 'opacity-100',
            skeletonClassName
          )}
          aria-hidden={!helpers.shouldShowSkeleton}
          style={{ zIndex: 1 }}
        >
          <UserManagementSkeleton
            ariaLabel={skeletonAriaLabel}
            rowCount={8}
            showHeader={true}
            showSearchBar={true}
            showFilters={true}
            showCreateButton={true}
            showActions={true}
            showPagination={true}
          />
        </div>
      )}

      {/* Layer 2: UserOperationModalOverlay */}
      {helpers.shouldShowModal && (
        <div 
          className="fixed inset-0 z-50"
          style={{ zIndex: 10000 }}
        >
          <UserOperationModalOverlay {...modalProps} />
        </div>
      )}

      {/* Layer 3: Actual Content */}
      {!helpers.shouldShowSkeleton && !helpers.shouldShowModal && (
        <div 
          className="transition-opacity duration-300 ease-in-out opacity-100"
          style={{ zIndex: 2 }}
        >
          {children}
        </div>
      )}

      {/* Performance indicator (debug mode only) */}
      {state.config.debugMode && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-[10001]">
          <div>State: {state.currentState}</div>
          <div>Layer 1: {helpers.shouldShowSkeleton ? 'Visible' : 'Hidden'}</div>
          <div>Layer 2: {helpers.shouldShowModal ? 'Visible' : 'Hidden'}</div>
          <div>Renders: {state.metrics.renderCount}</div>
          <div>Load Time: {state.metrics.totalLoadTime}ms</div>
          <div>Retries: {state.retryCount}/{state.config.maxRetries}</div>
        </div>
      )}
    </div>
  )
}

// ====================
// CONVENIENCE COMPONENTS
// ====================

/**
 * Simplified wrapper for common use cases
 */
export function UserManagementDualLayerCoordinator({
  children,
  ...props
}: Omit<DualLayerLoadingCoordinatorProps, 'children'> & { 
  children: React.ReactNode 
}) {
  return (
    <DualLayerLoadingCoordinator
      enableAutoStart={true}
      integrationMode="trpc"
      {...props}
    >
      {children}
    </DualLayerLoadingCoordinator>
  )
}

/**
 * Event-driven coordinator for integration with existing components
 */
export function EventDrivenDualLayerCoordinator({
  children,
  ...props
}: Omit<DualLayerLoadingCoordinatorProps, 'children' | 'enableAutoStart'> & { 
  children: React.ReactNode 
}) {
  const { state, actions } = useDualLayerCoordinator(props.config)

  // Event listeners for existing UserManagement events
  useEffect(() => {
    const handleOperationStart = (event: CustomEvent) => {
      const { operationType, priority, customMessage, customDescription } = event.detail
      actions.startOperation(operationType, { priority, customMessage, customDescription })
    }

    const handleOperationComplete = () => {
      actions.operationComplete()
    }

    const handleOperationError = (event: CustomEvent) => {
      actions.setError(event.detail?.error || new Error('Operation failed'))
    }

    const handleSearchStart = () => {
      actions.startSearch()
    }

    const handleSearchComplete = () => {
      actions.searchComplete()
    }

    // Add event listeners
    window.addEventListener('user-operation-start', handleOperationStart as EventListener)
    window.addEventListener('user-operation-complete', handleOperationComplete)
    window.addEventListener('user-operation-error', handleOperationError as EventListener)
    window.addEventListener('user-search-start', handleSearchStart)
    window.addEventListener('user-search-complete', handleSearchComplete)

    // Cleanup
    return () => {
      window.removeEventListener('user-operation-start', handleOperationStart as EventListener)
      window.removeEventListener('user-operation-complete', handleOperationComplete)
      window.removeEventListener('user-operation-error', handleOperationError as EventListener)
      window.removeEventListener('user-search-start', handleSearchStart)
      window.removeEventListener('user-search-complete', handleSearchComplete)
    }
  }, [actions])

  return (
    <DualLayerLoadingCoordinator
      enableAutoStart={true}
      integrationMode="event-driven"
      {...props}
    >
      {children}
    </DualLayerLoadingCoordinator>
  )
}

export default DualLayerLoadingCoordinator
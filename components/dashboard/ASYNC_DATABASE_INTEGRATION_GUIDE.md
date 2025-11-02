# Asynchronous Database Query Integration Guide

## Overview

This guide covers the asynchronous database query integration for the admin user management interface, which seamlessly connects tRPC routers with the dual-layer loading mechanism to ensure proper loading state coordination during database operations.

## Features

### ✅ Core Integration Features
- **tRPC Integration**: Connects with existing tRPC routers in `lib/trpc/routers/admin-users.ts`
- **Dual-Layer Loading**: Seamless coordination with the DualLayerLoadingCoordinator
- **React Query Patterns**: Enhanced with caching, retry logic, and performance monitoring
- **Modal Overlay Coordination**: Proper loading state dispatch during all database operations
- **Optimistic Updates**: Supports optimistic UI updates with proper state management
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Performance Monitoring**: Built-in performance metrics collection and optimization
- **Query Cancellation**: Proper cleanup and cancellation of ongoing operations

### 🎯 Database Operations Support
- **Initial Load**: Fetch all users → trigger LOADING_DATA → show modal → transition to READY
- **User Creation**: CREATE_USER operation → UPDATING state → modal overlay → success transition
- **User Updates**: UPDATE_USER operation → UPDATING state → modal overlay → data refresh
- **User Deletion**: DELETE_USER operation → UPDATING state → modal overlay → list update
- **Search Operations**: SEARCH_USERS operation → SEARCHING state → filtered results

## Architecture

### 1. Main Integration Hook: `useAdminUsersWithLoading`

```typescript
const {
  usersQuery,
  createUserMutation,
  updateUserMutation,
  deleteUserMutation,
  updateUserRoleMutation,
  isLoading,
  currentOperation,
  loadingProgress,
  performance,
  refreshAll,
  cancelAllOperations,
  retryFailedOperation,
  clearCache,
  updateConfig,
  searchUsers,
  filterByRole,
  goToPage
} = useAdminUsersWithLoading(initialConfig)
```

### 2. Coordinated Query Hook: `useCoordinatedUsersQuery`

Enhanced tRPC query with dual-layer loading coordination:

```typescript
const usersQuery = useCoordinatedUsersQuery(config, {
  enabled: true,
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false
})
```

### 3. Coordinated Mutation Hook: `useCoordinatedMutation`

Mutation hook with optimistic updates and loading coordination:

```typescript
const createUserMutation = useCoordinatedMutation<Profile, UserCreateData>(
  (variables) => trpc.admin.users.createUser.mutateAsync(variables),
  {
    operationType: DatabaseOperationType.CREATE_USER,
    loadingMessage: 'Creating user account...',
    errorMessage: 'Failed to create user',
    optimisticUpdate: true,
    onSuccess: (data) => {
      toast.success('User created successfully')
      utils.admin.users.getUsers.invalidate()
    }
  }
)
```

## Usage Examples

### Basic UserManagement Component

```tsx
import { UserManagementEnhancedWithLoading } from '@/components/dashboard/user-management-enhanced-with-loading'

export function AdminDashboard() {
  return (
    <div className="p-6">
      <UserManagementEnhancedWithLoading />
    </div>
  )
}
```

### Advanced Custom Integration

```tsx
import { useAdminUsersWithLoading } from '@/hooks/use-admin-users-with-loading'
import { DualLayerLoadingCoordinator } from '@/components/dashboard/dual-layer-loading-coordinator'

export function CustomUserManagement() {
  const {
    usersQuery,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    isLoading,
    currentOperation,
    performance,
    searchUsers,
    filterByRole
  } = useAdminUsersWithLoading({
    page: 1,
    limit: 50,
    role: 'all'
  })

  return (
    <DualLayerLoadingCoordinator
      enableAutoStart={true}
      integrationMode="trpc"
      onStateChange={(state) => {
        console.log('Loading state:', state)
      }}
      onError={(error) => {
        toast.error(`Operation failed: ${error.message}`)
      }}
    >
      <div className="space-y-6">
        {/* Search */}
        <input
          placeholder="Search users..."
          onChange={(e) => searchUsers(e.target.value)}
        />
        
        {/* Filter */}
        <select onChange={(e) => filterByRole(e.target.value as UserRole | 'all')}>
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        
        {/* Performance indicator */}
        {performance.totalQueryTime > 1000 && (
          <div className="text-yellow-600">
            Query time: {performance.totalQueryTime}ms (slow)
          </div>
        )}
        
        {/* Users table */}
        {usersQuery.data?.users.map(user => (
          <div key={user.id} className="border p-4 rounded">
            <div className="font-semibold">{user.email}</div>
            <div className="text-sm text-gray-600">{user.first_name} {user.last_name}</div>
            <div className="flex space-x-2 mt-2">
              <button onClick={() => handleEditUser(user)}>
                Edit
              </button>
              <button onClick={() => deleteUserMutation.mutate({ userId: user.id })}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </DualLayerLoadingCoordinator>
  )
}
```

## Loading State Coordination

### State Machine

The integration follows a specific state machine:

```
INITIALIZING → LOADING_DATA → READY
      ↓              ↓           ↓
   [50ms]      [200ms+]    [Data Ready]
      ↓              ↓           ↓
  Skeleton      Modal        Content
   Visible      Overlay     Visible
```

### Operation Types

```typescript
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
```

### Loading Priority

```typescript
export enum LoadingPriority {
  CRITICAL = 'critical',     // Above-the-fold content
  HIGH = 'high',             // Primary user actions
  MEDIUM = 'medium',         // Secondary content
  LOW = 'low',               // Background content
  BACKGROUND = 'background'  // Analytics, metadata
}
```

## Performance Monitoring

### Built-in Metrics

The integration provides comprehensive performance monitoring:

```typescript
interface PerformanceMetrics {
  totalQueryTime: number              // Total time for last query
  averageMutationTime: number         // Average mutation duration
  errorCount: number                  // Number of failed operations
  successCount: number                // Number of successful operations
  lastOperationDuration: number | null // Last operation duration
  isSlowOperation: boolean            // Flag for slow operations (>2s)
}
```

### Performance Monitoring Panel

```tsx
{performance.errorCount > 0 && (
  <Card className="border-yellow-200 bg-yellow-50/50">
    <CardHeader>
      <CardTitle className="text-yellow-800">
        Performance Monitoring
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-yellow-700">Query Time</div>
          <div className="text-yellow-600">{performance.totalQueryTime}ms</div>
        </div>
        <div>
          <div className="text-yellow-700">Error Rate</div>
          <div className="text-yellow-600">
            {Math.round((performance.errorCount / (performance.errorCount + performance.successCount)) * 100)}%
          </div>
        </div>
        <div>
          <div className="text-yellow-700">Avg Mutation</div>
          <div className="text-yellow-600">{Math.round(performance.averageMutationTime)}ms</div>
        </div>
        <div>
          <div className="text-yellow-700">Operations</div>
          <div className="text-yellow-600">{performance.successCount + performance.errorCount}</div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

## Error Handling & Recovery

### Automatic Retry

The integration includes automatic retry mechanisms:

```typescript
// Configuration
const config = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enablePerformanceMonitoring: true,
  debugMode: false
}
```

### Manual Retry

```tsx
<Button onClick={retryFailedOperation} variant="outline">
  <RefreshCw className="h-4 w-4 mr-2" />
  Retry
</Button>
```

### Error Boundary Integration

```tsx
const handleError = useCallback((error: Error) => {
  console.error('Database operation failed:', error)
  
  // Log to monitoring service
  if (error.message.includes('network')) {
    // Handle network errors
    toast.error('Network error. Please check your connection.')
  } else if (error.message.includes('permission')) {
    // Handle permission errors
    toast.error('You do not have permission to perform this action.')
  } else {
    // Generic error handling
    toast.error(`Operation failed: ${error.message}`)
  }
}, [])
```

## Optimistic Updates

### Enabling Optimistic Updates

```typescript
const updateUserMutation = useCoordinatedMutation<Profile, UserUpdateData>(
  (variables) => trpc.admin.users.updateUserProfile.mutateAsync(variables),
  {
    optimisticUpdate: true,
    onMutate: (variables) => {
      // Optimistically update the UI
      setUsers(prev => prev.map(user => 
        user.id === variables.userId 
          ? { ...user, first_name: variables.firstName, last_name: variables.lastName }
          : user
      ))
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      setUsers(prev => prev) // Revert to server state
      toast.error('Failed to update user')
    }
  }
)
```

### Rollback on Error

The integration automatically handles optimistic update rollback:

```typescript
// If mutation fails, the optimistic update is automatically reverted
try {
  await updateUserMutation.mutateAsync(userData)
  // Success - optimistic update is confirmed
} catch (error) {
  // Error - optimistic update is automatically rolled back
  console.error('Update failed:', error)
}
```

## Query Cancellation

### Automatic Cancellation

The integration supports automatic query cancellation:

```typescript
const cancelAllOperations = useCallback(() => {
  // Cancel current queries
  usersQuery.cancel()
  // Reset loading coordinator
  actions.reset()
}, [usersQuery.cancel, actions])
```

### Component Cleanup

```tsx
useEffect(() => {
  return () => {
    // Cleanup on unmount
    cancelAllOperations()
  }
}, [cancelAllOperations])
```

## Caching Strategy

### React Query Integration

```typescript
// Cache configuration
const queryConfig = {
  staleTime: 1000 * 60 * 5,    // 5 minutes
  cacheTime: 1000 * 60 * 10,   // 10 minutes
  refetchOnWindowFocus: false,  // Disable automatic refetch
  refetchOnReconnect: true     // Enable refetch on reconnect
}
```

### Cache Invalidation

```typescript
const clearCache = useCallback(() => {
  // Invalidate all user-related queries
  utils.admin.users.getUsers.invalidate()
}, [utils])

// Automatic cache invalidation after mutations
const createUserMutation = useCoordinatedMutation(
  (variables) => trpc.admin.users.createUser.mutateAsync(variables),
  {
    onSuccess: () => {
      // Automatically refresh the users list
      utils.admin.users.getUsers.invalidate()
    }
  }
)
```

## TypeScript Types

### Main Integration Hook

```typescript
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
  loadingProgress: Progress | null
  
  // Performance and monitoring
  performance: PerformanceMetrics
  
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
```

### Query Configuration

```typescript
interface UserQueryConfig {
  page: number
  limit: number
  search?: string
  role?: UserRole | 'all'
}
```

### Mutation Results

```typescript
interface CoordinatedMutationResult<TData = any> {
  mutate: (variables: any) => Promise<TData>
  mutateAsync: (variables: any) => Promise<TData>
  isPending: boolean
  error: Error | null
  reset: () => void
  optimisticData: TData | null
  isOptimistic: boolean
  operationType: DatabaseOperationType | null
  customLoadingMessage: string
  customErrorMessage: string
}
```

## Configuration Options

### Coordinator Configuration

```typescript
interface CoordinatorConfig {
  initialLoadDelay: number              // 50ms default
  dataReadyThreshold: number           // 200ms default
  skeletonFadeOutDuration: number      // 300ms default
  modalFadeOutDuration: number         // 250ms default
  errorRetryDelay: number              // 1000ms default
  maxRetries: number                   // 3 default
  enablePerformanceMonitoring: boolean // true default
  debugMode: boolean                   // false default
}
```

### Usage

```typescript
const { state, actions } = useDualLayerCoordinator({
  initialLoadDelay: 100,              // Longer delay
  maxRetries: 5,                      // More retries
  enablePerformanceMonitoring: true,  // Enable monitoring
  debugMode: true                     // Enable debug logging
})
```

## Best Practices

### 1. Error Handling

- Always provide meaningful error messages
- Use specific error handling for different error types
- Implement retry logic for transient errors
- Log errors for monitoring and debugging

### 2. Performance

- Monitor query performance and optimize slow operations
- Use appropriate cache times for different data types
- Implement query cancellation for better user experience
- Minimize re-renders during state transitions

### 3. User Experience

- Provide immediate feedback with optimistic updates
- Use appropriate loading states for different operations
- Implement proper loading state coordination
- Ensure accessibility with proper ARIA labels

### 4. State Management

- Keep loading states in sync with actual operations
- Use proper cleanup for subscriptions and timers
- Implement proper rollback for failed optimistic updates
- Coordinate between multiple related operations

## Troubleshooting

### Common Issues

1. **Loading state not updating**
   - Check if coordinator is properly initialized
   - Verify actions are being dispatched correctly
   - Ensure proper cleanup of timers

2. **Optimistic updates not rolling back**
   - Verify onMutate and onError callbacks are set
   - Check if error handling is properly implemented
   - Ensure state restoration logic is correct

3. **Performance issues**
   - Monitor query times and implement optimizations
   - Use appropriate cache strategies
   - Implement proper query cancellation

4. **TypeScript errors**
   - Ensure all types are properly imported
   - Check for proper type definitions
   - Verify API response types match expectations

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const { state, actions } = useDualLayerCoordinator({
  debugMode: true  // Enable detailed logging
})
```

Debug information is shown in the bottom-right corner when enabled.

## Conclusion

This asynchronous database query integration provides a robust foundation for managing database operations with proper loading state coordination. It seamlessly connects tRPC routers with the dual-layer loading system, providing an excellent user experience with comprehensive error handling, performance monitoring, and optimistic updates.

For additional support or questions, refer to the existing implementation examples or consult the component documentation.
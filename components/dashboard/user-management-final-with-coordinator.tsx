'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Profile, UserRole } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Edit, Trash2, UserPlus, X, Save, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AsyncButton } from '@/components/ui/async-button'
import { UserOperationModalState } from './user-operation-modal-overlay'
import { ModernAddUserModal } from './modern-add-user-modal'
import { 
  DualLayerLoadingCoordinator, 
  DatabaseOperationType, 
  PerformanceMetrics 
} from './dual-layer-loading-coordinator'
import { LoadingPriority } from '@/components/ui/loading-states'
import toast from 'react-hot-toast'

/**
 * Final UserManagement Component with DualLayerLoadingCoordinator Integration
 * 
 * This is the production-ready implementation that seamlessly integrates the dual-layer
 * loading coordination system with the existing user management functionality.
 */
export default function UserManagementFinalWithCoordinator() {
  // Core state
  const [showModernAddUserModal, setShowModernAddUserModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [tempFirstName, setTempFirstName] = useState('')
  const [tempLastName, setTempLastName] = useState('')
  const [tempRole, setTempRole] = useState<UserRole>('user')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  
  // Coordinator state
  const [coordinatorMetrics, setCoordinatorMetrics] = useState<PerformanceMetrics | null>(null)
  const [operationHistory, setOperationHistory] = useState<Array<{operation: string, timestamp: number}>>([])

  const utils = trpc.useUtils()

  // Helper function to add operations to history
  const addOperationToHistory = useCallback((operation: string) => {
    setOperationHistory(prev => [
      { operation, timestamp: Date.now() },
      ...prev.slice(0, 9) // Keep last 10 operations
    ])
  }, [])

  // Enhanced tRPC queries with coordinator integration
  const { data: usersData, isLoading, error, refetch } = trpc.admin.users.getUsers.useQuery({
    page: 1,
    limit: 50,
  }, {
    // Configure query for optimal coordinator integration
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.data?.code === 'UNAUTHORIZED') return false
      return failureCount < 3
    }
  })

  // Handle query status changes for coordinator integration
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch users:', error)
      // Dispatch error to coordinator
      window.dispatchEvent(new CustomEvent('user-operation-error', {
        detail: { error: new Error(error.message) }
      }))
      addOperationToHistory('Fetch Failed')
    }
  }, [error, addOperationToHistory])

  useEffect(() => {
    if (usersData && !isLoading) {
      // Dispatch success to coordinator
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('user-operation-complete'))
      }, 300) // Small delay for smooth transition
      addOperationToHistory('Users Loaded')
    }
  }, [usersData, isLoading, addOperationToHistory])

  // Enhanced mutations with coordinator integration
  const updateRoleMutation = trpc.admin.users.updateUserRole.useMutation({
    onMutate: () => {
      // Start operation in coordinator
      window.dispatchEvent(new CustomEvent('user-operation-start', {
        detail: { 
          operationType: DatabaseOperationType.UPDATE_USER,
          priority: LoadingPriority.HIGH,
          customMessage: 'Updating user role...',
          customDescription: 'Modifying user permissions'
        }
      }))
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user role')
      window.dispatchEvent(new CustomEvent('user-operation-error', {
        detail: { error: new Error(error?.message || 'Update failed') }
      }))
      addOperationToHistory('Update Role Failed')
    },
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent('user-operation-complete'))
      addOperationToHistory('Role Updated')
    },
  })

  const updateProfileMutation = trpc.admin.users.updateUserProfile.useMutation({
    onMutate: () => {
      window.dispatchEvent(new CustomEvent('user-operation-start', {
        detail: { 
          operationType: DatabaseOperationType.UPDATE_USER,
          priority: LoadingPriority.HIGH,
          customMessage: 'Updating user profile...',
          customDescription: 'Saving user information'
        }
      }))
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user profile')
      window.dispatchEvent(new CustomEvent('user-operation-error', {
        detail: { error: new Error(error?.message || 'Update failed') }
      }))
      addOperationToHistory('Update Profile Failed')
    },
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent('user-operation-complete'))
      addOperationToHistory('Profile Updated')
    },
  })

  const deleteUserMutation = trpc.admin.users.deleteUser.useMutation({
    onMutate: () => {
      window.dispatchEvent(new CustomEvent('user-operation-start', {
        detail: { 
          operationType: DatabaseOperationType.DELETE_USER,
          priority: LoadingPriority.CRITICAL,
          customMessage: 'Deleting user...',
          customDescription: 'Removing user account and associated data'
        }
      }))
    },
    onSuccess: () => {
      refetch()
      setDeleteUserId(null)
      window.dispatchEvent(new CustomEvent('user-operation-complete'))
      addOperationToHistory('User Deleted')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete user')
      window.dispatchEvent(new CustomEvent('user-operation-error', {
        detail: { error: new Error(error?.message || 'Delete failed') }
      }))
      addOperationToHistory('Delete Failed')
    },
  })

  // Enhanced event handlers with coordinator integration
  const handleEditUser = useCallback((user: Profile) => {
    setEditingUserId(user.id)
    setTempFirstName(user.first_name || '')
    setTempLastName(user.last_name || '')
    setTempRole(user.role)
    
    // Track operation for analytics
    addOperationToHistory('Started Editing User')
  }, [addOperationToHistory])

  const handleUpdateUser = useCallback(async () => {
    if (!editingUserId) throw new Error('No user selected for editing')
    if (!tempFirstName.trim() || !tempLastName.trim()) {
      throw new Error('First name and last name are required')
    }
    
    try {
      // Update role first
      await updateRoleMutation.mutateAsync({
        userId: editingUserId,
        role: tempRole,
      })
      
      // Then update profile fields
      await updateProfileMutation.mutateAsync({
        userId: editingUserId,
        firstName: tempFirstName.trim(),
        lastName: tempLastName.trim(),
      })
      
      setEditingUserId(null)
      setTempFirstName('')
      setTempLastName('')
      setTempRole('user')
      
    } catch (error) {
      // Errors are handled by mutation onError callbacks
      console.error('Update failed:', error)
      throw error
    }
  }, [editingUserId, tempFirstName, tempLastName, tempRole, updateRoleMutation, updateProfileMutation])

  const handleCancelEdit = useCallback(() => {
    setEditingUserId(null)
    setTempFirstName('')
    setTempLastName('')
    setTempRole('user')
    addOperationToHistory('Cancelled Edit')
  }, [addOperationToHistory])

  const handleDeleteUser = useCallback(() => {
    if (deleteUserId) {
      deleteUserMutation.mutate({ userId: deleteUserId })
    }
  }, [deleteUserId, deleteUserMutation])

  const handleCreateUser = useCallback(() => {
    setShowModernAddUserModal(true)
    addOperationToHistory('Started Creating User')
  }, [addOperationToHistory])

  const handleUserFormSuccess = useCallback(() => {
    refetch()
    utils.admin.users.getUsers.invalidate()
    utils.admin.dashboard.getCriticalDashboardData.invalidate()
    addOperationToHistory('User Created Successfully')
  }, [refetch, utils, addOperationToHistory])

  // Search functionality with coordinator
  const handleSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      window.dispatchEvent(new CustomEvent('user-search-start'))
      addOperationToHistory(`Search: ${query}`)
      
      // Simulate search delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('user-search-complete'))
        addOperationToHistory('Search Completed')
      }, 1000)
    }
  }, [addOperationToHistory])

  // Coordinator callbacks
  const handleCoordinatorStateChange = useCallback((state: any) => {
    console.log('Coordinator state:', state.currentState)
  }, [])

  const handleCoordinatorError = useCallback((error: Error) => {
    toast.error(`Coordinator error: ${error.message}`)
    addOperationToHistory('Coordinator Error')
  }, [addOperationToHistory])

  const handleCoordinatorOperationComplete = useCallback(() => {
    console.log('Coordinator operation completed')
  }, [])

  const handleCoordinatorMetricsUpdate = useCallback((metrics: PerformanceMetrics) => {
    setCoordinatorMetrics(metrics)
    
    // Log performance warnings
    if (metrics.totalLoadTime > 1000) {
      console.warn('Slow loading detected:', metrics.totalLoadTime, 'ms')
      addOperationToHistory(`Performance Warning: ${metrics.totalLoadTime}ms`)
    }
  }, [addOperationToHistory])

  // Error state
  if (error) {
    return (
      <DualLayerLoadingCoordinator
        onStateChange={handleCoordinatorStateChange}
        onError={handleCoordinatorError}
        onOperationComplete={handleCoordinatorOperationComplete}
        enableMetrics={true}
        onMetricsUpdate={handleCoordinatorMetricsUpdate}
        className="p-4"
      >
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </DualLayerLoadingCoordinator>
    )
  }

  // Create user form
  if (showModernAddUserModal) {
    return (
      <DualLayerLoadingCoordinator
        enableAutoStart={false}
        onStateChange={handleCoordinatorStateChange}
        onError={handleCoordinatorError}
        onOperationComplete={handleCoordinatorOperationComplete}
        enableMetrics={true}
        onMetricsUpdate={handleCoordinatorMetricsUpdate}
      >
        <ModernAddUserModal
          open={showModernAddUserModal}
          onOpenChange={setShowModernAddUserModal}
          onSuccess={handleUserFormSuccess}
        />
      </DualLayerLoadingCoordinator>
    )
  }

  // Main user management interface with coordinator
  return (
    <DualLayerLoadingCoordinator
      enableAutoStart={true}
      integrationMode="event-driven"
      onStateChange={handleCoordinatorStateChange}
      onError={handleCoordinatorError}
      onOperationComplete={handleCoordinatorOperationComplete}
      enableMetrics={true}
      onMetricsUpdate={handleCoordinatorMetricsUpdate}
      className="space-y-4 pt-6 pl-6 pr-6 pb-6"
    >
      {/* Enhanced header with coordinator status */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">User Management</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {coordinatorMetrics && (
              <>
                <span>Load time: {coordinatorMetrics.totalLoadTime}ms</span>
                <span>•</span>
                <span>Operations: {coordinatorMetrics.renderCount}</span>
              </>
            )}
          </div>
        </div>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          onClick={handleCreateUser}
          aria-label="Create new user"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Operation history (debug/analytics) */}
      {operationHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Operations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              {operationHistory.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground"
                >
                  {item.operation}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main user table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">All Users List</CardTitle>
          <CardDescription className="text-center">
            Double-click a row or click the edit icon to edit a record inline, then save or cancel changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <Table className="border border-border rounded-lg shadow-sm" aria-label="User management table">
            <TableHeader className="bg-blue-500/70 [&_tr]:border-0 hover:[&_tr]:bg-blue-500/10">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-0">
              {usersData?.users.map((user) => (
                <TableRow
                  key={user.id}
                  onDoubleClick={() => handleEditUser(user)}
                  className={`transition-colors duration-200 ${
                    editingUserId === user.id 
                      ? 'bg-green-50' 
                      : 'bg-transparent hover:bg-blue-500/10'
                  }`}
                >
                  <TableCell className="font-medium">{user.email}</TableCell>
                  
                  <TableCell>
                    {editingUserId === user.id ? (
                      <Input
                        value={tempFirstName}
                        onChange={(e) => setTempFirstName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateUser()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        placeholder="First Name"
                      />
                    ) : (
                      user.first_name || '-'
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingUserId === user.id ? (
                      <Input
                        value={tempLastName}
                        onChange={(e) => setTempLastName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateUser()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        placeholder="Last Name"
                      />
                    ) : (
                      user.last_name || '-'
                    )}
                  </TableCell>
                  
                  <TableCell className="capitalize">
                    {editingUserId === user.id ? (
                      <Select value={tempRole} onValueChange={(value: UserRole) => setTempRole(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      user.role
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      {editingUserId === user.id ? (
                        <>
                          <AsyncButton
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                            onClick={handleUpdateUser}
                            aria-label="Save user changes"
                            loadingText="Saving..."
                            successText="Saved!!"
                            errorText="Save failed. Please try again."
                            successDuration={2000}
                            onStateChange={(state) => {
                              if (state === 'success') {
                                setTimeout(() => {
                                  setEditingUserId(null)
                                }, 2000)
                              }
                            }}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </AsyncButton>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                            onClick={handleCancelEdit}
                            aria-label="Cancel editing user"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                            onClick={() => handleEditUser(user)}
                            aria-label={`Edit user ${user.email}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                                onClick={() => setDeleteUserId(user.id)}
                                aria-label={`Delete user ${user.email}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-6 w-6 text-destructive" />
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                </div>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.email}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-primary/10 hover:bg-primary/30">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteUser}
                                  disabled={deleteUserMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/70 text-white"
                                >
                                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DualLayerLoadingCoordinator>
  )
}
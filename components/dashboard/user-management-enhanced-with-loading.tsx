// ============================================
// components/dashboard/user-management-enhanced-with-loading.tsx
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { useAdminUsersWithLoading } from '@/hooks/use-admin-users-with-loading'
import { Profile, UserRole } from '@/types'
import { DualLayerLoadingCoordinator } from '@/components/dashboard/dual-layer-loading-coordinator'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AsyncButton from '@/components/ui/async-button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
import { 
  Edit, 
  Trash2, 
  UserPlus, 
  X, 
  Save, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Enhanced UserManagement component with dual-layer loading integration
export function UserManagementEnhancedWithLoading() {
  // Use the comprehensive integration hook
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
    updateConfig,
    searchUsers,
    filterByRole,
    goToPage,
    refreshAll,
    cancelAllOperations,
    retryFailedOperation,
    clearCache
  } = useAdminUsersWithLoading()

  // Local component state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [tempFirstName, setTempFirstName] = useState('')
  const [tempLastName, setTempLastName] = useState('')
  const [tempRole, setTempRole] = useState<UserRole>('user')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Update config when search or filter changes
  useEffect(() => {
    searchUsers(searchTerm)
  }, [searchTerm, searchUsers])

  useEffect(() => {
    filterByRole(roleFilter)
  }, [roleFilter, filterByRole])

  // Handle user editing
  const handleEditUser = (user: Profile) => {
    setEditingUserId(user.id)
    setTempFirstName(user.first_name || '')
    setTempLastName(user.last_name || '')
    setTempRole(user.role)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setTempFirstName('')
    setTempLastName('')
    setTempRole('user')
  }

  const handleSaveUser = async () => {
    if (!editingUserId) return

    updateUserMutation.mutate({
      userId: editingUserId,
      firstName: tempFirstName.trim(),
      lastName: tempLastName.trim()
    })
    
    updateUserRoleMutation.mutate({
      userId: editingUserId,
      role: tempRole
    })
    
    setEditingUserId(null)
    toast.success('User updated successfully')
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    deleteUserMutation.mutate({ userId: deleteUserId })
    setDeleteUserId(null)
  }

  // Create user form
  const CreateUserForm = () => (
    <div className="p-6 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold mb-4">Create New User</h3>
      <form onSubmit={async (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget as HTMLFormElement)
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const role = formData.get('role') as UserRole

        try {
          await createUserMutation.mutateAsync({
            email,
            password,
            firstName,
            lastName,
            role
          })
          setShowCreateForm(false)
          toast.success('User created successfully')
        } catch (error) {
          toast.error('Failed to create user')
        }
      }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input name="firstName" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input name="lastName" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input name="password" type="password" required />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role</label>
          <Select name="role" defaultValue="user">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreateForm(false)}
          >
            Cancel
          </Button>
          <AsyncButton
            type="submit"
            onClick={() => {
              // Form submission is handled by the form onSubmit
              return Promise.resolve()
            }}
            loadingText="Creating..."
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </AsyncButton>
        </div>
      </form>
    </div>
  )

  // Error handling with retry
  if (usersQuery.error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Users
            </CardTitle>
            <CardDescription>
              {usersQuery.error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button onClick={retryFailedOperation} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DualLayerLoadingCoordinator
      enableAutoStart={true}
      integrationMode="trpc"
      onStateChange={(state) => {
        console.log('Loading state changed:', state)
      }}
      onError={(error) => {
        toast.error(`Operation failed: ${error.message}`)
      }}
      onOperationComplete={() => {
        console.log('Operation completed')
      }}
    >
      <div className="space-y-6 p-6">
        {/* Header with Performance Metrics */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
            {performance.totalQueryTime > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Query time: {performance.totalQueryTime}ms | 
                Success rate: {Math.round((performance.successCount / (performance.successCount + performance.errorCount)) * 100)}%
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter by Role
                </label>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Results
                </label>
                <div className="text-sm text-muted-foreground p-2 border rounded">
                  {usersQuery.data?.total || 0} users found
                  {isLoading && (
                    <div className="mt-1 text-xs text-primary">
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create User Form */}
        {showCreateForm && <CreateUserForm />}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.data?.users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(
                      "transition-colors",
                      editingUserId === user.id && "bg-muted/50",
                      !editingUserId && "hover:bg-muted/50"
                    )}
                  >
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Input
                          value={tempFirstName}
                          onChange={(e) => setTempFirstName(e.target.value)}
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
                          placeholder="Last Name"
                        />
                      ) : (
                        user.last_name || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Select value={tempRole} onValueChange={(value) => setTempRole(value as UserRole)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {user.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingUserId === user.id ? (
                          <>
                            <AsyncButton
                              size="sm"
                              variant="outline"
                              onClick={handleSaveUser}
                              loadingText="Saving..."
                              successText="Saved!"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </AsyncButton>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.email}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AsyncButton
                                    variant="destructive"
                                    onClick={handleDeleteUser}
                                    loadingText="Deleting..."
                                  >
                                    Delete
                                  </AsyncButton>
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

            {/* Pagination */}
            {usersQuery.data && usersQuery.data.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {Math.floor((usersQuery.data?.total || 0) / (usersQuery.data?.users?.length || 1)) + 1} of {usersQuery.data?.pages || 1}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Math.floor((usersQuery.data?.total || 0) / (usersQuery.data?.users?.length || 1)) + 1 <= 1}
                    onClick={() => {
                      const currentPage = Math.floor((usersQuery.data?.total || 0) / (usersQuery.data?.users?.length || 1)) + 1
                      goToPage(Math.max(1, currentPage - 1))
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Math.floor((usersQuery.data?.total || 0) / (usersQuery.data?.users?.length || 1)) + 1 >= (usersQuery.data?.pages || 1)}
                    onClick={() => {
                      const currentPage = Math.floor((usersQuery.data?.total || 0) / (usersQuery.data?.users?.length || 1)) + 1
                      goToPage(Math.min(usersQuery.data?.pages || 1, currentPage + 1))
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Monitoring Panel */}
        {performance.errorCount > 0 || performance.averageMutationTime > 1000 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Performance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-yellow-700 font-medium">Query Time</div>
                  <div className="text-yellow-600">{performance.totalQueryTime}ms</div>
                </div>
                <div>
                  <div className="text-yellow-700 font-medium">Avg Mutation</div>
                  <div className="text-yellow-600">{Math.round(performance.averageMutationTime)}ms</div>
                </div>
                <div>
                  <div className="text-yellow-700 font-medium">Error Rate</div>
                  <div className="text-yellow-600">
                    {performance.errorCount + performance.successCount > 0 ? 
                      Math.round((performance.errorCount / (performance.errorCount + performance.successCount)) * 100) : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-yellow-700 font-medium">Operations</div>
                  <div className="text-yellow-600">{performance.successCount + performance.errorCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DualLayerLoadingCoordinator>
  )
}

export default UserManagementEnhancedWithLoading
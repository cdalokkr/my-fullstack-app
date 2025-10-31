'use client'

import { useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
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
import { CreateUserForm } from './create-user-form'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [showCreateUserForm, setShowCreateUserForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [tempFirstName, setTempFirstName] = useState('')
  const [tempLastName, setTempLastName] = useState('')
  const [tempRole, setTempRole] = useState<UserRole>('user')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const { data: usersData, isLoading, error, refetch } = trpc.admin.users.getUsers.useQuery({
    page: 1,
    limit: 50, // Adjust as needed
  })

  const updateRoleMutation = trpc.admin.users.updateUserRole.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to update user role')
    },
  })

  const updateProfileMutation = trpc.admin.users.updateUserProfile.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to update user profile')
    },
  })

  const deleteUserMutation = trpc.admin.users.deleteUser.useMutation({
    onSuccess: () => {
      refetch()
      setDeleteUserId(null)
    },
  })

  const handleEditUser = (user: Profile) => {
    setEditingUserId(user.id)
    setTempFirstName(user.first_name || '')
    setTempLastName(user.last_name || '')
    setTempRole(user.role)
  }

  const handleUpdateUser = async () => {
    if (!editingUserId) throw new Error('No user selected for editing')
    if (!tempFirstName.trim() || !tempLastName.trim()) {
      throw new Error('First name and last name are required')
    }
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Update role
    await updateRoleMutation.mutateAsync({
      userId: editingUserId,
      role: tempRole,
    })
    // Update profile fields
    await updateProfileMutation.mutateAsync({
      userId: editingUserId,
      firstName: tempFirstName.trim(),
      lastName: tempLastName.trim(),
    })
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setTempFirstName('')
    setTempLastName('')
    setTempRole('user')
  }

  const handleDeleteUser = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate({ userId: deleteUserId })
    }
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading users: {error.message}
      </div>
    )
  }

  if (showCreateUserForm) {
    return (
      <CreateUserForm
        mode="inline"
        onCancel={() => setShowCreateUserForm(false)}
        onSuccess={() => {
          refetch()
          utils.admin.users.getUsers.invalidate()
          utils.admin.dashboard.getCriticalDashboardData.invalidate()
        }}
      />
    )
  }

  return (
    <div className="space-y-4 pt-6 pl-6 pr-6 pb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowCreateUserForm(true)} aria-label="Create new user">
          <span className="inline-flex items-center justify-center w-4 h-4 mr-2">
            <UserPlus className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          </span>
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader className="m-0 p-0">
          <CardTitle className="text-center m-0 p-0">All Users List</CardTitle>
          <CardDescription className='m-0 p-0 text-muted-foreground text-center text-sm'>Double-click a row or click the edit icon to edit a record inline, then save or cancel changes.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-0 pt-0">
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
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : usersData?.users.map((user) => (
                    <TableRow
                      key={user.id}
                      onDoubleClick={() => handleEditUser(user)}
                      className={`transition-colors duration-200 ${
                        editingUserId === user.id ? 'bg-green-50' : 'bg-transparent hover:bg-blue-500/10'
                      }`}
                    >
                      <TableCell>{user.email}</TableCell>
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
                          <Select
                            value={tempRole}
                            onValueChange={(value: UserRole) => setTempRole(value)}
                          >
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
                                    refetch()
                                    utils.admin.users.getUsers.invalidate()
                                    utils.admin.dashboard.getCriticalDashboardData.invalidate()
                                    setTimeout(() => {
                                      setEditingUserId(null)
                                    }, 2000)
                                  }
                                }}
                              >
                                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                                Save
                              </AsyncButton>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                                onClick={handleCancelEdit}
                                aria-label="Cancel editing user"
                              >
                                <X className="h-4 w-4 mr-2" aria-hidden="true" />
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
                                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
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
                                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
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
                                    <AlertDialogCancel className="bg-primary/10 hover:bg-primary/30">Cancel</AlertDialogCancel>
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

    </div>
  )
}

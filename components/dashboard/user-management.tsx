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
import { Edit, Trash2, Plus, X, Save, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/auth'
import { AsyncButton } from '@/components/ui/async-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [showCreateUserForm, setShowCreateUserForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [tempFirstName, setTempFirstName] = useState('')
  const [tempLastName, setTempLastName] = useState('')
  const [tempRole, setTempRole] = useState<UserRole>('user')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors: formErrors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'user',
    },
  })

  const utils = trpc.useUtils()

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success('User created successfully!')
      reset()
      refetch()
      utils.admin.getUsers.invalidate()
      utils.admin.getCriticalDashboardData.invalidate()
      setTimeout(() => {
        setShowCreateUserForm(false)
      }, 2000)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    await createUserMutation.mutateAsync(data)
  }

  const { data: usersData, isLoading, error, refetch } = trpc.admin.getUsers.useQuery({
    page: 1,
    limit: 50, // Adjust as needed
  })

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to update user role')
    },
  })

  const updateProfileMutation = trpc.admin.updateUserProfile.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to update user profile')
    },
  })

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
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
      <div className="space-y-6 pt-6 pl-6 pr-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Add a new user to the system. They will receive an email invitation to set up their account.
                </CardDescription>
              </div>
              <Button variant="destructive" onClick={() => setShowCreateUserForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Row 1: First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    {...register('firstName')}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    {...register('lastName')}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Date of Birth, Mobile Number, and Role */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                {/* Mobile Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input
                    id="mobileNo"
                    type="tel"
                    placeholder="+1234567890"
                    {...register('mobileNo')}
                  />
                  {formErrors.mobileNo && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.mobileNo.message}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={watch('role')}
                    onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.role.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Email and Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register('email')}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    {...register('password')}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <AsyncButton
                onClick={async () => {
                  const isValid = await trigger()
                  if (!isValid) {
                    throw new Error('Please check your input')
                  }
                  const data = getValues()
                  await onSubmit(data)
                }}
                loadingText="Creating user..."
                successText="User created!"
                errorText="Failed to create user"
                successDuration={2000}
                className="w-full"
              >
                Create User
              </AsyncButton>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-6 pl-6 pr-6 pb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setShowCreateUserForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader className="m-0 p-0">
          <CardTitle className="text-center m-0 p-0">All Users List</CardTitle>
          <CardDescription className='m-0 p-0 text-muted-foreground text-center text-sm'>Double-click a row or click the edit icon to edit a record inline, then save or cancel changes.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-0 pt-0">
          <Table className="border border-border rounded-lg shadow-sm">
            <TableHeader className="bg-blue-500/30 [&_tr]:border-0">
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
                        editingUserId === user.id ? 'bg-muted' : ''
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
                                className='bg-blue-500 hover:bg-blue-500/80'
                                onClick={handleUpdateUser}

                                loadingText="Saving..."
                                successText="Saved!!"
                                errorText="Save failed. Please try again."
                                successDuration={2000}
                                onStateChange={(state) => {
                                  if (state === 'success') {
                                    refetch()
                                    utils.admin.getUsers.invalidate()
                                    utils.admin.getCriticalDashboardData.invalidate()
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
                                className="bg-red-500/30 hover:bg-red-500/50"
                                onClick={handleCancelEdit}
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
                                className='bg-blue-500/20 hover:bg-blue-500/30'
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-500/30 hover:bg-red-500/50"
                                    onClick={() => setDeleteUserId(user.id)}
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
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteUser}
                                      disabled={deleteUserMutation.isPending}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

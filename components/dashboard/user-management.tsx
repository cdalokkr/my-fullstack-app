"use client"

import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Profile, UserRole } from '@/types'
import { getDisplayName } from '@/lib/utils/user-name'
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
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EditButton, DeleteButton, AddButton } from '@/components/ui/action-button'
import { UserOperationModalState } from './user-operation-modal-overlay'
import { ModernAddUserForm } from './ModernAddUserForm'
import toast from 'react-hot-toast'

// Pagination Component
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
  onItemsPerPageChange: (itemsPerPage: number) => void
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> users
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <span className="sr-only">Go to previous page</span>
            ←
          </Button>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">Go to next page</span>
            →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const [showAddUserSheet, setShowAddUserSheet] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Default to 10 records per page
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')

  const utils = trpc.useUtils()

  // Fetch all users at once for client-side pagination
  const { data: usersData, isLoading, error, refetch } = trpc.admin.users.getUsers.useQuery({
    page: 1,
    limit: 9999, // Large number to get all users
    getAll: true, // Use new parameter to get all users
  })

  // Memoized filtered and paginated users
  const { paginatedUsers, totalFilteredPages, totalFilteredUsers } = useMemo(() => {
    if (!usersData?.users) {
      return { paginatedUsers: [], totalFilteredPages: 0, totalFilteredUsers: 0 }
    }

    let filteredUsers = usersData.users

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.middle_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.sex?.toLowerCase().includes(searchLower) ||
        user.date_of_birth?.toLowerCase().includes(searchLower) ||
        getDisplayName(user).toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter)
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return {
      paginatedUsers,
      totalFilteredPages: totalPages,
      totalFilteredUsers: filteredUsers.length
    }
  }, [usersData?.users, currentPage, itemsPerPage, searchTerm, roleFilter])

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleRoleFilterChange = (value: 'all' | 'admin' | 'user') => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const deleteUserMutation = trpc.admin.users.deleteUser.useMutation({
    onSuccess: () => {
      refetch()
      setDeleteUserId(null)
      window.dispatchEvent(new CustomEvent('user-operation-complete'))
    },
  })

  const handleEditUser = (user: Profile) => {
    setEditingUser(user)
  }

  const handleDeleteUser = () => {
    if (deleteUserId) {
      // Dispatch operation start event for modal overlay
      window.dispatchEvent(new CustomEvent('user-operation-start', {
        detail: { state: UserOperationModalState.DELETING_USER }
      }))
      deleteUserMutation.mutate({ userId: deleteUserId })
    }
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Error loading users: {error.message}
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header - matching admin dashboard style */}
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-border/20">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage user accounts and permissions
            {totalFilteredUsers !== undefined && ` (${totalFilteredUsers} users total)`}
          </p>
        </div>
        <AddButton
          onClick={() => setShowAddUserSheet(true)}
          aria-label="Create new user"
          size="md"
        >
          Create User
        </AddButton>
      </div>

      {/* Search and Filter Controls */}
      <Card className="shadow-lg bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search users by email, name, sex, or date of birth..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Role:</label>
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table Card */}
      <Card className="shadow-lg bg-muted/30">
        <CardHeader>
          <CardTitle>All Users List</CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            View and manage all user accounts. Click the edit button to update user information in a modal form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="border border-border rounded-lg shadow-sm" aria-label="User management table">
            <TableHeader className="bg-blue-500/70 [&_tr]:border-0 hover:[&_tr]:bg-blue-500/10">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Date of Birth</TableHead>
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
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
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
                : paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="transition-colors duration-200 bg-transparent hover:bg-blue-500/10"
                    >
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {getDisplayName(user) || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">
                        {user.sex || '-'}
                      </TableCell>
                      <TableCell>
                        {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="capitalize">
                        {user.role}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <EditButton
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            aria-label={`Edit user ${user.email}`}
                            className="min-w-[90px]"
                          >
                            Edit
                          </EditButton>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DeleteButton
                                size="sm"
                                onClick={() => setDeleteUserId(user.id)}
                                aria-label={`Delete user ${user.email}`}
                                className="min-w-[90px]"
                              >
                                Delete
                              </DeleteButton>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && paginatedUsers.length === 0 && (
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm || roleFilter !== 'all'
                    ? 'No users found matching your search criteria.'
                    : 'No users found.'
                  }
                </TableCell>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalFilteredPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalFilteredPages}
              onPageChange={setCurrentPage}
              totalItems={totalFilteredUsers}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Modern Add User Form with Built-in Sheet */}
      <ModernAddUserForm
        open={showAddUserSheet}
        onOpenChange={setShowAddUserSheet}
        useSheet={true}
        onSuccess={() => {
          refetch()
          utils.admin.users.getUsers.invalidate()
          utils.admin.dashboard.getCriticalDashboardData.invalidate()
        }}
        title="Add New User"
        description="Create a new user account with proper access permissions"
        refetch={refetch}
      />

      {/* Modern Edit User Form with Built-in Sheet */}
      <ModernAddUserForm
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        editingUser={editingUser}
        useSheet={true}
        onSuccess={() => {
          refetch()
          setEditingUser(null)
          utils.admin.users.getUsers.invalidate()
          utils.admin.dashboard.getCriticalDashboardData.invalidate()
        }}
        title="Edit User"
        description="Update user information and access permissions"
        refetch={refetch}
      />
    </div>
  )
}

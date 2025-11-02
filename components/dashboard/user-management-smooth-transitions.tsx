'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  DualLayerCoordinatorState,
  DualLayerCoordinatorStateData,
  DatabaseOperationType,
  useDualLayerCoordinator
} from './dual-layer-loading-coordinator'
import { SmoothTransitionManager, TransitionPhase } from './smooth-transition-manager'
import { 
  UserManagementSkeleton, 
  UserManagementSkeletonVariant 
} from './skeletons/user-management-skeleton'
import { UserOperationModalOverlay } from './user-operation-modal-overlay'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail,
  Calendar,
  Shield
} from 'lucide-react'

// ====================
// TYPES AND INTERFACES
// ====================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user' | 'moderator'
  status: 'active' | 'inactive' | 'pending'
  lastLogin?: Date
  createdAt: Date
  avatar?: string
}

export interface UserManagementSmoothProps {
  // Data
  users?: User[]
  isLoading?: boolean
  error?: Error | null
  
  // Configuration
  enableSmoothTransitions?: boolean
  enableStaggeredReveal?: boolean
  enablePerformanceMonitoring?: boolean
  respectReducedMotion?: boolean
  
  // Event handlers
  onUserSelect?: (user: User) => void
  onUserEdit?: (user: User) => void
  onUserDelete?: (user: User) => void
  onUserCreate?: () => void
  onSearch?: (query: string) => void
  onFilter?: (filters: UserFilters) => void
  
  // Styling
  className?: string
  showActions?: boolean
  showBulkActions?: boolean
  compact?: boolean
  
  // Accessibility
  ariaLabel?: string
}

export interface UserFilters {
  role?: string[]
  status?: string[]
  search?: string
  dateRange?: {
    start?: Date
    end?: Date
  }
}

// ====================
// ENHANCED TABLE ROW COMPONENT
// ====================

interface EnhancedTableRowProps {
  user: User
  index: number
  onUserEdit?: (user: User) => void
  onUserDelete?: (user: User) => void
  onUserSelect?: (user: User) => void
  showActions?: boolean
  compact?: boolean
  enableTransitions?: boolean
}

function EnhancedTableRow({
  user,
  index,
  onUserEdit,
  onUserDelete,
  onUserSelect,
  showActions = true,
  compact = false,
  enableTransitions = true
}: EnhancedTableRowProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  // Trigger staggered reveal with delay
  useEffect(() => {
    if (enableTransitions) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, index * 50) // 50ms stagger delay
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [index, enableTransitions])

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'inactive':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const rowHeight = compact ? 'py-2' : 'py-3'
  const cellPadding = compact ? 'px-4' : 'px-5'
  const avatarSize = compact ? 'h-6 w-6' : 'h-8 w-8'
  const buttonSize = compact ? 'h-7 w-7' : 'h-8 w-8'

  return (
    <TableRow 
      className={cn(
        'transition-all duration-300 ease-out',
        rowHeight,
        enableTransitions && [
          'content-row-reveal',
          isVisible ? 'visible' : 'invisible'
        ],
        'hover:bg-muted/50 cursor-pointer',
        compact ? 'text-sm' : 'text-base'
      )}
      onClick={() => onUserSelect?.(user)}
      role="row"
      aria-label={`User ${user.firstName} ${user.lastName}`}
    >
      {/* User Avatar and Email */}
      <TableCell className={cellPadding}>
        <div className="flex items-center space-x-3">
          <div className={cn('rounded-full bg-primary/10 flex items-center justify-center', avatarSize)}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.firstName} ${user.lastName}`}
                className={cn('rounded-full object-cover', avatarSize)}
              />
            ) : (
              <Mail className={cn('text-muted-foreground', compact ? 'h-3 w-3' : 'h-4 w-4')} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{user.email}</div>
            {!compact && (
              <div className="text-sm text-muted-foreground truncate">
                {user.firstName} {user.lastName}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* First Name (hidden on compact) */}
      {!compact && (
        <TableCell className={cellPadding}>
          <span className="font-medium">{user.firstName}</span>
        </TableCell>
      )}

      {/* Last Name (hidden on compact) */}
      {!compact && (
        <TableCell className={cellPadding}>
          <span className="font-medium">{user.lastName}</span>
        </TableCell>
      )}

      {/* Role */}
      <TableCell className={cellPadding}>
        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center w-fit">
          <Shield className="h-3 w-3 mr-1" />
          {user.role}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell className={cellPadding}>
        <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
          {user.status}
        </Badge>
      </TableCell>

      {/* Last Login (optional) */}
      {user.lastLogin && !compact && (
        <TableCell className={cellPadding}>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {user.lastLogin.toLocaleDateString()}
          </div>
        </TableCell>
      )}

      {/* Actions */}
      {showActions && (
        <TableCell className={cellPadding}>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn('p-0', buttonSize)}
              onClick={(e) => {
                e.stopPropagation()
                onUserEdit?.(user)
              }}
              aria-label={`Edit ${user.firstName} ${user.lastName}`}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn('p-0', buttonSize)}
              onClick={(e) => {
                e.stopPropagation()
                onUserDelete?.(user)
              }}
              aria-label={`Delete ${user.firstName} ${user.lastName}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn('p-0', buttonSize)}
              onClick={(e) => {
                e.stopPropagation()
                // Handle more actions
              }}
              aria-label={`More actions for ${user.firstName} ${user.lastName}`}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}

// ====================
// ENHANCED HEADER COMPONENT
// ====================

interface EnhancedHeaderProps {
  onSearch?: (query: string) => void
  onCreate?: () => void
  onFilter?: () => void
  compact?: boolean
  enableTransitions?: boolean
  totalUsers?: number
  searchQuery?: string
}

function EnhancedHeader({
  onSearch,
  onCreate,
  onFilter,
  compact = false,
  enableTransitions = true,
  totalUsers = 0,
  searchQuery = ''
}: EnhancedHeaderProps) {
  const [searchValue, setSearchValue] = useState(searchQuery)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (enableTransitions) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [enableTransitions])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchValue)
  }, [searchValue, onSearch])

  return (
    <div className={cn(
      'flex justify-between items-center',
      compact ? 'p-4' : 'p-5',
      enableTransitions && [
        'content-header-reveal',
        isVisible ? 'visible' : 'invisible'
      ]
    )}>
      <div className="space-y-1">
        <h2 className={cn(
          'font-semibold tracking-tight',
          compact ? 'text-lg' : 'text-xl'
        )}>
          User Management
        </h2>
        <p className="text-sm text-muted-foreground">
          {totalUsers} {totalUsers === 1 ? 'user' : 'users'} total
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={cn(
              'pl-10 transition-all duration-200',
              compact ? 'h-8 w-32' : 'h-9 w-64'
            )}
          />
        </form>

        {/* Filter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFilter}
          className={compact ? 'h-8 w-8 p-0' : 'h-9 w-9 p-0'}
          aria-label="Filter users"
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Create User Button */}
        <Button
          onClick={onCreate}
          size="sm"
          className={cn(
            enableTransitions && [
              'interactive-button',
              isVisible ? 'visible' : 'invisible'
            ]
          )}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {!compact && 'Create User'}
        </Button>
      </div>
    </div>
  )
}

// ====================
// MAIN COMPONENT
// ====================

export function UserManagementWithSmoothTransitions({
  users = [],
  isLoading = false,
  error = null,
  enableSmoothTransitions = true,
  enableStaggeredReveal = true,
  enablePerformanceMonitoring = false,
  respectReducedMotion = true,
  onUserSelect,
  onUserEdit,
  onUserDelete,
  onUserCreate,
  onSearch,
  onFilter,
  className,
  showActions = true,
  showBulkActions = false,
  compact = false,
  ariaLabel = 'User management interface'
}: UserManagementSmoothProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // Coordinator state for smooth transitions
  const { state: coordinatorState, actions } = useDualLayerCoordinator({
    initialLoadDelay: 50,
    dataReadyThreshold: 200,
    skeletonFadeOutDuration: 300,
    modalFadeOutDuration: 250,
    enablePerformanceMonitoring,
    debugMode: enablePerformanceMonitoring
  })

  // Handle loading states
  useEffect(() => {
    if (isLoading) {
      actions.startDataLoading()
    } else if (users.length > 0) {
      actions.dataReady()
    }
  }, [isLoading, users.length, actions])

  // Handle user operations
  const handleUserEdit = useCallback((user: User) => {
    actions.startOperation(DatabaseOperationType.UPDATE_USER, {
      customMessage: `Updating ${user.firstName} ${user.lastName}`,
      customDescription: 'Saving changes to user profile'
    })
    onUserEdit?.(user)
    // Simulate operation completion
    setTimeout(() => actions.operationComplete(), 1500)
  }, [actions, onUserEdit])

  const handleUserDelete = useCallback((user: User) => {
    actions.startOperation(DatabaseOperationType.DELETE_USER, {
      customMessage: `Deleting ${user.firstName} ${user.lastName}`,
      customDescription: 'Removing user account and associated data'
    })
    onUserDelete?.(user)
    // Simulate operation completion
    setTimeout(() => actions.operationComplete(), 2000)
  }, [actions, onUserDelete])

  const handleUserCreate = useCallback(() => {
    actions.startOperation(DatabaseOperationType.CREATE_USER, {
      customMessage: 'Creating new user account',
      customDescription: 'Setting up user profile and permissions'
    })
    onUserCreate?.()
    setShowCreateDialog(true)
    // Simulate operation completion
    setTimeout(() => actions.operationComplete(), 2000)
  }, [actions, onUserCreate])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    actions.startSearch()
    onSearch?.(query)
    // Simulate search completion
    setTimeout(() => actions.searchComplete(), 1000)
  }, [actions, onSearch])

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    
    return users.filter(user => 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Users</CardTitle>
            <CardDescription>
              {error.message || 'Failed to load user data'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Content to render when data is ready
  const content = (
    <Card className={cn('overflow-hidden', className)}>
      {/* Enhanced Header */}
      <EnhancedHeader
        onSearch={handleSearch}
        onCreate={handleUserCreate}
        onFilter={() => onFilter?.({ search: searchQuery })}
        compact={compact}
        enableTransitions={enableSmoothTransitions && enableStaggeredReveal}
        totalUsers={filteredUsers.length}
        searchQuery={searchQuery}
      />

      {/* Table */}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              {!compact && <TableHead>First Name</TableHead>}
              {!compact && <TableHead>Last Name</TableHead>}
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {!compact && <TableHead>Last Login</TableHead>}
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <EnhancedTableRow
                key={user.id}
                user={user}
                index={index}
                onUserEdit={handleUserEdit}
                onUserDelete={handleUserDelete}
                onUserSelect={onUserSelect}
                showActions={showActions}
                compact={compact}
                enableTransitions={enableSmoothTransitions && enableStaggeredReveal}
              />
            ))}
            
            {/* Empty state */}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={compact ? 4 : 7} 
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  // Wrap with smooth transition manager if enabled
  if (enableSmoothTransitions) {
    return (
      <SmoothTransitionManager
        coordinatorState={coordinatorState}
        config={{
          skeletonFadeDuration: 300,
          modalFadeDuration: 250,
          contentRevealDelay: 200,
          rowStaggerDelay: enableStaggeredReveal ? 50 : 0,
          headerRevealDelay: 100,
          enableStaggeredReveal,
          respectReducedMotion,
          announceToScreenReader: true
        }}
        className={className}
        ariaLabel={ariaLabel}
        enablePerformanceMonitoring={enablePerformanceMonitoring}
        onTransitionComplete={(metrics) => {
          if (enablePerformanceMonitoring) {
            console.log('Smooth transition completed:', metrics)
          }
        }}
        onPhaseChange={(phase) => {
          if (enablePerformanceMonitoring) {
            console.log('Transition phase:', phase)
          }
        }}
      >
        {content}
      </SmoothTransitionManager>
    )
  }

  // Render without smooth transitions
  return content
}

// ====================
// PRESET CONFIGURATIONS
// ====================

export const UserManagementPresets = {
  standard: (props: Omit<UserManagementSmoothProps, 'enableSmoothTransitions' | 'enableStaggeredReveal'>) => (
    <UserManagementWithSmoothTransitions
      {...props}
      enableSmoothTransitions={true}
      enableStaggeredReveal={true}
      enablePerformanceMonitoring={false}
      respectReducedMotion={true}
    />
  ),

  fast: (props: Omit<UserManagementSmoothProps, 'enableSmoothTransitions' | 'enableStaggeredReveal'>) => (
    <UserManagementWithSmoothTransitions
      {...props}
      enableSmoothTransitions={true}
      enableStaggeredReveal={false}
      enablePerformanceMonitoring={false}
      respectReducedMotion={true}
    />
  ),

  compact: (props: Omit<UserManagementSmoothProps, 'compact' | 'enableSmoothTransitions' | 'enableStaggeredReveal'>) => (
    <UserManagementWithSmoothTransitions
      {...props}
      compact={true}
      enableSmoothTransitions={true}
      enableStaggeredReveal={true}
      enablePerformanceMonitoring={false}
      respectReducedMotion={true}
    />
  ),

  performance: (props: Omit<UserManagementSmoothProps, 'enablePerformanceMonitoring'>) => (
    <UserManagementWithSmoothTransitions
      {...props}
      enableSmoothTransitions={true}
      enableStaggeredReveal={true}
      enablePerformanceMonitoring={true}
      respectReducedMotion={true}
    />
  ),

  accessibility: (props: Omit<UserManagementSmoothProps, 'respectReducedMotion' | 'enableSmoothTransitions'>) => (
    <UserManagementWithSmoothTransitions
      {...props}
      enableSmoothTransitions={true}
      enableStaggeredReveal={true}
      enablePerformanceMonitoring={false}
      respectReducedMotion={true}
      ariaLabel="Accessible user management interface"
    />
  )
}

export default UserManagementWithSmoothTransitions
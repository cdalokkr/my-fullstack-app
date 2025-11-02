# UserOperationModalOverlay Integration Guide

## Overview

The `UserOperationModalOverlay` component serves as **Layer 2** of the dual-layer loading mechanism in the admin user management interface. It provides a prominent modal overlay that appears over the `UserManagementSkeleton` (Layer 1) during database operations.

## Architecture

### Dual-Layer Loading System

```
┌─────────────────────────────────────────────────────┐
│ Layer 2: UserOperationModalOverlay                  │
│ • Prominent modal with loading spinner              │
│ • Different messages for different operations       │
│ • Higher z-index (9999) to appear over skeleton     │
│ • Semi-transparent backdrop with blur effect        │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ Layer 1: UserManagementSkeleton                     │
│ • Immediate skeleton UI for instant feedback        │
│ • Shows expected table structure                    │
│ • Blurred beneath the modal overlay                 │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ Actual Data: User Table                             │
│ • Real user data when operations complete           │
└─────────────────────────────────────────────────────┘
```

## Key Features

### ✅ Modal States Supported

| State | Message | Description | Priority | Cancellable |
|-------|---------|-------------|----------|-------------|
| `LOADING_USERS` | "Loading user data..." | Fetching user information | HIGH | ❌ |
| `FETCHING_RECORDS` | "Fetching records from database..." | Retrieving user records | MEDIUM | ❌ |
| `PROCESSING` | "Please wait while we load user information" | General processing | HIGH | ❌ |
| `SAVING_CHANGES` | "Saving changes..." | Updating user info | HIGH | ❌ |
| `DELETING_USER` | "Removing user..." | Deleting user account | CRITICAL | ❌ |
| `CREATING_USER` | "Creating user..." | Setting up new account | HIGH | ❌ |
| `UPDATING_USER` | "Updating user..." | Modifying user info | HIGH | ❌ |
| `SEARCHING_USERS` | "Searching users..." | Search operations | MEDIUM | ✅ |
| `EXPORTING_DATA` | "Exporting data..." | Data export process | LOW | ✅ |
| `IMPORTING_DATA` | "Importing data..." | Data import process | MEDIUM | ❌ |

### ✅ Accessibility Features

- **ARIA Support**: Proper `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- **Keyboard Navigation**: ESC key support, focus trapping, focus restoration
- **Screen Reader Support**: Descriptive labels and announcements
- **High Contrast**: Works with system accessibility settings

### ✅ Responsive Design

- Mobile-first approach
- Adaptive padding and sizing
- Touch-friendly controls
- Optimal viewing on all screen sizes

### ✅ Animation System

- Smooth fade-in/fade-out transitions
- Scale animations for modal appearance
- Progress bar animations with shimmer effects
- Respect for `prefers-reduced-motion`

## Integration with ProgressiveLoader

### Basic Integration Pattern

```tsx
import { UserOperationModalOverlay, UserOperationModalState, LoadingPriority } from '@/components/dashboard/user-operation-modal-overlay'
import { ProgressiveLoader, LoadingPriority as PLPriority } from '@/components/ui/loading-states'
import { UserManagementSkeleton } from '@/components/dashboard/skeletons/user-management-skeleton'

function UserManagementInterface() {
  const [isLoading, setIsLoading] = useState(false)
  const [operationState, setOperationState] = useState<UserOperationModalState | null>(null)
  const [users, setUsers] = useState<User[]>([])

  const handleLoadUsers = async () => {
    setIsLoading(true)
    setOperationState(UserOperationModalState.LOADING_USERS)

    try {
      const userData = await fetchUsers()
      setUsers(userData)
    } finally {
      setIsLoading(false)
      setOperationState(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Layer 1: Skeleton (always renders immediately) */}
      {isLoading && (
        <UserManagementSkeleton 
          variant="compact"
          rowCount={6}
          showHeader={false}
          showActions={false}
        />
      )}

      {/* Layer 2: ProgressiveLoader with Modal Overlay */}
      <ProgressiveLoader 
        priority={PLPriority.HIGH}
        showImmediate={false}
        className="relative"
      >
        {isLoading ? (
          // Layer 2 Modal Overlay during loading
          <UserOperationModalOverlay
            isVisible={isLoading}
            state={operationState!}
            zIndex={9999}
            backdrop={true}
            showProgress={false}
          />
        ) : users.length > 0 ? (
          // Actual User Data
          <UserManagementTable users={users} />
        ) : (
          // Empty State
          <div className="text-center py-8">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </ProgressiveLoader>
    </div>
  )
}
```

### Advanced Integration with Specific Operations

#### User Creation Flow

```tsx
function UserCreationFlow() {
  const [isCreating, setIsCreating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 3, label: 'Creating user account' })

  const handleCreateUser = async (userData: CreateUserData) => {
    setIsCreating(true)
    setOperationState(UserOperationModalState.CREATING_USER)

    try {
      // Step 1: Validate data
      setProgress({ current: 1, total: 3, label: 'Validating user data' })
      await validateUserData(userData)

      // Step 2: Create account
      setProgress({ current: 2, total: 3, label: 'Creating account' })
      await createUserAccount(userData)

      // Step 3: Set up permissions
      setProgress({ current: 3, total: 3, label: 'Setting permissions' })
      await setupUserPermissions(userData.id)

      toast.success('User created successfully')
    } catch (error) {
      toast.error('Failed to create user')
    } finally {
      setIsCreating(false)
      setProgress({ current: 0, total: 3, label: 'Creating user account' })
    }
  }

  return (
    <UserOperationModalOverlay
      isVisible={isCreating}
      state={UserOperationModalState.CREATING_USER}
      showProgress={true}
      customProgress={progress}
      zIndex={10000}
    />
  )
}
```

#### User Deletion with Confirmation

```tsx
function UserDeletionFlow() {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true)
    setOperationState(UserOperationModalState.DELETING_USER)

    try {
      // Deletion is critical and non-cancellable
      await deleteUser(userId)
      toast.success('User deleted successfully')
      // Refresh user list
      await refreshUserList()
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <UserOperationModalOverlay
      isVisible={isDeleting}
      state={UserOperationModalState.DELETING_USER}
      zIndex={10000}
      priority={LoadingPriority.CRITICAL}
    />
  )
}
```

#### Search with Cancel Option

```tsx
function UserSearchInterface() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) return

      setIsSearching(true)
      setOperationState(UserOperationModalState.SEARCHING_USERS)

      try {
        const results = await searchUsers(query)
        setSearchResults(results)
      } catch (error) {
        toast.error('Search failed')
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  const handleCancelSearch = () => {
    setIsSearching(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <>
      <Input
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          handleSearch(e.target.value)
        }}
      />

      <UserOperationModalOverlay
        isVisible={isSearching}
        state={UserOperationModalState.SEARCHING_USERS}
        onCancel={handleCancelSearch}
        zIndex={9999}
      />
    </>
  )
}
```

### Integration with tRPC and React Query

```tsx
function UserManagementWithTRPC() {
  const [operationState, setOperationState] = useState<UserOperationModalState | null>(null)

  // tRPC queries with loading states
  const { data: users, isLoading, refetch } = trpc.admin.users.getUsers.useQuery(
    undefined,
    {
      onLoading: () => setOperationState(UserOperationModalState.LOADING_USERS),
      onSettled: () => setOperationState(null),
    }
  )

  // Mutation for creating users
  const createUserMutation = trpc.admin.users.createUser.useMutation({
    onLoading: () => setOperationState(UserOperationModalState.CREATING_USER),
    onSettled: () => setOperationState(null),
  })

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await createUserMutation.mutateAsync(userData)
      await refetch()
      toast.success('User created successfully')
    } catch (error) {
      toast.error('Failed to create user')
    }
  }

  return (
    <>
      {/* Layer 1: Quick skeleton */}
      {isLoading && (
        <UserManagementSkeleton variant="minimal" />
      )}

      {/* Layer 2: ProgressiveLoader with Modal */}
      <ProgressiveLoader priority={LoadingPriority.HIGH}>
        {isLoading ? (
          <UserOperationModalOverlay
            isVisible={isLoading}
            state={operationState!}
            priority={LoadingPriority.HIGH}
          />
        ) : (
          <UserManagementTable 
            users={users || []} 
            onCreateUser={handleCreateUser}
          />
        )}
      </ProgressiveLoader>
    </>
  )
}
```

## Performance Considerations

### Priority Levels

- **CRITICAL**: User deletion, critical operations
- **HIGH**: User creation, saving changes, data loading
- **MEDIUM**: Searching, importing, fetching records
- **LOW**: Background operations, exports

### Optimization Tips

1. **Minimal Re-renders**: Use `React.memo` for stable props
2. **Efficient Animations**: CSS transitions over JavaScript animations
3. **Memory Management**: Clean up timers and event listeners
4. **Focus Management**: Restore focus only when necessary

### Z-Index Strategy

- **Modal Overlay**: `zIndex={9999}`
- **ProgressiveLoader**: `zIndex={1000}`
- **UserManagementSkeleton**: `zIndex={1}`
- **Background Content**: `zIndex={0}`

## Error Handling

### Graceful Degradation

```tsx
function UserOperationModalWithErrorHandling() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleOperation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await performOperation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <UserOperationModalOverlay
          isVisible={isLoading}
          state={operationState}
          onClose={() => setError(null)}
        />
      )}
    </>
  )
}
```

## Testing

### Unit Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserOperationModalOverlay, UserOperationModalState } from './user-operation-modal-overlay'

describe('UserOperationModalOverlay', () => {
  it('renders with correct message for loading state', () => {
    render(
      <UserOperationModalOverlay
        isVisible={true}
        state={UserOperationModalState.LOADING_USERS}
      />
    )

    expect(screen.getByText('Loading user data...')).toBeInTheDocument()
  })

  it('calls onClose when ESC is pressed', () => {
    const onClose = jest.fn()
    render(
      <UserOperationModalOverlay
        isVisible={true}
        state={UserOperationModalState.PROCESSING}
        onClose={onClose}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('supports cancel for cancellable operations', () => {
    render(
      <UserOperationModalOverlay
        isVisible={true}
        state={UserOperationModalState.SEARCHING_USERS}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})
```

## Accessibility Testing

### Keyboard Navigation

- Tab navigation through interactive elements
- ESC key closes cancellable modals
- Focus trapping within modal
- Focus restoration on close

### Screen Reader Testing

- Modal announces correctly
- Progress updates are announced
- Button purposes are clear
- State changes are communicated

## Browser Compatibility

### Modern Features Used

- `backdrop-filter: blur()` - Progressive enhancement
- CSS Grid and Flexbox - Fallback support
- CSS Animations - Respects `prefers-reduced-motion`
- ARIA attributes - Wide compatibility

### Fallback Strategy

- Blur effect degrades gracefully
- Animations have CSS-only fallbacks
- Modal works without JavaScript enhancements
- Focus management degrades to native behavior

## Deployment Checklist

- [ ] Component tests pass
- [ ] Accessibility audit complete
- [ ] Performance metrics acceptable
- [ ] Cross-browser testing complete
- [ ] Documentation updated
- [ ] Integration examples provided
- [ ] Type definitions validated

## Future Enhancements

### Planned Features

- [ ] Custom animation preferences
- [ ] Localization support for messages
- [ ] Advanced progress tracking
- [ ] Custom styling themes
- [ ] Analytics tracking

### Extensibility

The component is designed to be easily extensible:

```tsx
// Custom modal state
const CUSTOM_STATE: UserOperationModalState = 'custom_operation'

// Extend configuration
USER_OPERATION_MODAL_CONFIG[CUSTOM_STATE] = {
  message: 'Custom operation...',
  description: 'Doing something custom',
  priority: LoadingPriority.MEDIUM,
  showCloseButton: true,
  canBeCancelled: true
}
```

This integration guide provides a comprehensive foundation for implementing the UserOperationModalOverlay as Layer 2 of the dual-layer loading mechanism in the admin user management interface.
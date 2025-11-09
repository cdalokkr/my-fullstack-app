# EnhancedAddUserModal - Usage Guide
**Complete Integration and Configuration Reference**

**Version:** 1.0  
**Last Updated:** November 4, 2025  
**Compatibility:** Next.js 15+ with TypeScript

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Integration](#basic-integration)
3. [Configuration Options](#configuration-options)
4. [Advanced Usage Patterns](#advanced-usage-patterns)
5. [Integration Examples](#integration-examples)
6. [Best Practices](#best-practices)
7. [Customization Guide](#customization-guide)
8. [Error Handling](#error-handling)

---

## 🚀 Getting Started

### Prerequisites
- **React 18+** with TypeScript support
- **Next.js 13+** with App Router
- **Required Dependencies:**
  ```bash
  npm install react-hook-form @hookform/resolvers zod
  npm install @trpc/client @trpc/server @tanstack/react-query
  npm install lucide-react
  npm install react-hot-toast
  npm install tailwindcss
  ```

### Required Dependencies Check
```bash
# Verify all dependencies are installed
npm list react-hook-form @hookform/resolvers zod @trpc/client lucide-react react-hot-toast

# Install any missing dependencies
npm install react-hook-form@latest @hookform/resolvers@latest zod@latest @trpc/client@latest lucide-react@latest react-hot-toast@latest
```

### Import Statement
```typescript
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'
```

---

## 🔧 Basic Integration

### Simple Implementation
The easiest way to integrate the EnhancedAddUserModal:

```typescript
"use client"

import { useState } from 'react'
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'

export function UserManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshUsers, setRefreshUsers] = useState(0)

  const handleUserCreated = () => {
    setRefreshUsers(prev => prev + 1)
    setIsModalOpen(false)
    // You can also trigger a data refresh here
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add New User
        </button>
      </div>

      {/* User list would go here */}
      
      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUserCreated}
      />
    </div>
  )
}
```

### With User List Integration
For complete integration with your existing user management:

```typescript
"use client"

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'

export function AdminUserManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: users, refetch } = trpc.admin.users.getUsers.useQuery({})
  const utils = trpc.useUtils()

  const handleUserCreated = async () => {
    // Refresh the user list
    await utils.admin.users.getUsers.invalidate()
    setIsModalOpen(false)
    
    // Optional: Show success message
    toast.success('User created successfully!')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </button>
      </div>

      {/* User Table/List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Your existing user display component */}
      </div>

      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUserCreated}
      />
    </div>
  )
}
```

---

## ⚙️ Configuration Options

### EnhancedAddUserModal Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | ✅ | - | Controls modal visibility |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | Called when modal opens/closes |
| `onSuccess` | `() => void` | ❌ | - | Called after successful user creation |

### Advanced Configuration Examples

#### Custom Success Handling
```typescript
const handleUserCreated = (userData: CreateUserResponse) => {
  // Custom logic after user creation
  console.log('New user created:', userData)
  
  // Redirect to user details page
  router.push(`/admin/users/${userData.id}`)
  
  // Send welcome email
  sendWelcomeEmail(userData.email)
  
  // Update analytics
  trackEvent('user_created', { 
    role: userData.role,
    source: 'admin_panel' 
  })
}
```

#### Modal with Custom State Management
```typescript
import { useState, useCallback } from 'react'

export function UserCreationSection() {
  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState<'idle' | 'creating' | 'success'>('idle')

  const handleOpenModal = useCallback(() => {
    setCreationStep('idle')
    setIsCreating(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsCreating(false)
    setCreationStep('idle')
  }, [])

  const handleUserCreated = useCallback(() => {
    setCreationStep('success')
    
    // Auto-close after success
    setTimeout(() => {
      setIsCreating(false)
      setCreationStep('idle')
    }, 2000)
  }, [])

  return (
    <>
      <button onClick={handleOpenModal} disabled={isCreating}>
        {isCreating && creationStep === 'creating' ? 'Creating...' : 'Add User'}
      </button>

      <EnhancedAddUserModal
        open={isCreating}
        onOpenChange={handleCloseModal}
        onSuccess={handleUserCreated}
      />
    </>
  )
}
```

---

## 🎯 Advanced Usage Patterns

### 1. Bulk User Creation
```typescript
interface BulkUserCreationProps {
  departmentId?: string
  defaultRole?: 'user' | 'admin'
  onBulkComplete?: (users: CreateUserResponse[]) => void
}

export function BulkUserCreation({ 
  departmentId, 
  defaultRole = 'user',
  onBulkComplete 
}: BulkUserCreationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => {
            setBulkMode(false)
            setIsModalOpen(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Add Single User
        </button>
        
        <button
          onClick={() => {
            setBulkMode(true)
            setIsModalOpen(true)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Bulk Import
        </button>
      </div>

      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={(userData) => {
          if (bulkMode) {
            // Handle bulk creation logic
            handleBulkUserCreation(userData, departmentId, defaultRole)
          } else {
            // Handle single user creation
            handleSingleUserCreation(userData)
          }
        }}
      />
    </div>
  )
}
```

### 2. Department-Specific User Creation
```typescript
interface DepartmentUserCreationProps {
  departmentId: string
  departmentName: string
  availableRoles: Array<{ value: string; label: string; description: string }>
}

export function DepartmentUserCreation({ 
  departmentId, 
  departmentName, 
  availableRoles 
}: DepartmentUserCreationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleUserCreated = async (userData: any) => {
    // Add department context to user creation
    await createDepartmentUser({
      ...userData,
      departmentId,
      metadata: {
        department: departmentName,
        createdBy: 'admin_panel',
        createdAt: new Date().toISOString()
      }
    })

    // Refresh department user list
    await refetchDepartmentUsers()
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{departmentName}</h3>
          <p className="text-sm text-gray-600">
            Manage users for {departmentName} department
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Department User
        </button>
      </div>

      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUserCreated}
      />
    </div>
  )
}
```

### 3. Integration with External Systems
```typescript
import { useCRMIntegration } from '@/hooks/useCRMIntegration'
import { useEmailService } from '@/hooks/useEmailService'

export function EnterpriseUserCreation() {
  const { syncWithCRM } = useCRMIntegration()
  const { sendWelcomeEmail, sendOnboardingTasks } = useEmailService()

  const handleUserCreated = async (userData: any) => {
    try {
      // 1. Create user in your system
      const newUser = await createUser(userData)
      
      // 2. Sync with external CRM
      await syncWithCRM(newUser)
      
      // 3. Send welcome email
      await sendWelcomeEmail(newUser.email, {
        userName: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role,
        department: newUser.department
      })
      
      // 4. Send onboarding tasks
      await sendOnboardingTasks(newUser)
      
      // 5. Update analytics
      trackEvent('enterprise_user_created', {
        source: 'admin_panel',
        integration: 'crm_email',
        role: newUser.role
      })

      toast.success('User created and integrated successfully!')
    } catch (error) {
      console.error('User creation integration failed:', error)
      toast.error('User created but integration failed. Please check manually.')
    }
  }

  return (
    <EnhancedAddUserModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      onSuccess={handleUserCreated}
    />
  )
}
```

---

## 💡 Integration Examples

### Next.js 13+ App Router Integration
```typescript
// app/admin/users/page.tsx
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'
import { AdminUserTable } from '@/components/admin/AdminUserTable'

export default function UsersPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminUserTable />
      {/* Modal will be rendered as a client component */}
      <EnhancedAddUserModalClient />
    </div>
  )
}

// app/admin/users/EnhancedAddUserModalClient.tsx
"use client"

import { useState } from 'react'
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'

export function EnhancedAddUserModalClient() {
  const [open, setOpen] = useState(false)

  return (
    <EnhancedAddUserModal
      open={open}
      onOpenChange={setOpen}
      onSuccess={() => {
        // Refresh user data or handle success
        window.location.reload() // or use a more sophisticated refresh
      }}
    />
  )
}
```

### React Component Library Integration
```typescript
// components/ui/UserCreationModal.tsx
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'

export interface UserCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: (user: any) => void
  presetData?: {
    role?: 'user' | 'admin'
    department?: string
  }
  customValidation?: {
    emailDomains?: string[]
    passwordRequirements?: PasswordRequirements
  }
}

export function UserCreationModal({
  isOpen,
  onClose,
  onUserCreated,
  presetData,
  customValidation
}: UserCreationModalProps) {
  const handleSuccess = async (userData: any) => {
    // Apply any preset data
    const finalUserData = {
      ...userData,
      ...presetData
    }

    // Custom validation if provided
    if (customValidation?.emailDomains) {
      const domain = userData.email.split('@')[1]
      if (!customValidation.emailDomains.includes(domain)) {
        throw new Error(`Email domain ${domain} is not allowed`)
      }
    }

    await onUserCreated(finalUserData)
    onClose()
  }

  return (
    <EnhancedAddUserModal
      open={isOpen}
      onOpenChange={onClose}
      onSuccess={handleSuccess}
    />
  )
}
```

### Testing Integration
```typescript
// __tests__/components/UserCreation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'

// Mock the required dependencies
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        users: {
          getUsers: { invalidate: jest.fn() },
          getCriticalDashboardData: { invalidate: jest.fn() }
        }
      }
    }),
    admin: {
      users: {
        createUser: {
          useMutation: () => ({
            mutateAsync: jest.fn().mockResolvedValue({ id: '123' }),
            isLoading: false,
            error: null
          })
        },
        checkEmailAvailability: {
          useMutation: () => ({
            mutate: jest.fn(),
            isLoading: false,
            error: null
          })
        }
      }
    }
  }
}))

test('should create user successfully', async () => {
  const onSuccess = jest.fn()
  const onOpenChange = jest.fn()
  
  render(
    <EnhancedAddUserModal
      open={true}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  )

  // Fill out the form
  await userEvent.type(screen.getByLabelText(/first name/i), 'John')
  await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
  await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'StrongPassword123!')
  await userEvent.selectOptions(screen.getByLabelText(/user role/i), 'user')

  // Submit the form
  fireEvent.click(screen.getByText(/create user/i))

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled()
  })
})
```

---

## ✅ Best Practices

### 1. Performance Optimization
```typescript
// ✅ Good: Memoize handlers to prevent unnecessary re-renders
const handleUserCreated = useCallback((userData: any) => {
  setRefreshKey(prev => prev + 1)
  toast.success('User created successfully!')
}, [])

// ✅ Good: Use React.memo for parent components
const UserManagementSection = React.memo(function UserManagementSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Add User
      </button>
      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUserCreated}
      />
    </div>
  )
})
```

### 2. Error Handling Best Practices
```typescript
// ✅ Good: Comprehensive error handling
const handleUserCreated = async (userData: any) => {
  try {
    // Create user
    const newUser = await createUserMutation.mutateAsync(userData)
    
    // Update local state
    utils.admin.users.getUsers.invalidate()
    
    // Show success message
    toast.success('User created successfully!')
    
    // Track analytics
    trackEvent('user_created', { role: newUser.role })
    
  } catch (error) {
    console.error('Failed to create user:', error)
    
    // Handle specific error types
    if (error.message.includes('email already exists')) {
      toast.error('A user with this email already exists')
    } else if (error.message.includes('network')) {
      toast.error('Network error. Please check your connection and try again.')
    } else {
      toast.error('Failed to create user. Please try again.')
    }
  }
}
```

### 3. Accessibility Best Practices
```typescript
// ✅ Good: Proper ARIA labels and keyboard navigation
export function AccessibleUserManagement() {
  return (
    <div role="main" aria-labelledby="users-heading">
      <h1 id="users-heading">User Management</h1>
      
      <button
        onClick={() => setIsModalOpen(true)}
        aria-describedby="add-user-help"
      >
        Add New User
      </button>
      
      <p id="add-user-help" className="sr-only">
        Opens a form to create a new user account
      </p>

      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUserCreated}
      />
    </div>
  )
}
```

### 4. Security Considerations
```typescript
// ✅ Good: Input sanitization and validation
const handleUserCreated = async (userData: any) => {
  // Sanitize inputs
  const sanitizedData = {
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    email: userData.email.toLowerCase().trim(),
    // ... other fields
  }

  // Validate against business rules
  if (!isValidEmailDomain(sanitizedData.email)) {
    throw new Error('Email domain not allowed')
  }

  // Create user with sanitized data
  const newUser = await createUserMutation.mutateAsync(sanitizedData)
  
  // Log security event
  logSecurityEvent('user_created', {
    userId: newUser.id,
    adminId: currentUser.id,
    timestamp: new Date().toISOString()
  })
}
```

---

## 🎨 Customization Guide

### 1. Custom Validation Rules
```typescript
// lib/validations/custom-user.ts
import { z } from 'zod'

// Custom validation schema
export const customUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .refine((email) => {
      // Custom domain validation
      const allowedDomains = ['company.com', 'subsidiary.com']
      return allowedDomains.some(domain => email.endsWith(`@${domain}`))
    }, 'Email must be from approved domain'),
  
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character')
})

// Use in component
const { register, formState: { errors } } = useForm<CreateUserInput>({
  resolver: zodResolver(customUserSchema)
})
```

### 2. Custom Styling
```typescript
// components/ui/CustomEnhancedModal.tsx
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'
import { cn } from '@/lib/utils'

export function CustomEnhancedAddUserModal(props: EnhancedAddUserModalProps) {
  return (
    <div className="custom-user-modal">
      <EnhancedAddUserModal
        {...props}
        className={cn(
          props.className,
          "border-2 border-blue-200 rounded-xl",
          "shadow-2xl shadow-blue-500/10"
        )}
      />
      
      <style jsx>{`
        .custom-user-modal .enhanced-modal-content {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }
        
        .custom-user-modal .form-section {
          border-left: 4px solid #3b82f6;
          background: rgba(59, 130, 246, 0.02);
        }
      `}</style>
    </div>
  )
}
```

### 3. Custom Success Actions
```typescript
// hooks/useUserCreation.ts
export function useUserCreation(options: {
  onSuccess?: (user: any) => void
  onError?: (error: Error) => void
  redirectToUser?: boolean
  sendNotification?: boolean
}) {
  const router = useRouter()
  const { sendNotification } = useNotificationService()

  const handleUserCreated = useCallback(async (userData: any) => {
    try {
      // Create user
      const newUser = await createUser(userData)
      
      // Optional redirect
      if (options.redirectToUser) {
        router.push(`/admin/users/${newUser.id}`)
        return
      }
      
      // Optional notification
      if (options.sendNotification) {
        await sendNotification({
          type: 'user_created',
          userId: newUser.id,
          message: `New user ${newUser.firstName} ${newUser.lastName} has been created`
        })
      }
      
      // Custom success handler
      options.onSuccess?.(newUser)
      
    } catch (error) {
      options.onError?.(error as Error)
    }
  }, [router, sendNotification, options])

  return { handleUserCreated }
}
```

---

## ⚠️ Error Handling

### Common Error Scenarios and Solutions

#### 1. Email Already Exists
```typescript
// ✅ Good: Handle email conflicts gracefully
const createUserMutation = trpc.admin.users.createUser.useMutation({
  onError: (error) => {
    if (error.message.includes('already exists')) {
      setEmailValidationState('unavailable')
      toast.error('This email is already registered. Please use a different email.')
    } else {
      toast.error('Failed to create user. Please try again.')
    }
  }
})
```

#### 2. Network Errors
```typescript
// ✅ Good: Implement retry logic
const handleRetry = useCallback(() => {
  if (retryCount < maxRetries) {
    setRetryCount(prev => prev + 1)
    // Retry the operation
    handleSubmit()
  } else {
    toast.error('Maximum retry attempts reached. Please try again later.')
  }
}, [retryCount, maxRetries, handleSubmit])
```

#### 3. Validation Errors
```typescript
// ✅ Good: Display field-level errors
{errors.email && (
  <div className="flex items-center gap-2 text-sm text-red-600" id="email-error">
    <AlertCircle className="h-3 w-3" />
    {errors.email.message}
  </div>
)}

// ✅ Good: Form-level error summary
{Object.keys(errors).length > 0 && (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <div>
          <h4 className="font-medium text-red-800">
            Please fix the following issues:
          </h4>
          <ul className="text-sm text-red-700 mt-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error?.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### Debug Mode Integration
```typescript
// ✅ Good: Debug mode for development
const DEBUG_MODE = process.env.NODE_ENV === 'development'

const handleUserCreated = async (userData: any) => {
  if (DEBUG_MODE) {
    console.log('Creating user with data:', userData)
  }
  
  try {
    const newUser = await createUserMutation.mutateAsync(userData)
    
    if (DEBUG_MODE) {
      console.log('User created successfully:', newUser)
    }
    
    toast.success('User created successfully!')
  } catch (error) {
    if (DEBUG_MODE) {
      console.error('User creation failed:', error)
    }
    
    toast.error('Failed to create user')
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: Modal not opening
**Symptoms:** Button click doesn't show modal
**Solution:** Check state management and ensure `open` prop is properly set

```typescript
// ❌ Common mistake
<EnhancedAddUserModal
  open={isModalOpen} // This needs to be updated when opening
  onOpenChange={setIsModalOpen}
  onSuccess={handleUserCreated}
/>

// ✅ Correct implementation
const [isModalOpen, setIsModalOpen] = useState(false)

const openModal = () => setIsModalOpen(true)
const closeModal = () => setIsModalOpen(false)
```

#### Issue: Form validation not working
**Symptoms:** Validation errors not displaying
**Solution:** Ensure React Hook Form is properly set up

```typescript
// ❌ Missing resolver
const { register, formState: { errors } } = useForm<CreateUserInput>()

// ✅ With proper resolver
const { register, formState: { errors } } = useForm<CreateUserInput>({
  resolver: zodResolver(createUserSchema)
})
```

#### Issue: Auto-save not working
**Symptoms:** Form data not persisting between sessions
**Solution:** Check localStorage permissions and error handling

```typescript
// ✅ Good: Proper localStorage error handling
const { lastSaved, isDirty } = useAutoSave(watchedValues, (data) => {
  try {
    localStorage.setItem('userFormDraft', JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save form data:', error)
    // Fallback to session storage or in-memory storage
  }
})
```

---

**Usage Guide Completed:** November 4, 2025  
**Next Section:** [Maintenance Guide](./enhanced-add-user-modal-maintenance-guide.md)
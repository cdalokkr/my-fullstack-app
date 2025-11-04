"use client"

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/auth'
import { AsyncButton } from '@/components/ui/async-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'
import { X, UserPlus } from 'lucide-react'

type FieldKey = 'firstName' | 'lastName' | 'email' | 'password' | 'dateOfBirth' | 'mobileNo' | 'role'

interface CreateUserFormProps {
  mode: 'inline' | 'modal'
  fieldOrder?: FieldKey[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCancel?: () => void
  onSuccess?: () => void
}

const defaultFieldOrder: Record<'inline' | 'modal', FieldKey[]> = {
  inline: ['firstName', 'lastName', 'dateOfBirth', 'mobileNo', 'role', 'email', 'password'],
  modal: ['email', 'password', 'firstName', 'lastName', 'mobileNo', 'dateOfBirth', 'role'],
}

export function CreateUserForm({
  mode,
  fieldOrder = defaultFieldOrder[mode],
  open,
  onOpenChange,
  onCancel,
  onSuccess,
}: CreateUserFormProps) {
  const utils = trpc.useUtils()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    setValue,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'user',
    },
  })

  // Focus management: set focus to first input when modal opens
  useEffect(() => {
    if (mode === 'modal' && open && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [mode, open])

  const createUserMutation = trpc.admin.users.createUser.useMutation({
    onSuccess: () => {
      toast.success('User created successfully!')
      reset()
      // Invalidate and refetch user-related queries
      utils.admin.users.getUsers.invalidate()
      utils.admin.dashboard.getCriticalDashboardData.invalidate()
      // Close modal or handle inline mode after a short delay to allow success state to be visible
      setTimeout(() => {
        if (mode === 'modal') {
          onOpenChange?.(false)
        } else if (mode === 'inline') {
          onCancel?.()
        }
        onSuccess?.()
        setIsLoading(false)
      }, 1000)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user')
      setIsLoading(false)
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true)
    await createUserMutation.mutateAsync(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange?.(newOpen)
  }

  // Keyboard navigation: handle Escape to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOpenChange(false)
    }
  }

  const renderField = (field: FieldKey) => {
    switch (field) {
      case 'firstName':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              {...register('firstName')}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              disabled={isLoading}
            />
            {errors.firstName && (
              <p id="firstName-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>
        )
      case 'lastName':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              {...register('lastName')}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              disabled={isLoading}
            />
            {errors.lastName && (
              <p id="lastName-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>
        )
      case 'email':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isLoading}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        )
      case 'password':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register('password')}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isLoading}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
        )
      case 'dateOfBirth':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
              aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
              disabled={isLoading}
            />
            {errors.dateOfBirth && (
              <p id="dateOfBirth-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>
        )
      case 'mobileNo':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="mobileNo">Mobile Number</Label>
            <Input
              id="mobileNo"
              type="tel"
              placeholder="+1234567890"
              {...register('mobileNo')}
              aria-describedby={errors.mobileNo ? "mobileNo-error" : undefined}
              disabled={isLoading}
            />
            {errors.mobileNo && (
              <p id="mobileNo-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.mobileNo.message}
              </p>
            )}
          </div>
        )
      case 'role':
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={watch('role')}
              onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
              disabled={isLoading}
            >
              <SelectTrigger
                aria-describedby={errors.role ? "role-error" : undefined}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p id="role-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.role.message}
              </p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (mode === 'modal') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6"
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-labelledby="create-user-modal-title"
          aria-describedby="create-user-modal-description"
        >
          <DialogHeader>
            <DialogTitle id="create-user-modal-title">Create New User</DialogTitle>
            <DialogDescription id="create-user-modal-description">
              Add a new user to the system. They will receive an email invitation to set up their account.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {fieldOrder.map(renderField)}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 max-w-full flex justify-start gap-4">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} className="flex-1 group bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300">
                    <span className="inline-flex items-center justify-center p-1 rounded-full bg-red-100 mr-2 transition-colors duration-300 group-hover:bg-red-200">
                      <X className="h-4 w-4 text-red-600 transition-colors duration-300 group-hover:text-red-700" />
                    </span>
                    Cancel
                  </Button>
                )}
                <AsyncButton
                  onClick={async () => {
                    const isValid = await trigger()
                    if (!isValid) {
                      throw new Error('Please check your input')
                    }
                    const data = getValues()
                    await onSubmit(data)
                  }}
                  onStateChange={(state) => {
                    // Simple state change handler - no complex setTimeout chains
                    if (state === 'loading') {
                      setIsLoading(true)
                    } else if (state === 'error') {
                      setIsLoading(false)
                    }
                    // Success state is handled by the mutation's onSuccess callback
                  }}
                  loadingText="Adding users..."
                  successText="Users added!"
                  errorText="Failed to add users"
                  successDuration={5000}
                  autoReset={true}
                  className="flex-1 group bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <span className="inline-flex items-center justify-center p-1 rounded-full bg-primary/20 mr-2 transition-colors duration-300 group-hover:bg-primary/30">
                    <UserPlus className="h-4 w-4 text-primary-foreground" />
                  </span>
                  Add Users
                </AsyncButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Inline mode
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Add a new user to the system. They will receive an email invitation to set up their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Row 1: First Name and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {renderField('firstName')}
              {renderField('lastName')}
            </div>

            {/* Row 2: Date of Birth, Mobile Number, and Role */}
            <div className="col-span-2">
              <div className="grid grid-cols-3 gap-4">
                {renderField('dateOfBirth')}
                {renderField('mobileNo')}
                {renderField('role')}
              </div>
            </div>

            {/* Row 3: Email and Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderField('email')}
              {renderField('password')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 max-w-full flex justify-start gap-4">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} className="flex-1 group bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300">
                    <span className="inline-flex items-center justify-center p-1 rounded-full bg-red-100 mr-2 transition-colors duration-300 group-hover:bg-red-200">
                      <X className="h-4 w-4 text-red-600 transition-colors duration-300 group-hover:text-red-700" />
                    </span>
                    Cancel
                  </Button>
                )}
                <AsyncButton
                  onClick={async () => {
                    const isValid = await trigger()
                    if (!isValid) {
                      throw new Error('Please check your input')
                    }
                    const data = getValues()
                    await onSubmit(data)
                  }}
                  onStateChange={(state) => {
                    // Simple state change handler - no complex setTimeout chains
                    if (state === 'loading') {
                      setIsLoading(true)
                    } else if (state === 'error') {
                      setIsLoading(false)
                    }
                    // Success state is handled by the mutation's onSuccess callback
                  }}
                  loadingText="Adding users..."
                  successText="Users added!"
                  errorText="Failed to add users"
                  successDuration={5000}
                  autoReset={true}
                  className={onCancel ? "flex-1 group bg-primary text-primary-foreground hover:bg-primary/90" : "w-full group bg-primary text-primary-foreground hover:bg-primary/90"}
                >
                  <span className="inline-flex items-center justify-center p-1 rounded-full bg-primary/20 mr-2 transition-colors duration-300 group-hover:bg-primary/30">
                    <UserPlus className="h-4 w-4 text-primary-foreground" />
                  </span>
                  Add Users
                </AsyncButton>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
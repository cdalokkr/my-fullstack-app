'use client'

import { useEffect, useRef } from 'react'
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
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

interface AdminUserCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AdminUserCreateModal({ open, onOpenChange, onSuccess }: AdminUserCreateModalProps) {
  const utils = trpc.useUtils()
  const firstInputRef = useRef<HTMLInputElement>(null)

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
    if (open && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success('User created successfully!')
      reset()
      onOpenChange(false)
      onSuccess?.()
      // Invalidate and refetch user-related queries
      utils.admin.getUsers.invalidate()
      utils.admin.getCriticalDashboardData.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    await createUserMutation.mutateAsync(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  // Keyboard navigation: handle Escape to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="create-user-title"
        aria-describedby="create-user-description"
      >
        <DialogHeader>
          <DialogTitle id="create-user-title">Create New User</DialogTitle>
          <DialogDescription id="create-user-description">
            Add a new user to the system. They will receive an email invitation to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Row 1: Email, Password, First Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register('email')}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                {...register('firstName')}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.firstName.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Last Name, Mobile Number, Date of Birth */}
          <div className="col-span-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register('lastName')}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                />
                {errors.lastName && (
                  <p id="lastName-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNo">Mobile Number</Label>
                <Input
                  id="mobileNo"
                  type="tel"
                  placeholder="+1234567890"
                  {...register('mobileNo')}
                  aria-describedby={errors.mobileNo ? "mobileNo-error" : undefined}
                />
                {errors.mobileNo && (
                  <p id="mobileNo-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.mobileNo.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
                />
                {errors.dateOfBirth && (
                  <p id="dateOfBirth-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Role */}
          <div className="col-span-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={watch('role')}
                onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
              >
                <SelectTrigger aria-describedby={errors.role ? "role-error" : undefined}>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 max-w-full flex justify-start">
              <AsyncButton
                onClick={async () => {
                  const isValid = await trigger()
                  if (!isValid) {
                    throw new Error('Please check your input')
                  }
                  const data = getValues()
                  await onSubmit(data)
                }}
                loadingText="Adding users..."
                successText="Users added!"
                errorText="Failed to add users"
                successDuration={2000}
                className="w-full group bg-primary text-primary-foreground hover:bg-primary/90"
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
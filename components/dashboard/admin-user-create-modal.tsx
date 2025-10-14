// ============================================
// components/dashboard/admin-user-create-modal.tsx
// ============================================
'use client'

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

interface AdminUserCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AdminUserCreateModal({ open, onOpenChange, onSuccess }: AdminUserCreateModalProps) {
  const utils = trpc.useUtils()

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive an email invitation to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
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
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* First Name Field */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.firstName.message}
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
            {errors.lastName && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.lastName.message}
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
            {errors.mobileNo && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.mobileNo.message}
              </p>
            )}
          </div>

          {/* Date of Birth Field */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.dateOfBirth.message}
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
            {errors.role && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.role.message}
              </p>
            )}
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
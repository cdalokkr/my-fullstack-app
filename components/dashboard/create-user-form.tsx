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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'

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
      onSuccess?.()
      if (mode === 'modal') {
        onOpenChange?.(false)
      } else if (mode === 'inline') {
        setTimeout(() => {
          onCancel?.()
        }, 2000)
      }
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
    onOpenChange?.(newOpen)
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
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 dark:text-red-400">
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
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 dark:text-red-400">
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
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">
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
            />
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
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
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-600 dark:text-red-400">
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
            />
            {errors.mobileNo && (
              <p className="text-sm text-red-600 dark:text-red-400">
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
        )
      default:
        return null
    }
  }

  if (mode === 'modal') {
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
            {fieldOrder.map(renderField)}

            <DialogFooter>
              <div className="flex justify-end gap-4">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
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
                  loadingText="Creating user..."
                  successText="User created!"
                  errorText="Failed to create user"
                  successDuration={2000}
                  className="flex-1"
                >
                  Create User
                </AsyncButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Inline mode
  return (
    <div className="space-y-6 pt-6 pl-6 pr-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('firstName')}
              {renderField('lastName')}
            </div>

            {/* Row 2: Date of Birth, Mobile Number, and Role */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('dateOfBirth')}
              {renderField('mobileNo')}
              {renderField('role')}
            </div>

            {/* Row 3: Email and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('email')}
              {renderField('password')}
            </div>

            <div className="flex gap-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300">
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
                loadingText="Creating user..."
                successText="User created!"
                errorText="Failed to create user"
                successDuration={2000}
                className={onCancel ? "flex-1" : "w-full"}
              >
                Create User
              </AsyncButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
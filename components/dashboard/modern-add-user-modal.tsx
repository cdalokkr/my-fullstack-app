"use client"

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/auth'
import { AsyncButton } from '@/components/ui/async-button'
import {
  ModernDialog,
  ModernDialogContent,
  ModernDialogDescription,
  ModernDialogHeader,
  ModernDialogFooter,
  ModernDialogTitle,
} from '@/components/ui/modern-dialog'
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
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Info,
  X
} from 'lucide-react'

interface ModernAddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ModernAddUserModal({ open, onOpenChange, onSuccess }: ModernAddUserModalProps) {
  const utils = trpc.useUtils()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

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

  // Combine register with custom ref handling
  const emailRegister = register('email')

  // Focus management: set focus to first input when modal opens
  useEffect(() => {
    if (open && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 150)
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => reset(), 300)
    }
  }, [open, reset])

  const createUserMutation = trpc.admin.users.createUser.useMutation({
    onSuccess: () => {
      reset()
      onOpenChange(false)
      onSuccess?.()
      // Invalidate and refetch user-related queries
      utils.admin.users.getUsers.invalidate()
      utils.admin.dashboard.getCriticalDashboardData.invalidate()
    },
    onError: (error) => {
      console.error('Failed to create user:', error)
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
    <ModernDialog open={open} onOpenChange={handleOpenChange}>
      <ModernDialogContent
        className="w-full sm:w-[800px] max-w-none m-0 p-0 rounded-lg max-h-[90vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="admin-title"
        aria-describedby="admin-description"
        showCloseButton={false} // Disable default close button since we'll handle it manually
      >
        {/* App Title with Close Button - Will be extracted to fixed header by ModernDialogContent */}
        <div className="flex items-center justify-between px-6 py-2 flex-shrink-0 border-b bg-muted/10">
          <ModernDialogTitle id="admin-title" className="text-center text-lg font-bold text-primary">
            Admin Dashboard
          </ModernDialogTitle>
          <button
            onClick={() => handleOpenChange(false)}
            className="p-2 rounded-lg hover:bg-muted transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Fixed Header that will be extracted by ModernDialogContent */}
        <ModernDialogHeader className="flex items-center justify-between px-6 py-4 border-b bg-background">
          {/* Left-aligned Header Content */}
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 id="create-user-title" className="text-left text-xl font-semibold">
                Create New User
              </h2>
              {/* Using ModernDialogDescription to replace hardcoded description */}
              <ModernDialogDescription id="create-user-description" className="text-left text-sm text-muted-foreground mt-1">
                Add a new user to the system. They will receive an email invitation to set up their account.
              </ModernDialogDescription>
            </div>
          </div>
        </ModernDialogHeader>

        {/* Scrollable Content Area with reduced top spacing */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
          {/* Form Section */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
             
            {/* Personal Information Section - Moved to top */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Personal Information
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className="h-11"
                    {...register('firstName')}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  />
                  {errors.firstName && (
                    <div className="flex items-center gap-2 text-sm text-red-600" id="firstName-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName.message}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className="h-11"
                    {...register('lastName')}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-2 text-sm text-red-600" id="lastName-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName.message}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNo" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobileNo"
                    type="tel"
                    placeholder="+1234567890"
                    className="h-11"
                    {...register('mobileNo')}
                    aria-describedby={errors.mobileNo ? "mobileNo-error" : undefined}
                  />
                  {errors.mobileNo && (
                    <div className="flex items-center gap-2 text-sm text-red-600" id="mobileNo-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.mobileNo.message}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="h-11"
                    {...register('dateOfBirth')}
                    aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
                  />
                  {errors.dateOfBirth && (
                    <div className="flex items-center gap-2 text-sm text-red-600" id="dateOfBirth-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.dateOfBirth.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email and Password Section - Moved after Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Account Credentials
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="h-11"
                    {...register('email')}
                    ref={(el) => {
                      emailInputRef.current = el
                    }}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-2 text-sm text-red-600" id="email-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="h-11"
                    {...register('password')}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  {errors.password && (
                    <div className="flex items-center gap-2 text-sm text-red-600" id="password-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Access & Permissions
                </h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  User Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
                >
                  <SelectTrigger className="h-11" aria-describedby={errors.role ? "role-error" : undefined}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Standard User</div>
                          <div className="text-xs text-muted-foreground">Basic access to system features</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Administrator</div>
                          <div className="text-xs text-muted-foreground">Full access and management rights</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <div className="flex items-center gap-2 text-sm text-red-600" id="role-error">
                    <AlertCircle className="h-4 w-4" />
                    {errors.role.message}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-background">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-24 order-2 sm:order-1"
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <AsyncButton
              onClick={async () => {
                const isValid = await trigger()
                if (!isValid) {
                  console.error('Please check your input')
                  return
                }
                const data = getValues()
                await onSubmit(data)
              }}
              loadingText="Creating user..."
              successText="User created!"
              errorText="Failed to create user"
              successDuration={2000}
              className="px-6 w-40 order-1 sm:order-2 group"
              disabled={createUserMutation.isPending}
            >
              <span className="inline-flex items-center justify-center p-1 rounded-full bg-white/20 mr-2 transition-colors duration-300 group-hover:bg-white/30">
                <UserPlus className="h-4 w-4" />
              </span>
              Create User
            </AsyncButton>
          </div>
        </div>
      </ModernDialogContent>
    </ModernDialog>
  )
}
"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/auth'
import { EnhancedModal } from '@/components/ui/EnhancedModal'
import { EnhancedAsyncButton } from '@/components/ui/EnhancedAsyncButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import {
  UserPlus,
  Mail,
  User,
  Shield,
  AlertCircle,
  Phone,
  Calendar
} from 'lucide-react'

interface EnhancedAddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EnhancedAddUserModal({ open, onOpenChange, onSuccess }: EnhancedAddUserModalProps) {
  const utils = trpc.useUtils()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [isSuccess, setIsSuccess] = useState(false)

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

  // Handle email registration with proper ref management
  const emailField = register('email', {
    setValueAs: (value) => value || '', // Convert undefined/empty to empty string
  })

  // Focus management: set focus to first input when modal opens
  useEffect(() => {
    if (open && emailInputRef.current) {
      console.log('Modal opened, setting focus to email input')
      setTimeout(() => {
        emailInputRef.current?.focus()
        console.log('Focus set to email input')
      }, 150)
    } else if (!open) {
      console.log('Modal closed, checking form state')
      console.log('Current form values:', getValues())
    }
  }, [open, getValues])

  // Create user mutation with proper state management
  const createUserMutation = trpc.admin.users.createUser.useMutation({
    onSuccess: () => {
      console.log('User created successfully')
      toast.success('User created successfully!', { duration: 6000 })
      // Invalidate and refetch user-related queries
      utils.admin.users.getUsers.invalidate()
      utils.admin.dashboard.getCriticalDashboardData.invalidate()
      // Trigger success callback
      onSuccess?.()
      // Reset form after successful submission
      console.log('Form reset triggered after successful user creation')
      reset()
      console.log('Form values after reset:', getValues())
    },
    onError: (error) => {
      console.error('Failed to create user:', error)
      
      // Handle specific error cases
      let errorMessage = 'Failed to create user'
      
      if (error.message.includes('already exists')) {
        errorMessage = 'A user with this email already exists'
      } else if (error.message.includes('Failed to create auth user')) {
        errorMessage = 'Failed to create authentication user'
      } else if (error.message.includes('Profile creation error')) {
        errorMessage = 'Failed to create user profile'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      // Re-throw error to let EnhancedAsyncButton handle it
      throw new Error(errorMessage)
    },
  })

  // Handle form submission with enhanced async button integration
  const handleSubmit = useCallback(async () => {
    console.log('Starting form validation')
    const isValid = await trigger()
    
    if (!isValid) {
      console.log('Form validation failed')
      toast.error('Please check your input and try again')
      throw new Error('Validation failed')
    }
    
    const data = getValues()
    console.log('Form data validated, submitting:', data)
    
    await createUserMutation.mutateAsync(data)
    console.log('User creation completed successfully')
  }, [trigger, getValues, createUserMutation])

  const submitText = "Create User"
  const submitLoadingText = "Creating..."
  const submitSuccessText = "User created successfully!"

  return (
    <EnhancedModal
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Create New User"
      description="Add a new user to the system. They will receive an email invitation to set up their account."
      icon="user-plus"
      size="xl"
      onSubmit={handleSubmit}
      submitText={submitText}
      submitLoadingText={submitLoadingText}
      submitSuccessText={submitSuccessText}
      autoCloseDuration={4000}
      showCancelButton={true}
      cancelText="Cancel"
      animation="slide"
      showAnimatedIcon={true}
      className="max-w-8xl w-[99vw]"
      buttonsInContent={true}
      showDefaultCloseButton={false}
      submitButtonContent={
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {submitText}
        </div>
      }
    >
      <form className="space-y-6">
        <Accordion type="multiple" defaultValue={["personal", "credentials", "permissions"]} className="w-full space-y-4">

          {/* Personal Information Section */}
          <AccordionItem value="personal" className="border-none">
            <Card className="border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardHeader className="flex-row items-center gap-3 p-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Basic profile details and contact information</p>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          className="h-10 mr-4"
                          {...register('firstName')}
                          aria-describedby={errors.firstName ? "firstName-error" : undefined}
                        />
                        {errors.firstName && (
                          <div className="flex items-center gap-2 text-sm text-red-600" id="firstName-error">
                            <AlertCircle className="h-3 w-3" />
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
                          className="h-10 mr-4"
                          {...register('lastName')}
                          aria-describedby={errors.lastName ? "lastName-error" : undefined}
                        />
                        {errors.lastName && (
                          <div className="flex items-center gap-2 text-sm text-red-600" id="lastName-error">
                            <AlertCircle className="h-3 w-3" />
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
                          className="h-10 mr-4"
                          {...register('mobileNo')}
                          aria-describedby={errors.mobileNo ? "mobileNo-error" : undefined}
                        />
                        {errors.mobileNo && (
                          <div className="flex items-center gap-2 text-sm text-red-600" id="mobileNo-error">
                            <AlertCircle className="h-3 w-3" />
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
                          className="h-10 mr-4"
                          {...register('dateOfBirth')}
                          aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
                        />
                        {errors.dateOfBirth && (
                          <div className="flex items-center gap-2 text-sm text-red-600" id="dateOfBirth-error">
                            <AlertCircle className="h-3 w-3" />
                            {errors.dateOfBirth.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Account Credentials Section */}
          <AccordionItem value="credentials" className="border-none">
            <Card className="border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardHeader className="flex-row items-center gap-3 p-0">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <CardTitle className="text-base font-semibold">Account Credentials</CardTitle>
                    <p className="text-sm text-muted-foreground">Email address and password setup</p>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          className="h-10 mr-4"
                          autoComplete="off"
                          {...emailField}
                          ref={(el: HTMLInputElement | null) => {
                            emailInputRef.current = el
                            emailField.ref(el)
                          }}
                          aria-describedby={errors.email ? "email-error" : undefined}
                        />
                        {errors.email && (
                          <div className="flex items-center gap-2 text-sm text-red-600" id="email-error">
                            <AlertCircle className="h-3 w-3" />
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
                          className="h-10 mr-4"
                          autoComplete="off"
                          {...register('password')}
                          aria-describedby={errors.password ? "password-error" : undefined}
                        />
                        {errors.password && (
                          <div className="flex items-center gap-2 text-sm text-red-600" id="password-error">
                            <AlertCircle className="h-3 w-3" />
                            {errors.password.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Access & Permissions Section */}
          <AccordionItem value="permissions" className="border-none">
            <Card className="border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <CardHeader className="flex-row items-center gap-3 p-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <CardTitle className="text-base font-semibold">Access & Permissions</CardTitle>
                    <p className="text-sm text-muted-foreground">User role and access level configuration</p>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium">
                        User Role <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={watch('role')}
                        onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
                      >
                        <SelectTrigger className="h-10 mr-4" aria-describedby={errors.role ? "role-error" : undefined}>
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
                          <AlertCircle className="h-3 w-3" />
                          {errors.role.message}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </form>
    </EnhancedModal>
  )
}
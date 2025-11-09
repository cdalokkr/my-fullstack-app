"use client"

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/auth'
import { EnhancedModal, type ModalSection } from '@/components/ui/EnhancedModal'
import AsyncButton from '@/components/ui/async-button'
import { Button } from '@/components/ui/button'
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
import { toastError, dismissToast } from '@/components/ui/toast-notifications'
import { cn } from '@/lib/utils'
import { UserPlus, User, Mail, Shield, AlertTriangle, XCircle } from 'lucide-react'

interface EnhancedAddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EnhancedAddUserModal({ open, onOpenChange, onSuccess }: EnhancedAddUserModalProps) {
  const utils = trpc.useUtils()

  // Enhanced error state management
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showValidationSummary, setShowValidationSummary] = useState(false)
  const [errorNotificationId, setErrorNotificationId] = useState<string | null>(null)

  // Track submit state for proper button styling
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasValidationErrors, setHasValidationErrors] = useState(false)

  const {
    register,
    setValue,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors, isValid },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      mobileNo: '',
      dateOfBirth: '',
      role: 'user',
    },
  })

  // Enhanced validation error handling with detailed error tracking
  useEffect(() => {
    // Skip error processing if form reset is in progress to prevent race conditions
    if (formResetInProgress.current) {
      return
    }

    const errorMap: Record<string, string> = {}

    Object.keys(errors).forEach(field => {
      if (errors[field as keyof typeof errors]?.message) {
        errorMap[field] = errors[field as keyof typeof errors]?.message || 'Invalid input'
      }
    })

    setValidationErrors(errorMap)
    setShowValidationSummary(Object.keys(errorMap).length > 0)
    setHasValidationErrors(Object.keys(errorMap).length > 0)
  }, [errors])

  // Create user mutation with enhanced error handling
  const createUserMutation = trpc.admin.users.createUser.useMutation({
    onSuccess: () => {
      console.log('User created successfully')
      
      // Clear any existing error notifications
      if (errorNotificationId) {
        dismissToast(errorNotificationId)
      }
      
      // Reset all error states
      setValidationErrors({})
      setShowValidationSummary(false)
      setHasValidationErrors(false)
      setErrorNotificationId(null)
      
      // Reset form immediately after success with explicit default values
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        mobileNo: '',
        dateOfBirth: '',
        role: 'user',
      })
      
      // Invalidate and refresh data
      utils.admin.users.getUsers.invalidate()
      utils.admin.dashboard.getCriticalDashboardData.invalidate()
      
      // Reset submit state
      setIsSubmitting(false)
      
      // Call success callback
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Failed to create user:', error)
      let errorMessage = 'Failed to create user'
      let errorTitle = 'User Creation Failed'

      // Enhanced error message handling with schema-specific messages
      if (error.message.includes('already exists')) {
        errorMessage = 'A user with this email already exists'
        errorTitle = 'Email Already in Use'
      } else if (error.message.includes('Failed to create auth user')) {
        errorMessage = 'Failed to create authentication user. Please check the email format and try again.'
        errorTitle = 'Authentication Error'
      } else if (error.message.includes('Profile creation error')) {
        errorMessage = 'Failed to create user profile. Please try again or contact support if the issue persists.'
        errorTitle = 'Profile Creation Error'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address'
        errorTitle = 'Invalid Email Format'
      } else if (error.message.includes('Password')) {
        errorMessage = error.message // Use the schema-specific password message
        errorTitle = 'Password Requirements Not Met'
      } else if (error.message.includes('mobile')) {
        errorMessage = 'Please enter a valid mobile number format'
        errorTitle = 'Invalid Mobile Number'
      } else if (error.message) {
        errorMessage = error.message
      }

      // Don't show server error toast if there are validation errors
      // The validation error toast will be shown instead
      if (!hasValidationErrors) {
        toastError(errorMessage, {
          title: errorTitle,
          duration: 5000 // Increased duration for better readability
        })
      }

      setIsSubmitting(false) // Reset submit state on error
      throw new Error(errorMessage)
    },
  })

  // Enhanced section error detection with detailed error mapping
  const getSectionErrorStatus = (sectionId: string) => {
    switch (sectionId) {
      case 'personal':
        return !!(validationErrors.firstName || validationErrors.lastName ||
                 validationErrors.mobileNo || validationErrors.dateOfBirth)
      case 'credentials':
        return !!(validationErrors.email || validationErrors.password)
      case 'access':
        return !!validationErrors.role
      default:
        return false
    }
  }

  // Create enhanced sections with proper border styling for validation states
  const getSectionsWithErrorHighlight = () => {
    return sections.map(section => {
      const hasError = getSectionErrorStatus(section.id)

      if (hasError) {
        // Red border for sections with validation errors, keep original background
        const baseClasses = (section.className || '').replace(/border-[^\\s]+/g, '')
        return {
          ...section,
          className: baseClasses + ' border-red-500 ring-2 ring-red-400 ring-opacity-50 ring-offset-2 ring-offset-background'
        }
      }
      // Keep original styling (background gradients and borders) for valid inputs or neutral states
      return section
    })
  }

  // Enhanced form submission with immediate validation error feedback
  const handleSubmit = async () => {
    const isValid = await trigger()
    
    if (!isValid) {
      // Clear any existing error notifications first
      if (errorNotificationId) {
        dismissToast(errorNotificationId)
      }
      
      // Create comprehensive error message with all validation issues
      const errorMessages = Object.entries(validationErrors)
        .map(([field, message]) => {
          const fieldLabels: Record<string, string> = {
            firstName: 'First name',
            lastName: 'Last name',
            email: 'Email address',
            password: 'Password',
            mobileNo: 'Mobile number',
            dateOfBirth: 'Date of birth',
            role: 'User role'
          }
          return `${fieldLabels[field] || field}: ${message}`
        })
        .join('\n• ')
      
      // Show immediate error notification with red background and proper icon
      const notificationId = toastError(
        `Please fix the following issues:\n• ${errorMessages}`,
        {
          title: 'Validation Failed',
          duration: 4000, // Auto-dismiss after 4 seconds
          dismissible: true
        }
      )
      
      setErrorNotificationId(notificationId)
      
      // Keep form in error state - don't reset validation errors
      // This ensures the red borders and error states persist
      setIsSubmitting(false)
      
      // Throw error to prevent form submission
      throw new Error('Validation failed - please fix errors')
    }
    
    // Clear validation errors on successful validation
    setValidationErrors({})
    setShowValidationSummary(false)
    setHasValidationErrors(false)
    
    setIsSubmitting(true)
    const data = getValues()
    await createUserMutation.mutateAsync(data)
  }

  // Enhanced submit button content with proper error state handling
  const getSubmitButtonContent = () => {
    if (isSubmitting) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Creating...</span>
        </div>
      )
    }
    
    if (hasValidationErrors) {
      return (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Fix Errors ({Object.keys(validationErrors).length})</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        <span>Create User</span>
      </div>
    )
  }

  const getSubmitButtonText = () => {
    if (hasValidationErrors) {
      return `Fix Errors (${Object.keys(validationErrors).length})`
    }
    return "Create User"
  }

  // Define modal sections with enhanced error styling
  const sections: ModalSection[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic profile details',
      icon: <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      collapsible: true,
      defaultOpen: true,
      className: 'bg-gradient-to-r from-blue-100/80 to-blue-200/80 dark:from-blue-950/40 dark:to-blue-900/40 border-blue-200/50 dark:border-blue-700/50 hover:from-blue-200/80 hover:to-blue-300/80 dark:hover:from-blue-950/60 dark:hover:to-blue-900/60',
      children: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2 text-foreground">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className={cn(
                  "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                  validationErrors.firstName ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
                )}
                {...register('firstName')}
              />
              {validationErrors.firstName && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {validationErrors.firstName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2 text-foreground">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className={cn(
                  "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                  validationErrors.lastName ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
                )}
                {...register('lastName')}
              />
              {validationErrors.lastName && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {validationErrors.lastName}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobileNo" className="text-sm font-medium text-foreground">
                Mobile Number
              </Label>
              <Input
                id="mobileNo"
                type="tel"
                placeholder="+1234567890"
                className={cn(
                  "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                  validationErrors.mobileNo ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
                )}
                {...register('mobileNo')}
              />
              {validationErrors.mobileNo && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {validationErrors.mobileNo}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                className={cn(
                  "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                  validationErrors.dateOfBirth ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
                )}
                {...register('dateOfBirth')}
              />
              {validationErrors.dateOfBirth && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {validationErrors.dateOfBirth}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'credentials',
      title: 'Account Credentials',
      description: 'Email and password',
      icon: <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />,
      collapsible: true,
      defaultOpen: false,
      className: 'bg-gradient-to-r from-green-100/80 to-green-200/80 dark:from-green-950/40 dark:to-green-900/40 border-green-200/50 dark:border-green-700/50 hover:from-green-200/80 hover:to-green-300/80 dark:hover:from-green-950/60 dark:hover:to-green-900/60',
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2 text-foreground">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="new-email"
              data-form-type="other"
              placeholder="user@example.com"
              className={cn(
                "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                validationErrors.email ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
              )}
              {...register('email')}
            />
            {validationErrors.email && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {validationErrors.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2 text-foreground">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              data-form-type="other"
              placeholder="Create a strong password"
              className={cn(
                "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                validationErrors.password ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
              )}
              {...register('password')}
            />
            {validationErrors.password && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {validationErrors.password}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'access',
      title: 'Access & Permissions',
      description: 'User role and access level',
      icon: <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      collapsible: true,
      defaultOpen: false,
      className: 'bg-gradient-to-r from-purple-100/80 to-purple-200/80 dark:from-purple-950/40 dark:to-purple-900/40 border-purple-200/50 dark:border-purple-700/50 hover:from-purple-200/80 hover:to-purple-300/80 dark:hover:from-purple-950/60 dark:hover:to-purple-900/60',
      children: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2 text-foreground">
              User Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('role') || 'user'}
              onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
            >
              <SelectTrigger className={cn(
                "h-9 px-3 py-1 text-base border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background text-foreground",
                validationErrors.role ? "border-red-500 bg-red-50/30 dark:bg-red-950/20" : "border-input"
              )}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Standard User</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.role && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {validationErrors.role}
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  // Create a ref to track if we're in a form reset cycle
  const formResetInProgress = useRef(false)

  return (
    <div className="w-full">
      <EnhancedModal
        isOpen={open}
        onOpenChange={(isOpen) => {
          if (isOpen) {
            formResetInProgress.current = true
            // Reset form when modal opens with explicit default values
            reset({
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              mobileNo: '',
              dateOfBirth: '',
              role: 'user',
            })
            // Clear all error states synchronously
            setIsSubmitting(false)
            setHasValidationErrors(false)
            setValidationErrors({})
            setShowValidationSummary(false)
            setErrorNotificationId(null)
            // Clear the flag after a short delay to allow state updates to complete
            setTimeout(() => {
              formResetInProgress.current = false
            }, 100)
          }
          onOpenChange(isOpen)
        }}
        title="Create New User"
        description="Add a new user to the system with basic information"
        icon="user-plus"
        size="xl"
        onSubmit={handleSubmit}
        submitText={getSubmitButtonText()}
        submitLoadingText="Creating..."
        submitSuccessText="User Created Successfully!"
        submitButtonProps={{
          successDuration: 3000,
          errorDuration: 4000,
          autoReset: true,
          callbacks: {
            onStateChange: (state: 'idle' | 'loading' | 'success' | 'error') => {
              console.log(`User creation state changed to ${state}`);
              if (state === 'success') {
                console.log('User creation successful');
              } else if (state === 'error') {
                console.log('User creation failed');
              }
            }
          }
        }}
        autoCloseDuration={3000}
        showCancelButton={true}
        cancelText="Cancel"
        animation="slide"
        showAnimatedIcon={true}
        className="max-w-2xl w-[95vw]"
        buttonsInContent={true}
        showDefaultCloseButton={false}
        sections={getSectionsWithErrorHighlight()}
      />
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createUserSchema, editUserSchema, type CreateUserInput, type EditUserInput } from "@/lib/validations/auth"
import AsyncButton, { LoginButton } from "@/components/ui/async-button"
import CreateUserButton from "@/components/ui/create-user-button"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { UserPlus, User, Mail, Shield, Phone, Lock, Edit } from "lucide-react"
import { CancelButton } from "@/components/ui/action-button"
import { trpc } from "@/lib/trpc/client"
import { cacheInvalidation } from "@/lib/cache/cache-invalidation"
import { smartCacheManager } from "@/lib/cache/smart-cache-manager"
import { Calendar28 } from "@/components/ui/calendar-28"
import { cn } from "@/lib/utils"
import toast from 'react-hot-toast'
import { Profile } from "@/types"

interface ModernAddUserFormProps {
  // Sheet-related props
  open?: boolean
  onOpenChange?: (open: boolean) => void
  
  // Form callback props
  onSuccess?: () => void
  onCancel?: () => void
  
  // Customization props
  className?: string
  useSheet?: boolean
  showDefaultHeader?: boolean
  title?: string
  description?: string
  
  // Edit mode props
  editingUser?: Profile | null
  
  // Optional refetch function for data invalidation
  refetch?: (() => void) | {
    all?: () => void
    comprehensive?: () => void
    comprehensiveRefresh?: () => void
    critical?: () => void
    secondary?: () => void
    detailed?: () => void
    refetch?: () => void
  }
}

export function ModernAddUserForm({ 
  open = false, 
  onOpenChange, 
  onSuccess, 
  onCancel, 
  className, 
  useSheet = false, 
  showDefaultHeader = true,
  title = "Create New User",
  description = "Add a new user to the system with their basic information and access permissions",
  editingUser = null,
  refetch
}: ModernAddUserFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(null)
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null)

  // Check if we're in edit mode
  const isEditMode = !!editingUser

  // Cleanup function for timeouts
  const clearTimeouts = () => {
    if (successTimeout) {
      clearTimeout(successTimeout)
      setSuccessTimeout(null)
    }
    if (errorTimeout) {
      clearTimeout(errorTimeout)
      setErrorTimeout(null)
    }
  }

  // SMART CACHE INVALIDATION - Preserves prefetched data while updating user metrics
  const invalidateDashboardCache = () => {
    console.log('🎯 SMART CACHE INVALIDATION: Preserving prefetched data, updating user metrics only')

    // Only invalidate user-related metrics, preserve comprehensive-dashboard-data
    smartCacheManager.delete('critical-dashboard-data', 'dashboard')
    smartCacheManager.delete('stats', 'dashboard')

    console.log('✅ Critical data invalidated, comprehensive data preserved')
  }

  // Handle open state for sheet mode
  const isOpen = useSheet ? (open || internalOpen) : true
  const handleOpenChange = (newOpen: boolean) => {
    if (useSheet) {
      if (onOpenChange) {
        onOpenChange(newOpen)
      } else {
        setInternalOpen(newOpen)
      }
    }
    if (!newOpen) {
      clearTimeouts() // Clear any pending timeouts
      form.reset()
      setSubmitError(null)
      setIsSuccess(false)
      onCancel?.()
    }
  }

  // Get TRPC utilities at the top level (not in callback)
  const utils = trpc.useUtils()

  // Dynamic schema and default values based on mode (edit mode doesn't require password)
  const validationSchema = isEditMode ? editUserSchema : createUserSchema
  const defaultValues = isEditMode ? {
    firstName: editingUser?.first_name || "",
    middleName: editingUser?.middle_name || "",
    lastName: editingUser?.last_name || "",
    email: editingUser?.email || "",
    mobileNo: editingUser?.mobile_no || "",
    dateOfBirth: editingUser?.date_of_birth || "",
    sex: (editingUser?.sex as "Male" | "Female") || "Male",
    role: editingUser?.role || "user",
  } : {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    mobileNo: "",
    dateOfBirth: "",
    sex: "Male" as const,
    role: "user" as const,
  }

  const form = useForm<CreateUserInput | EditUserInput>({
    resolver: zodResolver(validationSchema),
    defaultValues,
    mode: "onChange"
  })

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [])

  // Reset form when editingUser changes
  useEffect(() => {
    if (isEditMode && editingUser) {
      form.reset({
        firstName: editingUser?.first_name || "",
        middleName: editingUser?.middle_name || "",
        lastName: editingUser?.last_name || "",
        email: editingUser?.email || "",
        mobileNo: editingUser?.mobile_no || "",
        dateOfBirth: editingUser?.date_of_birth || "",
        sex: (editingUser?.sex as "Male" | "Female") || "Male",
        role: editingUser?.role || "user",
      })
    }
  }, [isEditMode, editingUser, form])

  // TRPC mutation for creating user
  const createUserMutation = trpc.admin.users.createUser.useMutation({
    onSuccess: async () => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setSubmitError(null)
      
      // Invalidate user list to refresh data (user management list)
      utils.admin.users.getUsers.invalidate()

      // SMART CACHE INVALIDATION: Preserve prefetched data, update only user metrics
      invalidateDashboardCache()
      
      console.log('🎯 SINGLE REFRESH COMPLETE: Only smart cache invalidation triggered')
      
      // Clear any existing success timeout and set a new one
      if (successTimeout) {
        clearTimeout(successTimeout)
      }
      
      const timeout = setTimeout(() => {
        setIsSuccess(false)
        form.reset()
        
        // Auto-close sheet after showing success state, then call onSuccess
        if (useSheet) {
          handleOpenChange(false)
        }
        
        // Small delay to ensure sheet closes before calling onSuccess (which might trigger refresh)
        setTimeout(() => {
          onSuccess?.()
        }, 150)
        
      }, 2500) // Increased to 2.5 seconds to ensure success text is visible before auto-close
      
      setSuccessTimeout(timeout)
    },
    onError: (error) => {
      setIsSubmitting(false)
      setIsSuccess(false)
      
      let errorMessage = 'Failed to create user'
      
      // Enhanced error message handling
      if (error.message.includes('already exists')) {
        errorMessage = 'A user with this email already exists'
      } else if (error.message.includes('Failed to create auth user')) {
        errorMessage = 'Failed to create authentication user. Please check the email format.'
      } else if (error.message.includes('Profile creation error')) {
        errorMessage = 'Failed to create user profile. Please try again.'
      } else if (error.message.includes('invalid input syntax for type date') || error.message.includes('invalid_date')) {
        errorMessage = 'Please enter a valid date of birth or leave it blank'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address'
      } else if (error.message.includes('Password')) {
        errorMessage = error.message // Use the schema-specific password message
      } else if (error.message.includes('mobile')) {
        errorMessage = 'Please enter a valid mobile number format'
      } else if (error.message) {
        errorMessage = error.message
      }

      setSubmitError(errorMessage)
      toast.error(errorMessage)
      
      // Clear any existing error timeout and set a new one
      if (errorTimeout) {
        clearTimeout(errorTimeout)
      }
      
      // Reset button state to idle after 5 seconds to allow retry
      const timeout = setTimeout(() => {
        setSubmitError(null)
      }, 5000)
      
      setErrorTimeout(timeout)
    },
  })

  // TRPC mutation for updating user
  const updateUserMutation = trpc.admin.users.updateUser.useMutation({
    onSuccess: async () => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setSubmitError(null)
      
      // Invalidate user list to refresh data (user management list)
      utils.admin.users.getUsers.invalidate()

      // SMART CACHE INVALIDATION: Preserve prefetched data, update only user metrics
      invalidateDashboardCache()
      
      console.log('🎯 USER UPDATE COMPLETE: Only smart cache invalidation triggered')
      
      // Clear any existing success timeout and set a new one
      if (successTimeout) {
        clearTimeout(successTimeout)
      }
      
      const timeout = setTimeout(() => {
        setIsSuccess(false)
        form.reset()
        
        // Auto-close sheet after showing success state, then call onSuccess
        if (useSheet) {
          handleOpenChange(false)
        }
        
        // Small delay to ensure sheet closes before calling onSuccess (which might trigger refresh)
        setTimeout(() => {
          onSuccess?.()
        }, 150)
        
      }, 2500) // Increased to 2.5 seconds to ensure success text is visible before auto-close
      
      setSuccessTimeout(timeout)
    },
    onError: (error) => {
      setIsSubmitting(false)
      setIsSuccess(false)
      
      let errorMessage = 'Failed to update user'
      
      // Enhanced error message handling
      if (error.message.includes('already exists')) {
        errorMessage = 'A user with this email already exists'
      } else if (error.message.includes('invalid input syntax for type date') || error.message.includes('invalid_date')) {
        errorMessage = 'Please enter a valid date of birth or leave it blank'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address'
      } else if (error.message.includes('mobile')) {
        errorMessage = 'Please enter a valid mobile number format'
      } else if (error.message) {
        errorMessage = error.message
      }

      setSubmitError(errorMessage)
      toast.error(errorMessage)
      
      // Clear any existing error timeout and set a new one
      if (errorTimeout) {
        clearTimeout(errorTimeout)
      }
      
      // Reset button state to idle after 5 seconds to allow retry
      const timeout = setTimeout(() => {
        setSubmitError(null)
      }, 5000)
      
      setErrorTimeout(timeout)
    },
  })

  const onSubmit = async (data: CreateUserInput | EditUserInput): Promise<void> => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    // Convert empty dateOfBirth string to undefined for schema compatibility
    const sanitizedData = {
      ...data,
      dateOfBirth: data.dateOfBirth === "" ? undefined : data.dateOfBirth
    }
    
    if (isEditMode) {
      // Use update mutation for edit mode
      const editData = {
        userId: editingUser!.id,
        firstName: sanitizedData.firstName,
        middleName: sanitizedData.middleName || "",
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        mobileNo: sanitizedData.mobileNo || "",
        dateOfBirth: sanitizedData.dateOfBirth,
        role: sanitizedData.role,
        sex: sanitizedData.sex,
      }
      await updateUserMutation.mutateAsync(editData)
    } else {
      // Use create mutation for create mode
      const createData = sanitizedData as CreateUserInput
      await createUserMutation.mutateAsync(createData)
    }
  }

  const handleFormSubmit = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      throw new Error("Please fix form errors")
    }
    
    await onSubmit(form.getValues())
  }

  const handleCancel = () => {
    clearTimeouts() // Clear any pending timeouts
    form.reset()
    setSubmitError(null)
    setIsSuccess(false)
    if (useSheet) {
      handleOpenChange(false)
    } else {
      onCancel?.()
    }
  }

  // Get dynamic title and icon based on mode
  const dynamicTitle = isEditMode ? "Edit User" : "Create New User"
  const dynamicDescription = isEditMode ? "Update user information and access permissions" : description
  const FormIcon = isEditMode ? Edit : UserPlus
  const buttonText = isEditMode ? "Update User" : "Create User"

  // Form content component
  const FormContent = () => (
    <div className={cn("px-4 sm:px-6 lg:px-6", useSheet ? "pb-4" : "py-4", "space-y-6")}>
      <Card className={cn("w-full max-w-2xl mx-auto bg-white shadow-lg border-2 border-border/60 rounded-lg", className)}>
        <CardContent className="p-6">
          {/* General Error Display */}
          {submitError && (
            <div className="mt-0 mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{submitError}</p> 
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
            {/* Personal Information Section */}
            <Accordion type="multiple" defaultValue={["personal-info"]} className="bg-white/80 backdrop-blur-sm rounded-lg border">
              <AccordionItem value="personal-info" className="border-b-0">
                <AccordionTrigger nonInteractive className="px-6 py-4 bg-muted/80">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-4 space-y-4">
                  {/* First Name, Middle Name, and Last Name in same row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <Controller
                      name="firstName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            autoComplete="given-name"
                            
                            {...field}
                          />
                          
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="middleName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                          <Input
                            id="middleName"
                            type="text"
                            placeholder="Michael"
                            autoComplete="additional-name"
                            
                            {...field}
                          />
                          
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="lastName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            autoComplete="family-name"
                            
                            {...field}
                          />
                          
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  {/* Mobile, Sex, and Date of Birth in same row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <Controller
                      name="mobileNo"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="mobileNo">Mobile Number</FieldLabel>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="mobileNo"
                              type="tel"
                              placeholder="+1234567890"
                              className="pl-10"
                              autoComplete="tel"
                              {...field}
                            />
                          </div>
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="sex"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="sex">Sex</FieldLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="dateOfBirth"
                      control={form.control}
                      render={({ field, fieldState }) => {
                        // Convert YYYY-MM-DD to dd/mm/yyyy for Calendar28 display
                        const displayValue = field.value && field.value.includes('-')
                          ? (() => {
                              const [year, month, day] = field.value.split('-')
                              return `${day}/${month}/${year}`
                            })()
                          : field.value || ""
                        
                        return (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                            <div className="relative">
                              <Calendar28
                                id="dateOfBirth"
                                value={displayValue}
                                onChange={(value) => {
                                  // Convert dd/mm/yyyy to YYYY-MM-DD for form
                                  if (value) {
                                    const [day, month, year] = value.split('/')
                                    if (day && month && year) {
                                      field.onChange(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
                                    }
                                  } else {
                                    field.onChange("")
                                  }
                                }}
                                label=""
                                className={fieldState.invalid ? "border-destructive" : ""}
                                removeSpacing={true}
                                minAge={18} // Example: minimum age 18
                                maxAge={100} // Example: maximum age 100
                                asOnDate={new Date()} // Optional: custom date for age calculation
                              />
                            </div>
                            {fieldState.invalid && fieldState.error && (
                              <FieldError errors={[fieldState.error]} className="mt-1" />
                            )}
                          </Field>
                        )
                      }}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Account Credentials Section - Only show in create mode */}
            {!isEditMode && (
              <Accordion type="multiple" defaultValue={["account-credentials"]} className="bg-white/80 backdrop-blur-sm rounded-lg border">
                <AccordionItem value="account-credentials" className="border-b-0">
                  <AccordionTrigger nonInteractive className="px-6 py-4 bg-muted/80">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <span>Account Credentials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-4 space-y-4">
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="email">Email Address *</FieldLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@example.com"
                              className="pl-10"
                              autoComplete="new-email"
                              data-form-type="other"
                              {...field}
                            />
                          </div>
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="password"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="password">Password *</FieldLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="Create a strong password"
                              className="pl-10"
                              autoComplete="new-password"
                              data-form-type="other"
                              {...field}
                            />
                          </div>
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Email section for edit mode */}
            {isEditMode && (
              <Accordion type="multiple" defaultValue={["account-credentials"]} className="bg-white/80 backdrop-blur-sm rounded-lg border">
                <AccordionItem value="account-credentials" className="border-b-0">
                  <AccordionTrigger nonInteractive className="px-6 py-4 bg-muted/80">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <span>Email Address</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-4 space-y-4">
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="email">Email Address *</FieldLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@example.com"
                              className="pl-10"
                              autoComplete="email"
                              data-form-type="other"
                              {...field}
                            />
                          </div>
                          {fieldState.invalid && fieldState.error && (
                            <FieldError errors={[fieldState.error]} className="mt-1" />
                          )}
                        </Field>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            
            {/* Access & Permissions Section */}
            <Accordion type="multiple" defaultValue={["access-permissions"]} className="bg-white/80 backdrop-blur-sm rounded-lg border">
              <AccordionItem value="access-permissions" className="border-b-0">
                <AccordionTrigger nonInteractive className="px-6 py-4 bg-muted/80">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    <span>Access & Permissions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-4 space-y-4">
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="role">User Role *</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Standard User</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && fieldState.error && (
                          <FieldError errors={[fieldState.error]} className="mt-1" />
                        )}
                      </Field>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Submit and Cancel Buttons */}
            <div className="flex gap-4 pt-6 mt-6 border-t border-border/20">
              <CancelButton
                onClick={handleCancel}
                disabled={form.formState.isSubmitting || isSubmitting}
                size="lg"
                className="flex-1"
              >
                Cancel
              </CancelButton>
              <CreateUserButton
                onClick={handleFormSubmit}
                disabled={!form.formState.isValid || form.formState.isSubmitting || isSubmitting || isSuccess}
                size="lg"
                className="flex-1"
                asyncState={isSubmitting ? 'loading' : isSuccess ? 'success' : submitError ? 'error' : 'idle'}
                errorText={submitError || `Failed to ${isEditMode ? 'update' : 'create'} user - Please try again`}
                mode={isEditMode ? 'edit' : 'create'}
              >
                {buttonText}
              </CreateUserButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )

  // If using sheet, wrap in Sheet component
  if (useSheet) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col">
          {showDefaultHeader && (
            <div className="flex-shrink-0 px-4 sm:px-6 border-b border-border/80 pb-3">
              <SheetHeader className="text-left pb-0">
                <SheetTitle className="flex items-center gap-3 text-xl font-bold py-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FormIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="leading-tight">{dynamicTitle}</span>
                    <span className="text-xs font-medium text-muted-foreground mt-0 leading-tight">
                      {dynamicDescription}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto mt-0">
            <FormContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Regular form content (without sheet)
  return <FormContent />
}

export default ModernAddUserForm
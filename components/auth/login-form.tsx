"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Mail, Lock, AlertCircle } from "lucide-react"
import toast from 'react-hot-toast'

import { LoginButton } from "@/components/ui/async-button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc/client"
import { dashboardPrefetcher } from "@/lib/dashboard-prefetch"

export function LoginForm() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: "onChange" // validates as you type
  })

  const loginMutation = trpc.auth.login.useMutation({
    onError: (error) => {
      // Enhanced error parsing for granular feedback
      const baseErrorMessage = 'Invalid email or password'
      
      // Extract field information from error data
      const errorData = error.data as { field?: string } | undefined
      const fieldToHighlight = errorData?.field || 'none'

      // Clear previous errors and set new ones
      setAuthError(null)
      setFieldErrors({})

      // Determine the specific field error based on the error response
      if (fieldToHighlight === 'email') {
        // Email not found - highlight email field only
        setFieldErrors({
          email: 'Email id not found'
        })
        setAuthError(baseErrorMessage)
      } else if (fieldToHighlight === 'password') {
        // Password incorrect - highlight password field only
        setFieldErrors({
          password: 'Password not matched'
        })
        setAuthError(baseErrorMessage)
      } else if (fieldToHighlight === 'both') {
        // Both fields incorrect - highlight both fields
        setFieldErrors({
          email: 'Email id not found',
          password: 'Password not matched',
        })
        setAuthError(baseErrorMessage)
      } else {
        // General authentication error
        setAuthError(baseErrorMessage)
      }

      // Show toast notification with the base error message
      toast.error(baseErrorMessage)
    },
    onSuccess: (data) => {
      // Clear all errors on success
      setAuthError(null)
      setFieldErrors({})
      setIsLoading(false)

      // Store user profile and handle redirect
      if (data?.profile) {
        localStorage.setItem('userProfile', JSON.stringify(data.profile))
        sessionStorage.setItem('sessionProfile', JSON.stringify(data.profile))

        // Start dashboard prefetch in background for admin users
        if (data.profile.role === 'admin') {
          // Fire-and-forget prefetch - don't wait for completion
          dashboardPrefetcher.prefetchDashboardData().catch((error) => {
            console.warn('Dashboard prefetch failed, but login continues:', error)
          })
        }

        // Redirect based on user role
        const redirectPath = data.profile.role === 'admin' ? '/admin' : '/user'
        router.push(redirectPath)
      }
    },
  })

  const onSubmit = async (data: LoginInput) => {
    // Clear any previous errors before attempting login
    setAuthError(null)
    setFieldErrors({})
    setIsLoading(true)
    
    try {
      // This will throw if authentication fails, allowing AsyncButton to show error state
      await loginMutation.mutateAsync(data)
    } catch (error) {
      // The error has already been handled by the mutation's onError handler
      // But we need to re-throw it so the AsyncButton can enter error state
      setIsLoading(false)
      throw error
    }
  }

  // Check for form validation errors
  const hasFormErrors = Object.keys(form.formState.errors).length > 0
  
  // Check if required fields have values (for button disabled logic)
  const hasRequiredFields = form.watch('email').length > 0 && form.watch('password').length > 0

  return (
    <div className="w-full max-w-md mx-auto space-y-1">
      {/* General Error Display */}
      {authError && !fieldErrors.email && !fieldErrors.password && (
        <div
          className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{authError}</span>
          </div>
        </div>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <Card>
          <CardContent className="px-4">
            <FieldSet>
              <FieldGroup className="space-y-1">
                {/* Email Field */}
                <Field data-invalid={!!fieldErrors.email || !!form.formState.errors.email}>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      autoComplete="email"
                      aria-invalid={!!fieldErrors.email || !!form.formState.errors.email}
                      disabled={isLoading || form.formState.isSubmitting}
                      {...form.register('email')}
                      onChange={(e) => {
                        form.setValue('email', e.target.value)
                        // Clear errors when user starts typing
                        if (e.target.value && (authError || fieldErrors.email)) {
                          setAuthError(null)
                          setFieldErrors(prev => ({ ...prev, email: undefined }))
                        }
                      }}
                    />
                  </div>
                  <FieldDescription>
                    Enter your registered email address.
                  </FieldDescription>
                  {(fieldErrors.email || form.formState.errors.email) && (
                    <FieldError errors={[{
                      message: fieldErrors.email || form.formState.errors.email?.message
                    }]} />
                  )}
                </Field>

                {/* Password Field */}
                <Field data-invalid={!!fieldErrors.password || !!form.formState.errors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      autoComplete="current-password"
                      aria-invalid={!!fieldErrors.password || !!form.formState.errors.password}
                      disabled={isLoading || form.formState.isSubmitting}
                      {...form.register('password')}
                      onChange={(e) => {
                        form.setValue('password', e.target.value)
                        // Clear errors when user starts typing
                        if (e.target.value && (authError || fieldErrors.password)) {
                          setAuthError(null)
                          setFieldErrors(prev => ({ ...prev, password: undefined }))
                        }
                      }}
                    />
                  </div>
                  <FieldDescription>
                    Must be at least 8 characters .
                  </FieldDescription>
                  {(fieldErrors.password || form.formState.errors.password) && (
                    <FieldError errors={[{
                      message: fieldErrors.password || form.formState.errors.password?.message
                    }]} />
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <LoginButton
          onClick={async () => {
            // Validate form before submission
            const isValid = await form.trigger()
            if (!isValid) {
              throw new Error("Please fix form errors")
            }
            
            // Handle form submission and check result
            const data = form.getValues()
            await onSubmit(data)
          }}
          loadingText="Signing In..."
          successText="Success! Redirecting..."
          errorText={hasFormErrors ? "Please fix form errors" : "Login failed! Please try again"}
          hasFormErrors={hasFormErrors}
          successDuration={3000}
          className="w-full"
          size="md"
          // Fixed: Only disable when required fields are empty or during async operations
          disabled={!hasRequiredFields || form.formState.isSubmitting || isLoading}
          variant="primary"
          
        >
          {form.formState.isSubmitting || isLoading ? "Signing in..." : "Sign In"}
        </LoginButton>
      </form>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Need access? Contact your administrator for account setup.
        </p>
      </div>
    </div>
  )
}
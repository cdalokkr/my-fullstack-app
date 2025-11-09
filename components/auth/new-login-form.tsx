"use client"

import { useState } from "react"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
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
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc/client"

export function NewLoginForm() {
  const router = useRouter()
  const [authError, setAuthError] = useState<{ type: string; message: string } | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange" // validates as you type
  })

  // TRPC mutation for login
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuthError(null)
      setIsAuthenticating(false)
      
      // Store user profile and handle redirect
      if (data?.profile) {
        localStorage.setItem('userProfile', JSON.stringify(data.profile))
        sessionStorage.setItem('sessionProfile', JSON.stringify(data.profile))
        
        // Redirect based on user role
        const redirectPath = data.profile.role === 'admin' ? '/admin' : '/user'
        router.push(redirectPath)
      }
    },
    onError: (error: unknown) => {
      const errorData = (error as { data?: { type?: string } })?.data
      const baseMessage = 'Login failed. Please check your credentials and try again.'
      
      setAuthError({
        type: errorData?.type || 'unknown',
        message: baseMessage
      })
      
      setIsAuthenticating(false)
      toast.error(baseMessage)
    },
  })

  const onSubmit = async (data: LoginInput): Promise<{ success: boolean; error?: string }> => {
    try {
      // Clear any existing errors
      setAuthError(null)
      setIsAuthenticating(true)
      
      // Execute login mutation
      await loginMutation.mutateAsync(data)
      
      // If we get here, login was successful
      return { success: true }
    } catch (error: unknown) {
      // Return error info so async button knows auth failed
      const errorData = (error as { data?: { type?: string } })?.data
      const baseMessage = 'Login failed. Please check your credentials and try again.'
      
      setAuthError({
        type: errorData?.type || 'unknown',
        message: baseMessage
      })
      
      setIsAuthenticating(false)
      return { success: false, error: baseMessage }
    }
  }

  // Check for form validation errors
  const hasFormErrors = Object.keys(form.formState.errors).length > 0

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* General Error Display */}
      {authError && (
        <div
          className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{authError.message}</span>
          </div>
        </div>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FieldSet>
          <FieldGroup>
            {/* Email Field */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                  <FieldDescription>
                    Enter your registered email address.
                  </FieldDescription>
                  {fieldState.invalid && fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      aria-invalid={fieldState.invalid}
                      autoComplete="current-password"
                      {...field}
                    />
                  </div>
                  <FieldDescription>
                    Must be at least 6 characters long.
                  </FieldDescription>
                  {fieldState.invalid && fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>

        <LoginButton
          onClick={async () => {
            // Validate form before submission
            const isValid = await form.trigger()
            if (!isValid) {
              throw new Error("Please fix form errors")
            }
            
            // Handle form submission and check result
            const result = await onSubmit(form.getValues())
            if (!result.success) {
              throw new Error(result.error || "Authentication failed")
            }
          }}
          loadingText="Signing In..."
          successText="Success! Redirecting..."
          errorText={hasFormErrors ? "Please fix form errors" : "Login failed! Please try again"}
          hasFormErrors={hasFormErrors}
          successDuration={3000}
          className="w-full"
          size="md"
          disabled={!form.formState.isValid || form.formState.isSubmitting || isAuthenticating}
          variant="primary"
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
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

export default NewLoginForm
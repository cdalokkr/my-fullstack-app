// ============================================
// components/auth/login-form.tsx
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { LoginButton } from '@/components/ui/async-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc/client'

export function LoginForm() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = trpc.auth.login.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Invalid credentials')
    },
  })

  const onSubmit = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="pl-10"
            disabled={isLoading}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            disabled={isLoading}
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <LoginButton
        onClick={async () => {
          const isValid = await trigger();
          if (!isValid) {
            throw new Error('Please check your input');
          }
          const data = getValues();
          await onSubmit(data);
        }}
        onStateChange={async (state) => {
          setIsLoading(state === 'loading' || state === 'success');
          if (state === 'success') {
            // Keep showing success text while API calls are executing
            try {
              // Get profile from login response
              const profile = loginMutation.data?.profile;
              if (!profile) return;
              
              // Store the fetched user profile in localStorage immediately
              localStorage.setItem('userProfile', JSON.stringify(profile));
              
              // Store session marker for splash screen
              sessionStorage.setItem('sessionProfile', JSON.stringify(profile));
              
              // Add a small delay to ensure authentication context is updated
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Execute API preloading with timeout to prevent hanging
              const preloadingTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Preloading timeout')), 8000)
              );
              
              // Preload critical dashboard data in parallel
              if (profile.role === 'admin') {
                try {
                  const preloadingPromises = [
                    utils.admin.dashboard.getComprehensiveDashboardData.prefetch({
                      analyticsDays: 7,
                      activitiesLimit: 10
                    }),
                    utils.admin.dashboard.getCriticalDashboardData.prefetch(),
                    utils.admin.dashboard.getSecondaryDashboardData.prefetch({ analyticsDays: 7 }),
                    utils.admin.dashboard.getDetailedDashboardData.prefetch(),
                    utils.admin.analytics.getAnalytics.prefetch({ days: 7 }),
                    utils.admin.dashboard.getStats.prefetch(),
                    utils.admin.dashboard.getRecentActivities.prefetch({ limit: 5 })
                  ].filter(Boolean);
                  
                  // Race between preloading and timeout
                  await Promise.race([
                    Promise.allSettled(preloadingPromises),
                    preloadingTimeout
                  ]);
                  
                } catch (error) {
                  console.warn('Some prefetch operations failed or timed out:', error);
                  // Continue with redirect even if preloading has issues
                }
              }
              
              // Preload avatar image if available (non-blocking)
              if (profile.avatar_url) {
                try {
                  const img = new Image();
                  img.src = profile.avatar_url;
                } catch (error) {
                  console.error('Error preloading avatar:', error);
                }
              }
              
              // Small delay to show success state, then redirect
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Redirect after successful authentication and data preloading
              router.push(profile.role === 'admin' ? '/admin' : '/user');
              
            } catch (error) {
              console.error('Error during login success handling:', error);
              // Still redirect even if there's an error
              const profile = loginMutation.data?.profile;
              if (profile) {
                router.push(profile.role === 'admin' ? '/admin' : '/user');
              }
            }
          }
        }}
        successDuration={8000} // Extended duration to accommodate API preloading
        autoReset={false}
        className="w-full"
        size="lg"
      >
        Sign In
      </LoginButton>

      {/* Info Text */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Only existing users can log in. Contact your administrator for access.
      </p>
    </form>
  )
}
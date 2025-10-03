// ============================================
// components/auth/login-form.tsx
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { LoginButton } from '@/components/ui/async-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FiLock, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { trpc } from '@/lib/trpc/client'

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { client: trpcClient } = trpc.useContext()
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
          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
        onStateChange={(state) => {
          setIsLoading(state === 'loading' || state === 'success');
          if (state === 'success') {
            (async () => {
              const profile = await trpcClient.profile.get.query();
              await new Promise(resolve => setTimeout(resolve, 4000));
              router.push(profile.role === 'admin' ? '/admin' : '/user');
            })();
          }
        }}
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
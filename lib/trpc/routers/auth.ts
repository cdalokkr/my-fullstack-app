// ============================================
// lib/trpc/routers/auth.ts
// Enhanced Login Validation with Specific Error Types
// ============================================

import { router, publicProcedure } from '../server'
import { loginSchema } from '@/lib/validations/auth'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

// Custom error types for specific validation scenarios
const AuthErrorTypes = {
  EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND',
  INCORRECT_PASSWORD: 'INCORRECT_PASSWORD', 
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { data, error } = await ctx.supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        })

        if (error) {
          // Parse Supabase error to provide specific error types
          const errorMessage = error.message?.toLowerCase() || ''
          const errorDescription = error.message || ''
          
          if (errorMessage.includes('invalid login credentials') || 
              errorMessage.includes('invalid credentials') ||
              errorMessage.includes('email not confirmed')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid email or password',
              cause: { type: AuthErrorTypes.INVALID_CREDENTIALS, field: 'both' }
            })
          }
          
          if (errorMessage.includes('email not found') ||
              errorMessage.includes('user not found') ||
              errorMessage.includes('signup_disabled')) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Invalid email or password',  // Same message for all auth failures
              cause: { type: AuthErrorTypes.EMAIL_NOT_FOUND, field: 'email' }
            })
          }
          
          if (errorMessage.includes('invalid password') ||
              errorMessage.includes('wrong password') ||
              errorMessage.includes('password is incorrect')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid email or password',  // Same message for all auth failures
              cause: { type: AuthErrorTypes.INCORRECT_PASSWORD, field: 'password' }
            })
          }
          
          // Generic unauthorized error
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',  // Same message for all auth failures
            cause: { type: AuthErrorTypes.INVALID_CREDENTIALS, field: 'both' }
          })
        }

        // Log successful login activity
        await ctx.supabase.from('activities').insert({
          user_id: data.user.id,
          activity_type: 'login',
          description: 'User logged in',
        })

        // Fetch profile AFTER successful authentication
        const { data: profileData } = await ctx.supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        return {
          success: true,
          profile: profileData
        }
      } catch (error) {
        // Handle network or other errors
        if (error instanceof TRPCError) {
          throw error
        }
        
        // Network or other errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Network error. Please check your connection and try again.',
          cause: { type: AuthErrorTypes.NETWORK_ERROR, field: 'none' }
        })
      }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    console.log('Logout procedure executed for user:', ctx.user?.id)
    if (ctx.user) {
      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'logout',
        description: 'User logged out',
      })
    }
    await ctx.supabase.auth.signOut()
    return { success: true }
  }),

  logActivity: publicProcedure
    .input(z.object({ type: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user) {
        await ctx.supabase.from('activities').insert({
          user_id: ctx.user.id,
          activity_type: input.type,
          description: `User ${input.type}`,
        })
      }
      return { success: true }
    }),
})
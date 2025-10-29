// ============================================
// lib/trpc/routers/auth.ts
// ============================================

import { router, publicProcedure } from '../server'
import { loginSchema } from '@/lib/validations/auth'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      })

      if (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        })
      }

      // Log activity
      await ctx.supabase.from('activities').insert({
        user_id: data.user.id,
        activity_type: 'login',
        description: 'User logged in',
      })

      // Fetch profile AFTER authentication
      // ctx.profile is null because context is created before authentication
      const { data: profileData } = await ctx.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      return {
        success: true,
        profile: profileData
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
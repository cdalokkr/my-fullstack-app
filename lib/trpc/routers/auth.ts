// ============================================
// lib/trpc/routers/auth.ts
// ============================================

import { router, publicProcedure } from '../server'
import { loginSchema } from '@/lib/validations/auth'
import { TRPCError } from '@trpc/server'

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

      return { success: true }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
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
})
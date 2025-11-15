// ============================================
// lib/trpc/routers/profile.ts
// ============================================
import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { profileUpdateSchema } from '@/lib/validations/auth'

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.profile
  }),

  update: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.supabase) {
        throw new Error('Database service unavailable')
      }
      
      const { data, error } = await ctx.supabase
        .from('profiles')
        .update(input)
        .eq('user_id', ctx.user.id)
        .select()
        .single()

      if (error) throw new Error(error.message)

      // Log activity
      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'profile_update',
        description: 'User updated profile',
      })

      return data
    }),

  getActivities: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Database service unavailable')
      }
      
      const { data } = await ctx.supabase
        .from('activities')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(input.limit)

      return data || []
    }),
})
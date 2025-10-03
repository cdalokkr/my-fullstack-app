// ============================================
// lib/trpc/routers/admin.ts
// ============================================
import { z } from 'zod'
import { router, adminProcedure } from '../server'
import { createUserSchema } from '../../validations/auth'

export const adminRouter = router({
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        role: z.enum(['admin', 'user', 'all']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      if (input.search) {
        query = query.or(`email.ilike.%${input.search}%,full_name.ilike.%${input.search}%`)
      }

      if (input.role !== 'all') {
        query = query.eq('role', input.role)
      }

      const { data, count } = await query
        .order('created_at', { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1)

      return {
        users: data || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / input.limit),
      }
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(['admin', 'user']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('profiles')
        .update({ role: input.role })
        .eq('id', input.userId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: `Admin updated user role to ${input.role}`,
        metadata: { target_user_id: input.userId },
      })

      return data
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete profile (cascade will handle related records)
      const { error } = await ctx.supabase
        .from('profiles')
        .delete()
        .eq('id', input.userId)

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin deleted user',
        metadata: { deleted_user_id: input.userId },
      })

      return { success: true }
    }),

  getAnalytics: adminProcedure
    .input(
      z.object({
        days: z.number().default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from('analytics_metrics')
        .select('*')
        .gte('metric_date', new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString())
        .order('metric_date', { ascending: true })

      return data || []
    }),

  getStats: adminProcedure.query(async ({ ctx }) => {
    const [usersCount, activitiesCount, todayActivities] = await Promise.all([
      ctx.supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ctx.supabase.from('activities').select('*', { count: 'exact', head: true }),
      ctx.supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
    ])

    return {
      totalUsers: usersCount.count || 0,
      totalActivities: activitiesCount.count || 0,
      todayActivities: todayActivities.count || 0,
    }
  }),

  getRecentActivities: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from('activities')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })
        .limit(input.limit)

      return data || []
    }),

  createUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const { data: existingAuthUser } = await ctx.supabase.auth.admin.listUsers()
      const userExists = existingAuthUser?.users.some(u => u.email === input.email)
      
      if (userExists) {
        throw new Error(`A user with email ${input.email} already exists`)
      }
      
      // Create auth user
      const { data: authData, error: authError } = await ctx.supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      // Create the profile
      const { data: profileData, error: profileError } = await ctx.supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          user_id: authData.user!.id,
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
          mobile_no: input.mobileNo,
          date_of_birth: input.dateOfBirth,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        // Rollback: delete the auth user if profile creation fails
        await ctx.supabase.auth.admin.deleteUser(authData.user!.id)
        throw new Error(`Profile creation error: ${profileError.message}`)
      }

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin created new user',
        metadata: { new_user_id: authData.user!.id },
      })

      return { success: true, user: profileData }
    }),
})
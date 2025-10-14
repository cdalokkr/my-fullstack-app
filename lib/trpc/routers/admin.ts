// ============================================
// lib/trpc/routers/admin.ts
// ============================================
import { z } from 'zod'
import { router, adminProcedure } from '../server'
import { createUserSchema } from '../../validations/auth'
import { Profile } from '../../../types'

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

  updateUserProfile: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        mobileNo: z.string().optional(),
        dateOfBirth: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<Pick<Profile, 'first_name' | 'last_name' | 'mobile_no' | 'date_of_birth' | 'updated_at'>> = {}
      if (input.firstName !== undefined) updateData.first_name = input.firstName
      if (input.lastName !== undefined) updateData.last_name = input.lastName
      if (input.mobileNo !== undefined) updateData.mobile_no = input.mobileNo
      if (input.dateOfBirth !== undefined) updateData.date_of_birth = input.dateOfBirth
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await ctx.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', input.userId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin updated user profile',
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
  
    getDashboardData: adminProcedure
      .input(
        z.object({
          analyticsDays: z.number().default(7),
          activitiesLimit: z.number().default(10),
        })
      )
      .query(async ({ ctx, input }) => {
        // Execute all queries in parallel for optimal performance
        const [usersCount, activitiesCount, todayActivities, analytics, recentActivities] = await Promise.all([
          // Stats queries
          ctx.supabase.from('profiles').select('*', { count: 'exact', head: true }),
          ctx.supabase.from('activities').select('*', { count: 'exact', head: true }),
          ctx.supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]),
          
          // Analytics query
          ctx.supabase
            .from('analytics_metrics')
            .select('*')
            .gte('metric_date', new Date(Date.now() - input.analyticsDays * 24 * 60 * 60 * 1000).toISOString())
            .order('metric_date', { ascending: true }),
          
          // Recent activities query
          ctx.supabase
            .from('activities')
            .select('*, profiles(email, full_name)')
            .order('created_at', { ascending: false })
            .limit(input.activitiesLimit),
        ])
  
        // Construct the response with proper error handling
        const stats = {
          totalUsers: usersCount.count || 0,
          totalActivities: activitiesCount.count || 0,
          todayActivities: todayActivities.count || 0,
        }
  
        // Add metadata for caching and versioning
        const metadata = {
          fetchedAt: new Date().toISOString(),
          version: '1.0.0',
          cacheExpiry: Date.now() + (30 * 1000), // 30 seconds cache expiry
        }
  
        return {
          stats,
          analytics: analytics.data || [],
          recentActivities: recentActivities.data || [],
          metadata,
        }
      }),
  
    createUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const { data: existingProfile } = await ctx.supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .single()

      if (existingProfile) {
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
          role: input.role,
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

      return profileData
    }),

  // Progressive loading endpoints for better perceived performance
  getCriticalDashboardData: adminProcedure.query(async ({ ctx }) => {
    // Tier 1: Critical data needed immediately (basic stats)
    const [usersCount, activeUsersCount] = await Promise.all([
      ctx.supabase.from('profiles').select('*', { count: 'exact', head: true }),
      // Calculate active users (users with activities in last 7 days)
      ctx.supabase
        .from('activities')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .then(({ data }) => {
          const uniqueUsers = new Set(data?.map(a => a.user_id))
          return { count: uniqueUsers.size }
        })
    ])

    return {
      totalUsers: usersCount.count || 0,
      activeUsers: activeUsersCount.count || 0,
      metadata: {
        tier: 'critical',
        fetchedAt: new Date().toISOString(),
        cacheExpiry: Date.now() + (15 * 1000), // 15 seconds cache for critical data
      }
    }
  }),

  getSecondaryDashboardData: adminProcedure
    .input(
      z.object({
        analyticsDays: z.number().default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      // Tier 2: Secondary data for detailed metrics
      const [activitiesCount, todayActivities, analytics] = await Promise.all([
        ctx.supabase.from('activities').select('*', { count: 'exact', head: true }),
        ctx.supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
        ctx.supabase
          .from('analytics_metrics')
          .select('*')
          .gte('metric_date', new Date(Date.now() - input.analyticsDays * 24 * 60 * 60 * 1000).toISOString())
          .order('metric_date', { ascending: true })
      ])

      return {
        totalActivities: activitiesCount.count || 0,
        todayActivities: todayActivities.count || 0,
        analytics: analytics.data || [],
        metadata: {
          tier: 'secondary',
          fetchedAt: new Date().toISOString(),
          cacheExpiry: Date.now() + (30 * 1000), // 30 seconds cache for secondary data
        }
      }
    }),

  getDetailedDashboardData: adminProcedure
    .query(async ({ ctx }) => {
      // Tier 3: Detailed data for recent activities
      const { data } = await ctx.supabase
        .from('activities')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })

      return {
        recentActivities: data || [],
        metadata: {
          tier: 'detailed',
          fetchedAt: new Date().toISOString(),
          cacheExpiry: Date.now() + (60 * 1000), // 60 seconds cache for detailed data
        }
      }
    }),

  // Analytics endpoints
  getCriticalAnalyticsData: adminProcedure.query(async ({ ctx }) => {
    // Tier 1: Critical analytics KPIs
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Mock calculations - in real implementation, these would be calculated from actual data
    const [totalUsers, activities] = await Promise.all([
      ctx.supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ctx.supabase
        .from('activities')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ])

    // Calculate basic KPIs (placeholder calculations)
    const userEngagementRate = activities.data ? (activities.data.length / (totalUsers.count || 1)) * 100 : 0
    const averageSessionDuration = 180 // seconds - placeholder
    const conversionRate = 3.2 // percentage - placeholder
    const bounceRate = 45.8 // percentage - placeholder

    return {
      kpis: {
        userEngagementRate,
        averageSessionDuration,
        conversionRate,
        bounceRate,
        pageViews: activities.data?.length || 0,
        uniqueVisitors: totalUsers.count || 0,
        newUsers: Math.floor((totalUsers.count || 0) * 0.15), // placeholder
        returningUsers: Math.floor((totalUsers.count || 0) * 0.85), // placeholder
      },
      metadata: {
        tier: 'critical',
        fetchedAt: new Date().toISOString(),
        cacheExpiry: Date.now() + (15 * 1000), // 15 seconds cache
      }
    }
  }),

  getSecondaryAnalyticsData: adminProcedure
    .input(
      z.object({
        days: z.number().default(30),
        segment: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Tier 2: Secondary analytics data - charts and trends
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)

      const [analyticsData, topPages] = await Promise.all([
        ctx.supabase
          .from('analytics_metrics')
          .select('*')
          .gte('metric_date', startDate.toISOString())
          .order('metric_date', { ascending: true }),
        // Mock top pages data - in real implementation, this would come from page view tracking
        Promise.resolve([
          { page: '/dashboard', views: 1250, uniqueViews: 890, avgTimeOnPage: 180, bounceRate: 35.2 },
          { page: '/profile', views: 980, uniqueViews: 720, avgTimeOnPage: 240, bounceRate: 28.5 },
          { page: '/analytics', views: 750, uniqueViews: 650, avgTimeOnPage: 300, bounceRate: 22.1 },
          { page: '/users', views: 620, uniqueViews: 580, avgTimeOnPage: 150, bounceRate: 45.8 },
          { page: '/settings', views: 480, uniqueViews: 420, avgTimeOnPage: 120, bounceRate: 52.3 },
        ])
      ])

      // Mock cohort analysis data
      const cohortAnalysis = [
        { cohort: 'Jan 2024', period: 'Month 1', users: 100, retention: 85.2 },
        { cohort: 'Jan 2024', period: 'Month 2', users: 85, retention: 72.1 },
        { cohort: 'Jan 2024', period: 'Month 3', users: 61, retention: 58.9 },
        { cohort: 'Feb 2024', period: 'Month 1', users: 120, retention: 88.5 },
        { cohort: 'Feb 2024', period: 'Month 2', users: 106, retention: 75.3 },
      ]

      return {
        analytics: analyticsData.data || [],
        topPages,
        cohortAnalysis,
        metadata: {
          tier: 'secondary',
          fetchedAt: new Date().toISOString(),
          cacheExpiry: Date.now() + (30 * 1000), // 30 seconds cache
        }
      }
    }),

  getDetailedAnalyticsData: adminProcedure
    .input(
      z.object({
        metric: z.string(),
        dateRange: z.object({
          start: z.string(),
          end: z.string(),
        }),
        segment: z.string().optional(),
      })
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .query(async ({ ctx, input }) => {
      // Tier 3: Detailed analytics data for drill-down
      const startDate = new Date(input.dateRange.start)
      const endDate = new Date(input.dateRange.end)

      // Mock detailed data based on metric type
      const detailedData: Array<{
        date: string
        value: number
        breakdown?: Record<string, number>
      }> = []

      if (input.metric === 'userEngagement') {
        // Generate mock daily engagement data
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          detailedData.push({
            date: d.toISOString().split('T')[0],
            value: Math.floor(Math.random() * 100) + 50,
            breakdown: {
              pageViews: Math.floor(Math.random() * 200) + 100,
              uniqueVisitors: Math.floor(Math.random() * 80) + 30,
              sessionDuration: Math.floor(Math.random() * 300) + 120,
            }
          })
        }
      } else if (input.metric === 'conversion') {
        // Generate mock conversion funnel data
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          detailedData.push({
            date: d.toISOString().split('T')[0],
            value: Math.floor(Math.random() * 10) + 1,
            breakdown: {
              visitors: Math.floor(Math.random() * 500) + 200,
              signups: Math.floor(Math.random() * 50) + 10,
              purchases: Math.floor(Math.random() * 10) + 1,
            }
          })
        }
      }

      // Mock funnel stages data
      const funnelStages = [
        { stage: 'Visitors', users: 1000, conversionRate: 100, dropOffRate: 0 },
        { stage: 'Signups', users: 120, conversionRate: 12, dropOffRate: 88 },
        { stage: 'Active Users', users: 85, conversionRate: 8.5, dropOffRate: 29.2 },
        { stage: 'Premium Users', users: 25, conversionRate: 2.5, dropOffRate: 70.6 },
      ]

      return {
        detailedData,
        funnelStages,
        metadata: {
          tier: 'detailed',
          fetchedAt: new Date().toISOString(),
          cacheExpiry: Date.now() + (60 * 1000), // 60 seconds cache
        }
      }
    }),
})
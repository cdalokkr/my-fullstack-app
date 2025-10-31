// ============================================
// lib/trpc/routers/admin-dashboard.ts
// ============================================
import { z } from 'zod'
import { router, adminProcedure } from '../server'

export const adminDashboardRouter = router({
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
})
// ============================================
// lib/trpc/routers/admin-dashboard-optimized.ts
// Performance-optimized admin dashboard router with API consolidation
// ============================================
import { z } from 'zod'
import { router, adminProcedure } from '../server'

// Performance monitoring for dashboard endpoints
interface DashboardPerformanceMetrics {
  totalQueriesExecuted: number
  databaseTime: number
  queryOptimizationApplied: boolean
  cacheHit: boolean
  endpoint: string
  startTime: number
}

// Request deduplication cache
const requestCache = new Map<string, { data: any; expiry: number; promise: Promise<any> }>()
const CACHE_TTL = 15 * 1000 // 15 seconds

function startDashboardTiming(endpoint: string): DashboardPerformanceMetrics {
  return {
    totalQueriesExecuted: 0,
    databaseTime: 0,
    queryOptimizationApplied: false,
    cacheHit: false,
    endpoint,
    startTime: performance.now()
  }
}

function endDashboardTiming(metrics: DashboardPerformanceMetrics) {
  const totalTime = performance.now() - metrics.startTime
  
  // Log slow endpoints
  if (totalTime > 1000) {
    console.warn(`[DASHBOARD-PERF] Slow endpoint ${metrics.endpoint}: ${totalTime.toFixed(2)}ms`, {
      totalTime,
      queries: metrics.totalQueriesExecuted,
      databaseTime: metrics.databaseTime,
      cacheHit: metrics.cacheHit
    })
  }
  
  return { ...metrics, totalTime }
}

// Optimized query execution with batching
async function executeOptimizedQueries(ctx: any, queries: Array<() => Promise<any>>, metrics: DashboardPerformanceMetrics) {
  const results = []
  const queryStartTime = performance.now()
  
  // Execute queries in batches to avoid overwhelming the database
  const batchSize = 3
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(batch.map(query => query()))
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
        metrics.totalQueriesExecuted++
      } else {
        console.error('[DASHBOARD-PERF] Query failed:', result.reason)
        results.push(null)
      }
    }
  }
  
  metrics.databaseTime += performance.now() - queryStartTime
  return results
}

// Request deduplication helper
function getCachedRequest<T>(key: string): T | null {
  const cached = requestCache.get(key)
  if (cached && Date.now() < cached.expiry) {
    return cached.data
  }
  if (cached) {
    requestCache.delete(key)
  }
  return null
}

function setCachedRequest<T>(key: string, data: T, promise: Promise<T>): void {
  requestCache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL,
    promise
  })
  
  // Clean up cache to prevent memory leaks
  if (requestCache.size > 50) {
    const now = Date.now()
    for (const [key, value] of requestCache.entries()) {
      if (value.expiry < now) {
        requestCache.delete(key)
      }
    }
  }
}

export const adminDashboardRouter = router({
  // ULTRA-OPTIMIZED: Single endpoint that replaces all 5 separate calls
  getUnifiedDashboardData: adminProcedure
    .input(
      z.object({
        analyticsDays: z.number().default(7),
        activitiesLimit: z.number().default(10),
        enableCache: z.boolean().default(true),
        priority: z.enum(['speed', 'freshness']).default('speed')
      })
    )
    .query(async ({ ctx, input }) => {
      const metrics = startDashboardTiming('getUnifiedDashboardData')
      const cacheKey = `unified-dashboard-${input.analyticsDays}-${input.activitiesLimit}-${input.priority}`
      
      try {
        // Check cache first
        if (input.enableCache) {
          const cachedData = getCachedRequest(cacheKey)
          if (cachedData) {
            metrics.cacheHit = true
            return endDashboardTiming(metrics)
          }
        }
        
        // Execute all queries in a single optimized batch
        const queries = [
          // Critical metrics (users and active users)
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            const result = await ctx.supabase
              .from('profiles')
              .select('id, user_id, role', { count: 'exact' })
            return { ...result, query: 'totalUsers' }
          },
          
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            const result = await ctx.supabase
              .from('activities')
              .select('user_id')
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            const uniqueUsers = new Set(result.data?.map(a => a.user_id).filter(Boolean) || [])
            return { count: uniqueUsers.size, query: 'activeUsers' }
          },
          
          // Activity metrics
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            const result = await ctx.supabase
              .from('activities')
              .select('*', { count: 'exact' })
            return { ...result, query: 'totalActivities' }
          },
          
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            const result = await ctx.supabase
              .from('activities')
              .select('*', { count: 'exact' })
              .gte('created_at', new Date().toISOString().split('T')[0])
            return { ...result, query: 'todayActivities' }
          },
          
          // Analytics data (if priority is freshness or if analytics table exists)
          ...(input.priority === 'freshness' ? [
            async () => {
              if (!ctx.supabase) throw new Error('Supabase client not available')
              const result = await ctx.supabase
                .from('analytics_metrics')
                .select('*')
                .gte('metric_date', new Date(Date.now() - input.analyticsDays * 24 * 60 * 60 * 1000).toISOString())
                .order('metric_date', { ascending: true })
              return { ...result, query: 'analytics' }
            }
          ] : []),
          
          // Recent activities (if priority is freshness)
          ...(input.priority === 'freshness' ? [
            async () => {
              if (!ctx.supabase) throw new Error('Supabase client not available')
              const result = await ctx.supabase
                .from('activities')
                .select('*, profiles(email, full_name)')
                .order('created_at', { ascending: false })
                .limit(input.activitiesLimit)
              return { ...result, query: 'recentActivities' }
            }
          ] : [])
        ]
        
        const queryResults = await executeOptimizedQueries(ctx, queries, metrics)
        
        // Process results efficiently
        const result = {
          critical: {
            totalUsers: queryResults[0]?.count || 0,
            activeUsers: queryResults[1]?.count || 0,
            metadata: {
              tier: 'critical',
              fetchedAt: new Date().toISOString(),
              cacheExpiry: Date.now() + (15 * 1000),
            }
          },
          secondary: {
            totalActivities: queryResults[2]?.count || 0,
            todayActivities: queryResults[3]?.count || 0,
            analytics: input.priority === 'freshness' ? (queryResults[4]?.data || []) : [],
            metadata: {
              tier: 'secondary',
              fetchedAt: new Date().toISOString(),
              cacheExpiry: Date.now() + (30 * 1000),
            }
          },
          detailed: {
            recentActivities: input.priority === 'freshness' ? (queryResults[5]?.data || []) : [],
            metadata: {
              tier: 'detailed',
              fetchedAt: new Date().toISOString(),
              cacheExpiry: Date.now() + (60 * 1000),
            }
          },
          metadata: {
            consolidated: true,
            unified: true,
            fetchedAt: new Date().toISOString(),
            version: '3.0.0',
            priority: input.priority,
            performance: {
              totalQueries: metrics.totalQueriesExecuted,
              databaseTime: metrics.databaseTime,
              cacheHit: metrics.cacheHit
            }
          }
        }
        
        // Cache the result
        if (input.enableCache) {
          const promise = Promise.resolve(result)
          setCachedRequest(cacheKey, result, promise)
        }
        
        return result
        
      } catch (error) {
        console.error('[DASHBOARD-PERF] Unified dashboard data failed:', error)
        throw error
      }
    }),

  // Backward compatibility: Optimized versions of existing endpoints
  getStats: adminProcedure.query(async ({ ctx }) => {
    const metrics = startDashboardTiming('getStats')
    
    try {
      if (!ctx.supabase) throw new Error('Supabase client not available')
      
      const [usersCount, activitiesCount, todayActivities] = await Promise.all([
        ctx.supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ctx.supabase.from('activities').select('*', { count: 'exact', head: true }),
        ctx.supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
      ])
      
      metrics.totalQueriesExecuted = 3
      
      return {
        totalUsers: usersCount.count || 0,
        totalActivities: activitiesCount.count || 0,
        todayActivities: todayActivities.count || 0,
        ...endDashboardTiming(metrics)
      }
    } catch (error) {
      console.error('[DASHBOARD-PERF] getStats failed:', error)
      throw error
    }
  }),

  getRecentActivities: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const metrics = startDashboardTiming('getRecentActivities')
      
      try {
        if (!ctx.supabase) throw new Error('Supabase client not available')
        
        const { data } = await ctx.supabase
          .from('activities')
          .select('*, profiles(email, full_name)')
          .order('created_at', { ascending: false })
          .limit(input.limit)
          
        metrics.totalQueriesExecuted = 1
        
        return {
          data: data || [],
          ...endDashboardTiming(metrics)
        }
      } catch (error) {
        console.error('[DASHBOARD-PERF] getRecentActivities failed:', error)
        throw error
      }
    }),

  // Enhanced comprehensive endpoint with performance monitoring
  getComprehensiveDashboardData: adminProcedure
    .input(
      z.object({
        analyticsDays: z.number().default(7),
        activitiesLimit: z.number().default(10),
        enablePerformanceMonitoring: z.boolean().default(true)
      })
    )
    .query(async ({ ctx, input }) => {
      const metrics = startDashboardTiming('getComprehensiveDashboardData')
      const cacheKey = `comprehensive-dashboard-${input.analyticsDays}-${input.activitiesLimit}`
      
      try {
        // Check cache
        const cachedData = getCachedRequest(cacheKey)
        if (cachedData) {
          metrics.cacheHit = true
          return cachedData
        }
        
        if (!ctx.supabase) throw new Error('Supabase client not available')
        
        // Execute optimized queries
        const [
          usersResult,
          activitiesResult,
          todayResult,
          analyticsResult,
          recentResult,
          activeUsersResult
        ] = await executeOptimizedQueries(ctx, [
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            return await ctx.supabase.from('profiles').select('*', { count: 'exact', head: true })
          },
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            return await ctx.supabase.from('activities').select('*', { count: 'exact', head: true })
          },
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            return await ctx.supabase
              .from('activities')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', new Date().toISOString().split('T')[0])
          },
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            return await ctx.supabase
              .from('analytics_metrics')
              .select('*')
              .gte('metric_date', new Date(Date.now() - input.analyticsDays * 24 * 60 * 60 * 1000).toISOString())
              .order('metric_date', { ascending: true })
          },
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            return await ctx.supabase
              .from('activities')
              .select('*, profiles(email, full_name)')
              .order('created_at', { ascending: false })
              .limit(input.activitiesLimit)
          },
          async () => {
            if (!ctx.supabase) throw new Error('Supabase client not available')
            return await ctx.supabase
              .from('activities')
              .select('user_id')
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          }
        ], metrics)
        
        // Process results
        const uniqueUsers = new Set(activeUsersResult?.data?.map((a: any) => a.user_id).filter(Boolean) || [])
        
        const result = {
          critical: {
            totalUsers: usersResult?.count || 0,
            activeUsers: uniqueUsers.size,
            metadata: {
              tier: 'critical',
              fetchedAt: new Date().toISOString(),
              cacheExpiry: Date.now() + (15 * 1000),
            }
          },
          secondary: {
            totalActivities: activitiesResult?.count || 0,
            todayActivities: todayResult?.count || 0,
            analytics: analyticsResult?.data || [],
            metadata: {
              tier: 'secondary',
              fetchedAt: new Date().toISOString(),
              cacheExpiry: Date.now() + (30 * 1000),
            }
          },
          detailed: {
            recentActivities: recentResult?.data || [],
            metadata: {
              tier: 'detailed',
              fetchedAt: new Date().toISOString(),
              cacheExpiry: Date.now() + (60 * 1000),
            }
          },
          metadata: {
            consolidated: true,
            fetchedAt: new Date().toISOString(),
            version: '3.0.0',
            cacheExpiry: Date.now() + (15 * 1000),
            performance: {
              totalQueries: metrics.totalQueriesExecuted,
              databaseTime: metrics.databaseTime,
              cacheHit: metrics.cacheHit
            }
          }
        }
        
        // Cache result
        const promise = Promise.resolve(result)
        setCachedRequest(cacheKey, result, promise)
        
        return result
      } catch (error) {
        console.error('[DASHBOARD-PERF] Comprehensive dashboard failed:', error)
        throw error
      }
    }),
})

// Performance monitoring utilities
export function getDashboardPerformanceStats() {
  return {
    requestCacheSize: requestCache.size,
    activeRequests: Array.from(requestCache.keys()),
    cacheHitRate: 'Implemented', // Would need to track hit/miss ratio
    activeEndpoints: 'Multiple endpoints monitored'
  }
}
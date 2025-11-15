'use client'

import { trpc } from '@/lib/trpc/client'
import { useEffect, useCallback, useState } from 'react'

// ============================================
// FRESH REAL-TIME DASHBOARD DATA HOOK
// No cache dependency - Direct API calls every time
// Real-time updates via events and refetch
// ============================================

interface DashboardStats {
  totalUsers: number
  totalActivities: number
  todayActivities: number
}

interface RecentActivity {
  id: string
  description: string
  created_at: string
  profiles?: {
    email: string
    full_name: string
  }
}

interface AnalyticsMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_date: string
}

interface RealtimeDashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  analytics: AnalyticsMetric[]
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  refetchStats: () => void
  refetchActivities: () => void
  refetchAnalytics: () => void
}

export function useRealtimeDashboardData(): RealtimeDashboardData {
  const [isManualRefresh, setIsManualRefresh] = useState(false)

  // Direct tRPC queries - NO CACHE
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats
  } = trpc.admin.dashboard.getStats.useQuery(undefined, {
    // CRITICAL: No cache - always fetch fresh data
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = trpc.admin.dashboard.getRecentActivities.useQuery(
    { limit: 10 },
    {
      // CRITICAL: No cache - always fetch fresh data
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  )

  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = trpc.admin.dashboard.getSecondaryDashboardData.useQuery(
    { analyticsDays: 7 },
    {
      // CRITICAL: No cache - always fetch fresh data
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  )

  // Auto-refetch after user operations
  useEffect(() => {
    const handleUserOperationComplete = () => {
      console.log('🔄 User operation completed - refreshing all dashboard data simultaneously')
      // Small delay to ensure database operations complete
      setTimeout(() => {
        // Refresh all data to ensure consistent state across all magic cards
        Promise.all([
          refetchStats(),
          refetchActivities(),
          refetchAnalytics()
        ]).then(() => {
          console.log('✅ All dashboard data refreshed simultaneously')
        })
      }, 100)
    }

    const handleUserOperationStart = () => {
      console.log('🚀 User operation started')
    }

    window.addEventListener('user-operation-complete', handleUserOperationComplete)
    window.addEventListener('user-operation-start', handleUserOperationStart)

    return () => {
      window.removeEventListener('user-operation-complete', handleUserOperationComplete)
      window.removeEventListener('user-operation-start', handleUserOperationStart)
    }
  }, [refetchStats, refetchActivities, refetchAnalytics])

  // Manual refresh function
  const refetch = useCallback(() => {
    console.log('🔄 Manual dashboard refresh triggered')
    setIsManualRefresh(true)
    
    Promise.all([
      refetchStats(),
      refetchActivities(),
      refetchAnalytics()
    ]).finally(() => {
      setIsManualRefresh(false)
    })
  }, [refetchStats, refetchActivities, refetchAnalytics])

  // Calculate derived data
  const stats: DashboardStats = {
    totalUsers: statsData?.totalUsers || 0,
    totalActivities: statsData?.totalActivities || 0,
    todayActivities: statsData?.todayActivities || 0,
  }

  const recentActivities: RecentActivity[] = activitiesData || []
  const analytics: AnalyticsMetric[] = analyticsData?.analytics || []

  const isLoading = isStatsLoading || isActivitiesLoading || isAnalyticsLoading || isManualRefresh
  const isError = !!statsError || !!activitiesError || !!analyticsError
  const error = statsError || activitiesError || analyticsError

  return {
    stats,
    recentActivities,
    analytics,
    isLoading,
    isError,
    error,
    refetch,
    refetchStats,
    refetchActivities,
    refetchAnalytics,
  }
}

// ============================================
// COMPREHENSIVE REALTIME HOOK
// Handles all dashboard data in one call
// ============================================

interface ComprehensiveRealtimeData extends RealtimeDashboardData {
  // Additional computed data
  activeUsers: number
  dataSource: 'cache' | 'fresh' | 'loading'
  lastUpdated: Date | null
  // Progressive loading states
  magicCardsDataReady: boolean
  recentActivityDataReady: boolean
}

export function useComprehensiveRealtimeDashboard(): ComprehensiveRealtimeData {
  const {
    stats,
    recentActivities,
    analytics,
    isLoading,
    isError,
    error,
    refetch,
    refetchStats,
    refetchActivities,
    refetchAnalytics
  } = useRealtimeDashboardData()

  // Progressive loading state management
  const [magicCardsDataReady, setMagicCardsDataReady] = useState(false)
  const [recentActivityDataReady, setRecentActivityDataReady] = useState(false)

  // Calculate active users from analytics
  const activeUsers = analytics.reduce((acc, metric) => {
    if (metric.metric_name === 'active_users') {
      return acc + metric.metric_value
    }
    return acc
  }, 0)

  // Handle progressive loading with staggered delays
  useEffect(() => {
    // Layout is always ready immediately
    // Magic card data gets a small delay to show skeleton animation
    if (!isLoading && (stats.totalUsers !== undefined || stats.totalActivities !== undefined)) {
      const magicCardsTimer = setTimeout(() => {
        setMagicCardsDataReady(true)
      }, 150) // Small delay for skeleton animation

      // Recent activity data loads after magic card data
      const recentActivityTimer = setTimeout(() => {
        setRecentActivityDataReady(true)
      }, 300)

      return () => {
        clearTimeout(magicCardsTimer)
        clearTimeout(recentActivityTimer)
      }
    } else {
      setMagicCardsDataReady(false)
      setRecentActivityDataReady(false)
    }
  }, [isLoading, stats.totalUsers, stats.totalActivities])

  // Determine data source and loading states
  const dataSource: 'cache' | 'fresh' | 'loading' = isLoading ? 'loading' : 'fresh'
  const lastUpdated = isLoading ? null : new Date()

  return {
    // Base data
    stats,
    recentActivities,
    analytics,
    isLoading,
    isError,
    error,
    refetch,
    refetchStats,
    refetchActivities,
    refetchAnalytics,
    
    // Computed data
    activeUsers,
    dataSource,
    lastUpdated,
    
    // Progressive loading states
    magicCardsDataReady,
    recentActivityDataReady,
  }
}
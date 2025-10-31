'use client'

import { trpc } from '@/lib/trpc/client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { smartCacheManager } from '@/lib/cache/smart-cache-manager'
import { cacheInvalidation } from '@/lib/cache/cache-invalidation'
import { backgroundRefresher } from '@/lib/cache/background-refresher'
import { adaptiveTTLEngine } from '@/lib/cache/adaptive-ttl-engine'

interface CriticalData {
  totalUsers: number
  activeUsers: number
  metadata: {
    tier: string
    fetchedAt: string
    cacheExpiry: number
  }
}

interface SecondaryData {
  totalActivities: number
  todayActivities: number
  analytics: Array<{
    id: string
    metric_name: string
    metric_value: number
    metric_date: string
  }>
  metadata: {
    tier: string
    fetchedAt: string
    cacheExpiry: number
  }
}

interface DetailedData {
  recentActivities: Array<{
    id: string
    description: string
    created_at: string
    profiles?: {
      email: string
      full_name: string
    }
  }>
  metadata: {
    tier: string
    fetchedAt: string
    cacheExpiry: number
  }
}

interface ProgressiveDashboardDataState {
  criticalData: CriticalData | null
  secondaryData: SecondaryData | null
  detailedData: DetailedData | null
  isLoading: {
    critical: boolean
    secondary: boolean
    detailed: boolean
  }
  isError: {
    critical: boolean
    secondary: boolean
    detailed: boolean
  }
  errors: {
    critical: unknown
    secondary: unknown
    detailed: unknown
  }
  refetch: {
    critical: () => void
    secondary: () => void
    detailed: () => void
    all: () => void
    comprehensive: () => void
  }
  cacheStatus: {
    critical: { hit: boolean; loading: boolean }
    secondary: { hit: boolean; loading: boolean }
    detailed: { hit: boolean; loading: boolean }
  }
  comprehensiveData?: {
    critical: CriticalData
    secondary: SecondaryData
    detailed: DetailedData
    stats: any
    analytics: any[]
    recentActivities: any[]
    metadata: any
  }
}

export function useProgressiveDashboardData(): ProgressiveDashboardDataState {
  const [cacheStatus, setCacheStatus] = useState({
    critical: { hit: false, loading: false },
    secondary: { hit: false, loading: false },
    detailed: { hit: false, loading: false }
  })

  // Create TTL calculation context
  const getTTLContext = useCallback((dataType: string) => ({
    dataType,
    timeOfDay: new Date(),
    dayOfWeek: new Date().getDay(),
    systemLoad: 'medium' as const,
    userProfile: {
      isActive: true,
      lastActivity: new Date(),
      role: 'admin'
    }
  }), [])

  // Cache-aware data fetcher for critical data
  const fetchCriticalData = useCallback(async () => {
    const cacheKey = 'critical-dashboard-data'
    const namespace = 'dashboard'
    
    setCacheStatus(prev => ({ ...prev, critical: { ...prev.critical, loading: true } }))
    
    try {
      // Try to get from cache first
      const cachedData = await smartCacheManager.get<CriticalData>(cacheKey, namespace)
      if (cachedData) {
        setCacheStatus(prev => ({ ...prev, critical: { hit: true, loading: false } }))
        return cachedData
      }

      // Fetch from API if not in cache
      const response = await fetch('/api/trpc/admin.getCriticalDashboardData', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch critical data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data?.result?.data) {
        throw new Error('Invalid response structure for critical data')
      }

      // Store in cache with adaptive TTL
      await smartCacheManager.set(cacheKey, data.result.data, {
        namespace,
        dataType: 'critical-dashboard-data',
        context: getTTLContext('critical-dashboard-data'),
        metadata: { tier: 'critical' }
      })

      setCacheStatus(prev => ({ ...prev, critical: { hit: false, loading: false } }))
      return data.result.data
    } catch (error) {
      setCacheStatus(prev => ({ ...prev, critical: { hit: false, loading: false } }))
      throw error
    }
  }, [getTTLContext])

  // Cache-aware data fetcher for secondary data
  const fetchSecondaryData = useCallback(async () => {
    const cacheKey = 'secondary-dashboard-data'
    const namespace = 'dashboard'
    
    setCacheStatus(prev => ({ ...prev, secondary: { ...prev.secondary, loading: true } }))
    
    try {
      // Try to get from cache first
      const cachedData = await smartCacheManager.get<SecondaryData>(cacheKey, namespace)
      if (cachedData) {
        setCacheStatus(prev => ({ ...prev, secondary: { hit: true, loading: false } }))
        return cachedData
      }

      // Fetch from API if not in cache
      const response = await fetch('/api/trpc/admin.getSecondaryDashboardData?input=%7B%22analyticsDays%22%3A7%7D', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch secondary data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data?.result?.data) {
        throw new Error('Invalid response structure for secondary data')
      }

      // Store in cache with adaptive TTL
      await smartCacheManager.set(cacheKey, data.result.data, {
        namespace,
        dataType: 'secondary-dashboard-data',
        context: getTTLContext('secondary-dashboard-data'),
        metadata: { tier: 'secondary' }
      })

      setCacheStatus(prev => ({ ...prev, secondary: { hit: false, loading: false } }))
      return data.result.data
    } catch (error) {
      setCacheStatus(prev => ({ ...prev, secondary: { hit: false, loading: false } }))
      throw error
    }
  }, [getTTLContext])

  // Cache-aware data fetcher for detailed data
  const fetchDetailedData = useCallback(async () => {
    const cacheKey = 'detailed-dashboard-data'
    const namespace = 'dashboard'

    setCacheStatus(prev => ({ ...prev, detailed: { ...prev.detailed, loading: true } }))

    try {
      // Try to get from cache first
      const cachedData = await smartCacheManager.get<DetailedData>(cacheKey, namespace)
      if (cachedData) {
        setCacheStatus(prev => ({ ...prev, detailed: { hit: true, loading: false } }))
        return cachedData
      }

      // Fetch from API if not in cache
      const response = await fetch('/api/trpc/admin.getDetailedDashboardData', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch detailed data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data?.result?.data) {
        throw new Error('Invalid response structure for detailed data')
      }

      // Store in cache with adaptive TTL
      await smartCacheManager.set(cacheKey, data.result.data, {
        namespace,
        dataType: 'detailed-dashboard-data',
        context: getTTLContext('detailed-dashboard-data'),
        metadata: { tier: 'detailed' }
      })

      setCacheStatus(prev => ({ ...prev, detailed: { hit: false, loading: false } }))
      return data.result.data
    } catch (error) {
      setCacheStatus(prev => ({ ...prev, detailed: { hit: false, loading: false } }))
      throw error
    }
  }, [getTTLContext])

  // Set up background refresh for cached data
  useEffect(() => {
    const setupBackgroundRefresh = () => {
      // Register background refresh tasks
      backgroundRefresher.registerRefreshTask({
        key: 'dashboard:critical-dashboard-data',
        namespace: 'dashboard',
        dataType: 'critical-dashboard-data',
        priority: 'critical',
        refreshFunction: fetchCriticalData,
        maxRetries: 3,
        backoffMultiplier: 2,
        context: getTTLContext('critical-dashboard-data')
      })

      backgroundRefresher.registerRefreshTask({
        key: 'dashboard:secondary-dashboard-data',
        namespace: 'dashboard',
        dataType: 'secondary-dashboard-data',
        priority: 'important',
        refreshFunction: fetchSecondaryData,
        maxRetries: 3,
        backoffMultiplier: 2,
        context: getTTLContext('secondary-dashboard-data')
      })

      backgroundRefresher.registerRefreshTask({
        key: 'dashboard:detailed-dashboard-data',
        namespace: 'dashboard',
        dataType: 'detailed-dashboard-data',
        priority: 'normal',
        refreshFunction: () => fetchDetailedData(),
        maxRetries: 3,
        backoffMultiplier: 2,
        context: getTTLContext('detailed-dashboard-data')
      })
    }

    setupBackgroundRefresh()

    return () => {
      // Cleanup background refresh tasks on unmount
      backgroundRefresher.unregisterRefreshTask('dashboard:critical-dashboard-data')
      backgroundRefresher.unregisterRefreshTask('dashboard:secondary-dashboard-data')
      backgroundRefresher.unregisterRefreshTask('dashboard:detailed-dashboard-data')
    }
  }, [fetchCriticalData, fetchSecondaryData, fetchDetailedData, getTTLContext])

  // Set up cache invalidation listeners
  useEffect(() => {
    const handleInvalidation = (event: { key?: string; namespace?: string }) => {
      if (event.key?.includes('dashboard') || event.namespace === 'dashboard') {
        // Invalidate relevant cache entries
        if (event.key?.includes('critical')) {
          smartCacheManager.delete('critical-dashboard-data', 'dashboard')
        } else if (event.key?.includes('secondary')) {
          smartCacheManager.delete('secondary-dashboard-data', 'dashboard')
        } else if (event.key?.includes('detailed')) {
          smartCacheManager.delete('detailed-dashboard-data', 'dashboard')
        } else {
          // Invalidate all dashboard data
          smartCacheManager.invalidateNamespace('dashboard')
        }
      }
    }

    cacheInvalidation.addEventListener('user-action', handleInvalidation)
    cacheInvalidation.addEventListener('data-change', handleInvalidation)
    cacheInvalidation.addEventListener('cross-tab', handleInvalidation)

    return () => {
      cacheInvalidation.removeEventListener('user-action', handleInvalidation)
      cacheInvalidation.removeEventListener('data-change', handleInvalidation)
      cacheInvalidation.removeEventListener('cross-tab', handleInvalidation)
    }
  }, [])

  // Use the new comprehensive endpoint for optimal performance
  const comprehensiveQuery = trpc.admin.dashboard.getComprehensiveDashboardData.useQuery(
    { analyticsDays: 7, activitiesLimit: 10 },
    {
      staleTime: 15 * 1000, // 15 seconds
      refetchOnWindowFocus: false,
      queryFn: async () => {
        // Use the comprehensive endpoint that fetches all data in one call
        const response = await fetch('/api/trpc/admin.getComprehensiveDashboardData?input=%7B%22analyticsDays%22%3A7%2C%22activitiesLimit%22%3A10%7D', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch comprehensive dashboard data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data?.result?.data) {
          throw new Error('Invalid response structure for comprehensive dashboard data')
        }

        // Store in cache with adaptive TTL
        await smartCacheManager.set('comprehensive-dashboard-data', data.result.data, {
          namespace: 'dashboard',
          dataType: 'comprehensive-dashboard-data',
          context: getTTLContext('comprehensive-dashboard-data'),
          metadata: { consolidated: true }
        })

        setCacheStatus(prev => ({ ...prev, critical: { hit: false, loading: false } }))
        return data.result.data
      },
    }
  )

  // Fallback queries for progressive loading if comprehensive query fails
  const criticalQuery = trpc.admin.dashboard.getCriticalDashboardData.useQuery(undefined, {
    staleTime: 15 * 1000, // 15 seconds
    refetchOnWindowFocus: false,
    enabled: !comprehensiveQuery.data, // Only run if comprehensive query hasn't returned data
    queryFn: fetchCriticalData,
  })

  const secondaryQuery = trpc.admin.dashboard.getSecondaryDashboardData.useQuery(
    { analyticsDays: 7 },
    {
      enabled: !!comprehensiveQuery.data || !!criticalQuery.data,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      queryFn: fetchSecondaryData,
    }
  )

  const detailedQuery = trpc.admin.dashboard.getDetailedDashboardData.useQuery(undefined, {
    enabled: !!comprehensiveQuery.data || !!secondaryQuery.data,
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: false,
    queryFn: fetchDetailedData,
  })

  // Enhanced refetch functions with cache invalidation
  const refetchCritical = useCallback(() => {
    smartCacheManager.delete('critical-dashboard-data', 'dashboard')
    criticalQuery.refetch()
  }, [criticalQuery])

  const refetchSecondary = useCallback(() => {
    if (comprehensiveQuery.data || criticalQuery.data) {
      smartCacheManager.delete('secondary-dashboard-data', 'dashboard')
      secondaryQuery.refetch()
    }
  }, [comprehensiveQuery.data, criticalQuery.data, secondaryQuery])

  const refetchDetailed = useCallback(() => {
    if (comprehensiveQuery.data || secondaryQuery.data) {
      smartCacheManager.delete('detailed-dashboard-data', 'dashboard')
      detailedQuery.refetch()
    }
  }, [comprehensiveQuery.data, secondaryQuery.data, detailedQuery])

  const refetchComprehensive = useCallback(() => {
    smartCacheManager.delete('comprehensive-dashboard-data', 'dashboard')
    comprehensiveQuery.refetch()
  }, [comprehensiveQuery])

  const refetchAll = useCallback(() => {
    smartCacheManager.invalidateNamespace('dashboard')
    refetchComprehensive()
    refetchCritical()
  }, [refetchCritical, refetchComprehensive])

  // Memoize the state to prevent unnecessary re-renders
  const state = useMemo(() => ({
    criticalData: comprehensiveQuery.data?.critical || criticalQuery.data || null,
    secondaryData: comprehensiveQuery.data?.secondary || secondaryQuery.data || null,
    detailedData: comprehensiveQuery.data?.detailed || detailedQuery.data || null,
    isLoading: {
      critical: comprehensiveQuery.isLoading || criticalQuery.isLoading || cacheStatus.critical.loading,
      secondary: comprehensiveQuery.isLoading || secondaryQuery.isLoading || cacheStatus.secondary.loading,
      detailed: comprehensiveQuery.isLoading || detailedQuery.isLoading || cacheStatus.detailed.loading,
    },
    isError: {
      critical: comprehensiveQuery.isError && criticalQuery.isError,
      secondary: comprehensiveQuery.isError && secondaryQuery.isError,
      detailed: comprehensiveQuery.isError && detailedQuery.isError,
    },
    errors: {
      critical: comprehensiveQuery.error || criticalQuery.error,
      secondary: comprehensiveQuery.error || secondaryQuery.error,
      detailed: comprehensiveQuery.error || detailedQuery.error,
    },
    refetch: {
      critical: refetchCritical,
      secondary: refetchSecondary,
      detailed: refetchDetailed,
      all: refetchAll,
      comprehensive: comprehensiveQuery.refetch,
    },
    cacheStatus,
    // Include comprehensive data for components that can use it
    comprehensiveData: comprehensiveQuery.data,
  }), [
    comprehensiveQuery.data,
    comprehensiveQuery.isLoading,
    comprehensiveQuery.isError,
    comprehensiveQuery.error,
    comprehensiveQuery.refetch,
    criticalQuery.data,
    criticalQuery.isLoading,
    criticalQuery.isError,
    criticalQuery.error,
    secondaryQuery.data,
    secondaryQuery.isLoading,
    secondaryQuery.isError,
    secondaryQuery.error,
    detailedQuery.data,
    detailedQuery.isLoading,
    detailedQuery.isError,
    detailedQuery.error,
    refetchCritical,
    refetchSecondary,
    refetchDetailed,
    refetchAll,
    cacheStatus,
  ])

  return state
}
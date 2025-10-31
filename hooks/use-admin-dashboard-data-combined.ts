'use client'

import { trpc } from '@/lib/trpc/client'
import { useMemo } from 'react'
import type { DashboardData } from '@/types'

interface AdminDashboardDataState {
  data: DashboardData | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
}

export function useAdminDashboardDataCombined(
  analyticsDays: number = 7,
  activitiesLimit: number = 10
): AdminDashboardDataState {
  // Use the new combined endpoint
  const dashboardQuery = trpc.admin.dashboard.getDashboardData.useQuery(
    { 
      analyticsDays, 
      activitiesLimit 
    },
    {
      staleTime: 30 * 1000, // 30 seconds cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  )

  // Transform the data to match the existing interface for backward compatibility
  const data: DashboardData | null = useMemo(() => {
    if (!dashboardQuery.data) return null
    
    return dashboardQuery.data
  }, [dashboardQuery.data])

  return {
    data,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    isFetching: dashboardQuery.isFetching,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  }
}
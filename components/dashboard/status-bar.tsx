// ============================================
// components/dashboard/status-bar.tsx
// ============================================

'use client'

import { useProgressiveDashboardData } from '@/hooks/use-progressive-dashboard-data'
import {
  CompactCacheStatusIndicator,
  CompactDataAccuracyBadge,
  CompactLastUpdated
} from '@/components/dashboard/cache-indicators'

export function StatusBar() {
  const { criticalData } = useProgressiveDashboardData()

  // Get the most recent timestamp from available data
  const lastUpdated = criticalData?.metadata?.fetchedAt
    ? new Date(criticalData.metadata.fetchedAt).getTime()
    : 0

  const ttl = criticalData?.metadata?.cacheExpiry || 15000

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 bg-muted/50 border-t">
      <div className="flex items-center gap-2">
        <CompactCacheStatusIndicator namespace="dashboard" />
        <CompactDataAccuracyBadge
          lastUpdated={lastUpdated}
          ttl={ttl}
        />
        <CompactLastUpdated lastUpdated={lastUpdated} />
      </div>
    </div>
  )
}
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardSkeletonProps {
  showIcon?: boolean
  title?: string
  description?: string
  delay?: number
}

export function MetricCardSkeleton({
  showIcon = true,
  title = "Metric Title",
  description = "Metric description",
  delay = 0
}: MetricCardSkeletonProps) {
  return (
    <Card
      data-testid="metric-card-skeleton"
      className={`group shadow-lg bg-muted/30 transition-all duration-300 ease-in-out border-2 border-transparent group-hover:border-border/50 ${delay > 0 ? `animate-fade-in` : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <Skeleton
            className="h-4 w-20 animate-pulse"
          />
          {showIcon && (
            <div className="relative">
              <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted to-transparent opacity-30 animate-shimmer" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="relative">
            <Skeleton className="h-8 w-16 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted to-transparent opacity-20 animate-shimmer animation-delay-100" />
          </div>
          <div className="relative">
            <Skeleton className="h-3 w-24 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted to-transparent opacity-15 animate-shimmer animation-delay-150" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Grid of metric card skeletons for progressive loading
export function MetricCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton
          key={i}
          delay={i * 100} // Stagger the loading animation
        />
      ))}
    </div>
  )
}

// Enhanced skeleton with different loading states
export function ProgressiveMetricCardSkeleton() {
  return (
    <Card className="border-2 border-blue-200/50 bg-blue-50/50 shadow-lg">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 animate-pulse bg-blue-200" />
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-blue-200 animate-pulse flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-40 animate-shimmer" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="relative">
            <div className="h-8 w-16 bg-blue-200 rounded animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-30 animate-shimmer" />
          </div>
          <div className="relative">
            <div className="h-3 w-24 bg-blue-200 rounded animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-20 animate-shimmer animation-delay-100" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
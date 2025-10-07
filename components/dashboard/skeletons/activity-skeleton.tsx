'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ActivitySkeleton() {
  return (
    <Card data-testid="activity-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2 rounded-lg">
              {/* Activity icon */}
              <Skeleton className="h-4 w-4 rounded" />
              
              {/* Activity content */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
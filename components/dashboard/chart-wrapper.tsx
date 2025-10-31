'use client'

import { useState, useEffect, Suspense } from 'react'
import { ChartSkeleton } from './skeletons'

interface ChartWrapperProps {
  children?: React.ReactNode
  fallback?: React.ReactNode
}

export function ChartWrapper({ children, fallback }: ChartWrapperProps) {
  const [ChartComponent, setChartComponent] = useState<React.ComponentType<{ children?: React.ReactNode }> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Dynamic import for recharts components
    const loadChart = async () => {
      try {
        const { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } = await import('recharts')

        const ChartComp = ({ children: chartChildren }: { children?: React.ReactNode }) => (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="value" fill="#8884d8" />
              {chartChildren}
            </BarChart>
          </ResponsiveContainer>
        )

        setChartComponent(() => ChartComp)
      } catch (error) {
        console.error('Failed to load chart components:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChart()
  }, [])

  if (isLoading) {
    return fallback || <ChartSkeleton />
  }

  if (!ChartComponent) {
    return <div>Failed to load chart</div>
  }

  return (
    <Suspense fallback={fallback || <ChartSkeleton />}>
      <ChartComponent>
        {children}
      </ChartComponent>
    </Suspense>
  )
}
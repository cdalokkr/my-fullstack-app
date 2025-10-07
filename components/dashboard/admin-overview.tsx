'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProgressiveDashboardData } from '@/hooks/use-progressive-dashboard-data'
import { ChartSkeleton, ActivitySkeleton } from '@/components/dashboard/skeletons'
import {
  Users,
  Activity,
  TrendingUp,
  UserPlus,
  Settings,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  loading?: boolean
}

function MetricCard({ title, value, description, icon, loading }: MetricCardProps) {
  return (
    <Card className="transition-all duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

interface SectionWrapperProps {
  children: React.ReactNode
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  title: string
  className?: string
}

function SectionWrapper({ 
  children, 
  isLoading, 
  isError, 
  error, 
  onRetry, 
  title, 
  className = "" 
}: SectionWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isLoading && !isError) {
      // Trigger fade-in animation when content is ready
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isLoading, isError])

  if (isError) {
    return (
      <div data-testid="error-boundary" className={`space-y-4 ${className}`}>
        <Alert variant="destructive" data-testid="error-alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load {title}. {error instanceof Error ? error.message : 'Please try again.'}
          </AlertDescription>
        </Alert>
        <Button data-testid="retry-button" onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div
      data-testid="section-wrapper"
      className={`transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function AdminOverview({ onLoadingChange }: { onLoadingChange: (loading: boolean) => void }) {
  const {
    criticalData,
    secondaryData,
    detailedData,
    isLoading,
    isError,
    errors,
    refetch
  } = useProgressiveDashboardData()

  // Track overall loading state for parent component
  const isAnyLoading = isLoading.critical || isLoading.secondary || isLoading.detailed

  useEffect(() => {
    onLoadingChange(isAnyLoading)
  }, [isAnyLoading, onLoadingChange])

  // Calculate active users from analytics data when available
  const activeUsers = secondaryData?.analytics?.reduce((acc, metric) => {
    if (metric.metric_name === 'active_users') {
      return acc + metric.metric_value
    }
    return acc
  }, 0) || criticalData?.activeUsers || 0

  // Overall error state
  if (isError.critical && !criticalData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load critical dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button onClick={refetch.critical} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Overview of your application metrics and activities</p>
        </div>
        <Button
          data-testid="refresh-all-button"
          onClick={refetch.all}
          variant="outline"
          disabled={isAnyLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>


      {/* Tier 1: Critical Metrics - Always visible first */}
      <SectionWrapper
        isLoading={isLoading.critical}
        isError={isError.critical}
        error={errors.critical}
        onRetry={refetch.critical}
        title="critical metrics"
      >
        <div data-testid="critical-metrics" className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={criticalData?.totalUsers || 0}
            description="Registered users"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.critical}
          />
          <MetricCard
            title="Active Users"
            value={activeUsers}
            description="Active in last 7 days"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.critical}
          />
          <MetricCard
            title="Total Activities"
            value={secondaryData?.totalActivities || 0}
            description="All user activities"
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.secondary}
          />
          <MetricCard
            title="Today's Activities"
            value={secondaryData?.todayActivities || 0}
            description="Activities today"
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.secondary}
          />
        </div>
        
      </SectionWrapper>

      {/* Quick Actions - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tier 2: Analytics Chart - Load after critical data */}
      {criticalData && (
        <SectionWrapper
          isLoading={isLoading.secondary}
          isError={isError.secondary}
          error={errors.secondary}
          onRetry={refetch.secondary}
          title="analytics chart"
        >
          {isLoading.secondary ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>User activity over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={secondaryData?.analytics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="metric_date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="metric_value"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </SectionWrapper>
      )}

      {/* Tier 3: Recent Activities - Load after secondary data */}
      {secondaryData && (
        <SectionWrapper
          isLoading={isLoading.detailed}
          isError={isError.detailed}
          error={errors.detailed}
          onRetry={refetch.detailed}
          title="recent activities"
        >
          {isLoading.detailed ? (
            <ActivitySkeleton />
          ) : (
            <Card data-testid="detailed-content">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {detailedData?.recentActivities?.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </SectionWrapper>
      )}

    </div>
  )
}
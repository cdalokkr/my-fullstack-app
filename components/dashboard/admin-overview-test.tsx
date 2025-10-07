'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAdminDashboardDataCombined } from '@/hooks/use-admin-dashboard-data-combined'
import { Users, Activity, TrendingUp, UserPlus, Settings, BarChart3, RefreshCw, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  loading?: boolean
}

function MetricCard({ title, value, description, icon, loading }: MetricCardProps) {
  return (
    <Card>
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

export function AdminOverviewTest({ onLoadingChange }: { onLoadingChange: (loading: boolean) => void }) {
  const { data, isLoading, isError, isFetching, refetch } = useAdminDashboardDataCombined()

  useEffect(() => {
    onLoadingChange(isLoading)
  }, [isLoading, onLoadingChange])

  // Calculate active users (users with activities in last 7 days)
  const activeUsers = data?.analytics?.reduce((acc, metric) => {
    if (metric.metric_name === 'active_users') {
      return acc + metric.metric_value
    }
    return acc
  }, 0) || 0

  // Error handling
  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load admin dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Test Info Banner */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          🧪 Test Mode: Combined API Endpoint - Single call optimization. Check browser Network tab for API calls.
        </AlertDescription>
      </Alert>

      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard (Test)</h2>
          <p className="text-muted-foreground">Overview of your application metrics and activities</p>
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State Indicator */}
      {isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Loading data with combined endpoint... Check Network tab for single API call.
          </AlertDescription>
        </Alert>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data?.stats?.totalUsers || 0}
          description="Registered users"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <MetricCard
          title="Active Users"
          value={activeUsers}
          description="Active in last 7 days"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <MetricCard
          title="Total Activities"
          value={data?.stats?.totalActivities || 0}
          description="All user activities"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <MetricCard
          title="Today's Activities"
          value={data?.stats?.todayActivities || 0}
          description="Activities today"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Analytics Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>User activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.analytics || []}>
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
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest user activities</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data?.recentActivities?.map((activity) => (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
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
    </div>
  )
}
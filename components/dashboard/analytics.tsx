// ============================================
// components/dashboard/analytics.tsx
// ============================================
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc/client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'

export function Analytics() {
  const { data: analytics, isLoading } = trpc.admin.getAnalytics.useQuery({ days: 7 })

  const handleExport = () => {
    if (!analytics) return

    const csv = [
      ['Date', 'Metric', 'Value'].join(','),
      ...analytics.map((item) =>
        [item.metric_date, item.metric_name, item.metric_value].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Analytics exported successfully')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Transform data for charts
  const userGrowthData = analytics
    ?.filter((item) => item.metric_name === 'total_users')
    .map((item) => ({
      date: new Date(item.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: item.metric_value,
    }))

  const activityData = analytics
    ?.filter((item) => item.metric_name === 'active_sessions')
    .map((item) => ({
      date: new Date(item.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: item.metric_value,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View metrics and insights
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <FiDownload /> Export Data
        </Button>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Active Sessions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions" fill="#10b981" name="Active Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
      
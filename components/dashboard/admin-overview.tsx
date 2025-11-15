'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useComprehensiveRealtimeDashboard } from '@/hooks/use-realtime-dashboard-data'
import { ErrorBoundary, LoadingFallback } from '@/components/ui/error-boundary'
import { ModernAddUserForm } from './ModernAddUserForm'
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
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  loading?: boolean
  iconBgColor?: string
  iconColor?: string
  borderColor?: string
}

function MetricCardSkeleton({ title, description, icon, iconBgColor, iconColor, borderColor }: {
  title: string
  description: string
  icon: React.ReactNode
  iconBgColor?: string
  iconColor?: string
  borderColor?: string
}) {
  return (
    <Card
      className={`group shadow-lg bg-muted/30 border-2 ${borderColor || 'border-transparent'} transition-all duration-300`}
      role="region"
      aria-label={`${title} metric card loading`}
    >
      <CardHeader className="pb-0 pt-0">
        <CardTitle className="text-xl font-medium m-0">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${iconBgColor || 'bg-gray-100'} group-hover:bg-opacity-80 transition-all duration-300`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<React.SVGProps<SVGSVGElement>>, {
              className: `h-8 w-8 ${iconColor || 'text-muted-foreground'} animate-pulse`,
              'aria-hidden': true
            }) : (
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
            )}
          </div>
          <div className="text-2xl font-bold">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-gradient-to-r from-transparent via-current to-transparent rounded-full animate-pulse"></span>
              <span className="inline-block w-2 h-3 bg-gradient-to-b from-transparent via-current to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
              <span className="inline-block w-3 h-3 bg-gradient-to-r from-transparent via-current to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            </span>
          </div>
        </div>
        <p className="text-sm mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function MetricCard({ title, value, description, icon, loading, iconBgColor, iconColor, borderColor }: MetricCardProps) {
  const iconBgHover = iconBgColor?.replace('-100', '-200') || 'bg-gray-200'
  const iconColorHover = iconColor?.replace('-600', '-700') || 'text-muted-foreground'
  const borderHoverColor = borderColor?.replace('-200', '-300') || 'border-transparent'
  
  const [isHovered, setIsHovered] = useState(false)

  if (loading) {
    return (
      <MetricCardSkeleton
        title={title}
        description={description}
        icon={icon}
        iconBgColor={iconBgColor}
        iconColor={iconColor}
        borderColor={borderColor}
      />
    )
  }

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`group shadow-lg bg-muted/30 border-2 ${borderColor || 'border-transparent'} hover:shadow-2xl transition-all duration-300 ${isHovered ? `${borderHoverColor} shadow-[0_0_20px_rgba(0,0,0,0.1)]` : ''}`}
        role="region"
        aria-label={`${title} metric card showing ${value} ${description}`}
        tabIndex={0}
      >
        <CardHeader className="pb-0 pt-0">
          <CardTitle className="text-xl font-medium m-0">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <motion.div
              className={`p-1.5 rounded-full ${iconBgColor || 'bg-gray-100'} transition-all duration-300`}
              animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<React.SVGProps<SVGSVGElement>>, {
                className: `h-8 w-8 ${isHovered ? iconColorHover : (iconColor || 'text-muted-foreground')} transition-all duration-300`,
                'aria-hidden': true
              }) : icon}
            </motion.div>
            <div className="text-2xl font-bold transition-all duration-500 ease-in-out" aria-live="polite">
              {value}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AdminOverview({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) {
  const [showAddUserSheet, setShowAddUserSheet] = useState(false)

  const {
    stats,
    recentActivities,
    analytics,
    activeUsers,
    isLoading,
    isError,
    error,
    refetch,
    magicCardsDataReady,
    recentActivityDataReady
  } = useComprehensiveRealtimeDashboard()

  // Track overall loading state for parent component
  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  // Overall error state
  if (isError && !stats.totalUsers && !stats.totalActivities && !stats.todayActivities) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
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
    <div className="space-y-4 gesture-friendly">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground text-sm">Overview of your application metrics and activities</p>
        </div>
        {/* Refresh button removed - data now refreshes automatically */}
      </div>

      {/* Critical Metrics - Always visible first */}
      <div data-testid="critical-metrics" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users/all" className="block">
          <MetricCard
            title="Total Users"
            value={magicCardsDataReady ? stats.totalUsers : 0}
            description="Registered users"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            loading={!magicCardsDataReady}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            borderColor="border-blue-200"
          />
        </Link>
        <MetricCard
          title="Active Users"
          value={magicCardsDataReady ? activeUsers : 0}
          description="Active in last 7 days"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          loading={!magicCardsDataReady}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          borderColor="border-green-200"
        />
        <MetricCard
          title="Total Activities"
          value={magicCardsDataReady ? stats.totalActivities : 0}
          description="All user activities"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          loading={!magicCardsDataReady}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          borderColor="border-purple-200"
        />
        <MetricCard
          title="Today's Activity"
          value={magicCardsDataReady ? stats.todayActivities : 0}
          description="Activities today"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          loading={!magicCardsDataReady}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          borderColor="border-orange-200"
        />
      </div>

      {/* Quick Actions - Always visible */}
      <Card className="shadow-lg bg-muted/30">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="touch"
                className="group relative overflow-hidden bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                onClick={() => setShowAddUserSheet(true)}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <motion.span
                  className="inline-flex items-center justify-center p-1 rounded-full bg-blue-100 mr-2 transition-colors duration-300 group-hover:bg-blue-200"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <UserPlus className="h-4 w-4 text-blue-600 transition-colors duration-300 group-hover:text-blue-700" />
                </motion.span>
                Add User
              </Button>
            </motion.div>
            <Link href="/admin/users/all">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="touch"
                  className="group relative overflow-hidden bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <motion.span
                    className="inline-flex items-center justify-center p-1 rounded-full bg-blue-100 mr-2 transition-colors duration-300 group-hover:bg-blue-200"
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Users className="h-4 w-4 text-blue-600 transition-colors duration-300 group-hover:text-blue-700" />
                  </motion.span>
                  Manage Users
                </Button>
              </motion.div>
            </Link>
            <Link href="/admin">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="touch"
                  className="group relative overflow-hidden bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-700 border-orange-200 hover:border-orange-300 active:border-orange-400 hover:shadow-lg transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/20 to-orange-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <motion.span
                    className="inline-flex items-center justify-center p-1 rounded-full bg-orange-100 mr-2 transition-colors duration-300 group-hover:bg-orange-200"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <BarChart3 className="h-4 w-4 text-orange-600 transition-colors duration-300 group-hover:text-orange-700" />
                  </motion.span>
                  View Reports
                </Button>
              </motion.div>
            </Link>
            <Link href="/admin/settings">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="touch"
                  className="group relative overflow-hidden bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border-purple-200 hover:border-purple-300 active:border-purple-400 hover:shadow-lg transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <motion.span
                    className="inline-flex items-center justify-center p-1 rounded-full bg-purple-100 mr-2 transition-colors duration-300 group-hover:bg-purple-200"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Settings className="h-4 w-4 text-purple-600 transition-colors duration-300 group-hover:text-purple-700" />
                  </motion.span>
                  System Settings
                </Button>
              </motion.div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities - Layout visible immediately, data loads after */}
      <div data-testid="detailed-content">
        <Card className="shadow-lg bg-muted/30">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest user activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivityDataReady && recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities
                  ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  ?.slice(0, 10)
                  ?.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 transition-all duration-300">
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
            ) : (
              // Loading skeleton for recent activities
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 animate-pulse">
                    <div className="h-4 w-4 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modern Add User Form with Built-in Sheet */}
      <ModernAddUserForm
        open={showAddUserSheet}
        onOpenChange={setShowAddUserSheet}
        useSheet={true}
        onSuccess={() => {
          // Real-time dashboard will automatically refresh via event listeners
          refetch()
        }}
        title="Add New User"
        description="Create a new user account with proper access permissions"
        refetch={refetch}
      />

    </div>
  )
}
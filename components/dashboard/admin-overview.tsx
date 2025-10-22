'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProgressiveDashboardData } from '@/hooks/use-progressive-dashboard-data'
import { ActivitySkeleton } from '@/components/dashboard/skeletons'
import { CreateUserForm } from './create-user-form'
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

function MetricCard({ title, value, description, icon, loading, iconBgColor, iconColor, borderColor }: MetricCardProps) {
  const iconBgHover = iconBgColor?.replace('-100', '-200') || 'bg-gray-200'
  const iconColorHover = iconColor?.replace('-600', '-700') || 'text-muted-foreground'
  const borderHoverColor = borderColor?.replace('-200', '-300') || 'border-transparent'
  
    const [isHovered, setIsHovered] = useState(false)
  
    return (
    <Card className={`group shadow-lg bg-muted/30 transition-all duration-300 ease-in-out border-2 ${borderColor || 'border-transparent'} group-hover:${borderHoverColor}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <CardHeader className=" pb-0">
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="flex items-center gap-4 mb-2">
            <div className={`p-2 rounded-full ${iconBgColor || 'bg-gray-100'} transition-all duration-300 group-hover:${iconBgHover}`}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<React.SVGProps<SVGSVGElement>>, { className: `h-10 w-10 ${isHovered ? iconColorHover : (iconColor || 'text-muted-foreground')} transition-colors duration-300` }) : icon}
            </div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

interface SectionWrapperProps {
  children: React.ReactNode
  isError: boolean
  error: unknown
  onRetry: () => void
  title: string
  className?: string
}

function SectionWrapper({
  children,
  isError,
  error,
  onRetry,
  title,
  className = ""
}: SectionWrapperProps) {
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
      className={className}
    >
      {children}
    </div>
  )
}

export function AdminOverview({ onLoadingChange }: { onLoadingChange: (loading: boolean) => void }) {
   const [showCreateUserForm, setShowCreateUserForm] = useState(false)

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

  if (showCreateUserForm) {
    return (
      <CreateUserForm
        mode="inline"
        onCancel={() => setShowCreateUserForm(false)}
        onSuccess={() => {
          refetch.all()
        }}
      />
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
        isError={isError.critical}
        error={errors.critical}
        onRetry={refetch.critical}
        title="critical metrics"
      >
        <div data-testid="critical-metrics" className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users/all" className="block">
            <MetricCard
              title="Total Users"
              value={criticalData?.totalUsers || 0}
              description="Registered users"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              loading={isLoading.critical}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              borderColor="border-blue-200"
            />
          </Link>
          <MetricCard
            title="Active Users"
            value={activeUsers}
            description="Active in last 7 days"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.critical}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            borderColor="border-green-200"
          />
          <MetricCard
            title="Total Activities"
            value={secondaryData?.totalActivities || 0}
            description="All user activities"
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.secondary}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            borderColor="border-purple-200"
          />
          <MetricCard
            title="Today's Activities"
            value={secondaryData?.todayActivities || 0}
            description="Activities today"
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.secondary}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            borderColor="border-orange-200"
          />
        </div>
        
      </SectionWrapper>

      {/* Quick Actions - Always visible */}
      <Card className="shadow-lg bg-muted/30">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="group bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 "
              onClick={() => setShowCreateUserForm(true)}
            >
              <span className="inline-flex items-center justify-center p-1 rounded-full bg-blue-100 mr-2 transition-colors duration-300 group-hover:bg-blue-200">
                <UserPlus className="h-4 w-4 text-blue-600 transition-colors duration-300 group-hover:text-blue-700" />
              </span>
              Add User
            </Button>
            <Link href="/admin/users/all">
              <Button variant="outline" className="group bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 ">
                <span className="inline-flex items-center justify-center p-1 rounded-full bg-blue-100 mr-2 transition-colors duration-300 group-hover:bg-blue-200">
                  <Users className="h-4 w-4 text-blue-600 transition-colors duration-300 group-hover:text-blue-700" />
                </span>
                Manage Users
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" className="group bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-700 border-orange-200 hover:border-orange-300 active:border-orange-400 ">
                <span className="inline-flex items-center justify-center p-1 rounded-full bg-orange-100 mr-2 transition-colors duration-300 group-hover:bg-orange-200">
                  <BarChart3 className="h-4 w-4 text-orange-600 transition-colors duration-300 group-hover:text-orange-700" />
                </span>
                View Reports
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="group bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border-purple-200 hover:border-purple-300 active:border-purple-400 ">
                <span className="inline-flex items-center justify-center p-1 rounded-full bg-purple-100 mr-2 transition-colors duration-300 group-hover:bg-purple-200">
                  <Settings className="h-4 w-4 text-purple-600 transition-colors duration-300 group-hover:text-purple-700" />
                </span>
                System Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>


      {/* Tier 3: Recent Activities - Load after secondary data */}
      {secondaryData && (
        <SectionWrapper
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
                  {detailedData?.recentActivities
                    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    ?.slice(0, 10)
                    ?.map((activity) => (
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
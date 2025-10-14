'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProgressiveDashboardData } from '@/hooks/use-progressive-dashboard-data'
import { ChartSkeleton, ActivitySkeleton } from '@/components/dashboard/skeletons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/auth'
import { AsyncButton } from '@/components/ui/async-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'
import {
  Users,
  Activity,
  TrendingUp,
  UserPlus,
  Settings,
  BarChart3,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  loading?: boolean
  iconBgColor?: string
  iconColor?: string
}

function MetricCard({ title, value, description, icon, loading, iconBgColor, iconColor }: MetricCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${iconBgColor || 'bg-gray-100'}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<React.SVGProps<SVGSVGElement>>, { className: `h-8 w-8 ${iconColor || 'text-muted-foreground'}` }) : icon}
        </div>
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
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors: formErrors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'user',
    },
  })

  const utils = trpc.useUtils()

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success('User created successfully!')
      reset()
      refetch.all()
      // Invalidate and refetch user-related queries
      utils.admin.getUsers.invalidate()
      utils.admin.getCriticalDashboardData.invalidate()
      // Delay closing the form to match AsyncButton's successDuration
      setTimeout(() => {
        setShowCreateUserForm(false)
      }, 2000)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    await createUserMutation.mutateAsync(data)
  }

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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Add a new user to the system. They will receive an email invitation to set up their account.
                </CardDescription>
              </div>
              <Button variant="destructive" onClick={() => setShowCreateUserForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Row 1: First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    {...register('firstName')}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    {...register('lastName')}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Date of Birth, Mobile Number, and Role */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                {/* Mobile Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input
                    id="mobileNo"
                    type="tel"
                    placeholder="+1234567890"
                    {...register('mobileNo')}
                  />
                  {formErrors.mobileNo && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.mobileNo.message}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={watch('role')}
                    onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.role.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Email and Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register('email')}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    {...register('password')}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formErrors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <AsyncButton
                onClick={async () => {
                  const isValid = await trigger()
                  if (!isValid) {
                    throw new Error('Please check your input')
                  }
                  const data = getValues()
                  await onSubmit(data)
                }}
                loadingText="Creating user..."
                successText="User created!"
                errorText="Failed to create user"
                successDuration={2000}
                className="w-full"
              >
                Create User
              </AsyncButton>
            </form>
          </CardContent>
        </Card>
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
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Active Users"
            value={activeUsers}
            description="Active in last 7 days"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.critical}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <MetricCard
            title="Total Activities"
            value={secondaryData?.totalActivities || 0}
            description="All user activities"
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.secondary}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <MetricCard
            title="Today's Activities"
            value={secondaryData?.todayActivities || 0}
            description="Activities today"
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            loading={isLoading.secondary}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateUserForm(true)}
            >
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
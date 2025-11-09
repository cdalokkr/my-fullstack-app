'use client'

import React, { useState } from 'react'
import { 
  AdminDashboardSkeleton, 
  UserDashboardSkeleton, 
  OverviewDashboardSkeleton,
  DetailedDashboardSkeleton,
  MobileDashboardSkeleton,
  MetricCardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  ActivitySkeleton,
  StatsSkeleton,
  NavigationSkeleton,
  SkeletonTransitionManager
} from '@/components/dashboard/skeletons'

export default function SkeletonSystemTest() {
  const [testType, setTestType] = useState<'admin' | 'user' | 'overview' | 'detailed' | 'mobile'>('admin')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [testStep, setTestStep] = useState(0)

  // Test progression
  const nextTest = () => {
    setTestStep((prev) => (prev + 1) % 6)
  }

  const resetTest = () => {
    setIsLoading(true)
    setError(null)
    setTestStep(0)
  }

  const simulateError = () => {
    setError(new Error('Simulated loading error'))
    setIsLoading(false)
  }

  const testComponents = [
    // Test 1: Basic skeletons
    <div key="basic" className="space-y-6">
      <h3 className="text-lg font-semibold">Basic Skeleton Components Test</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSkeleton title="Total Users" description="Registered users" />
        <MetricCardSkeleton title="Active Sessions" description="Current sessions" />
        <MetricCardSkeleton title="Page Views" description="Today" />
        <MetricCardSkeleton title="Revenue" description="This month" />
      </div>
    </div>,

    // Test 2: Table skeleton
    <div key="table" className="space-y-6">
      <h3 className="text-lg font-semibold">Table Skeleton Test</h3>
      <TableSkeleton rows={6} columns={4} showHeader={true} showPagination={true} />
    </div>,

    // Test 3: Chart and activity skeletons
    <div key="charts" className="space-y-6">
      <h3 className="text-lg font-semibold">Chart and Activity Skeletons Test</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ActivitySkeleton count={5} showHeader={true} />
      </div>
    </div>,

    // Test 4: Stats skeletons
    <div key="stats" className="space-y-6">
      <h3 className="text-lg font-semibold">Stats Skeletons Test</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsSkeleton type="progress" count={4} />
        <StatsSkeleton type="timeline" count={5} />
      </div>
    </div>,

    // Test 5: Navigation skeletons
    <div key="navigation" className="space-y-6">
      <h3 className="text-lg font-semibold">Navigation Skeletons Test</h3>
      <div className="space-y-4">
        <NavigationSkeleton variant="topbar" />
        <NavigationSkeleton variant="sidebar" itemCount={5} />
        <NavigationSkeleton variant="breadcrumbs" />
      </div>
    </div>,

    // Test 6: Complete dashboard skeleton
    <div key="dashboard" className="space-y-6">
      <h3 className="text-lg font-semibold">Complete Dashboard Skeleton Test</h3>
      {testType === 'admin' && <AdminDashboardSkeleton showNavigation={true} showSidebar={true} />}
      {testType === 'user' && <UserDashboardSkeleton showNavigation={true} />}
      {testType === 'overview' && <OverviewDashboardSkeleton />}
      {testType === 'detailed' && <DetailedDashboardSkeleton />}
      {testType === 'mobile' && <MobileDashboardSkeleton />}
    </div>
  ]

  const testTitles = [
    'Basic Skeletons',
    'Table Skeleton',
    'Charts & Activities',
    'Stats Components',
    'Navigation',
    'Dashboard Layouts'
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Test Controls */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Skeleton System Comprehensive Test</h1>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => setTestType('admin')}
              className={`px-4 py-2 rounded-md border ${
                testType === 'admin' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border'
              }`}
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => setTestType('user')}
              className={`px-4 py-2 rounded-md border ${
                testType === 'user' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border'
              }`}
            >
              User Dashboard
            </button>
            <button
              onClick={() => setTestType('overview')}
              className={`px-4 py-2 rounded-md border ${
                testType === 'overview' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border'
              }`}
            >
              Overview Dashboard
            </button>
            <button
              onClick={() => setTestType('detailed')}
              className={`px-4 py-2 rounded-md border ${
                testType === 'detailed' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border'
              }`}
            >
              Detailed Dashboard
            </button>
            <button
              onClick={() => setTestType('mobile')}
              className={`px-4 py-2 rounded-md border ${
                testType === 'mobile' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border'
              }`}
            >
              Mobile Dashboard
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={nextTest}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Next Test ({testTitles[testStep]})
            </button>
            <button
              onClick={resetTest}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Reset Test
            </button>
            <button
              onClick={() => setIsLoading(!isLoading)}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
            >
              Toggle Loading: {isLoading ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={simulateError}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Simulate Error
            </button>
          </div>

          {/* Test Progress */}
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Progress: {testStep + 1} of {testTitles.length} - {testTitles[testStep]}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((testStep + 1) / testTitles.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Test Content with Transition Manager */}
        <SkeletonTransitionManager
          isLoading={isLoading}
          isError={!!error}
          error={error}
          transitionConfig={{
            duration: 500,
            staggerDelay: 100
          }}
          fallback={
            <div className="text-center p-8 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="text-destructive font-medium mb-2">Error Loading Test</div>
              <div className="text-muted-foreground text-sm">
                {error?.message || 'An unexpected error occurred'}
              </div>
            </div>
          }
          loadingComponent={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <MetricCardSkeleton key={i} delay={i * 100} />
                ))}
              </div>
              <TableSkeleton rows={5} columns={4} />
            </div>
          }
        >
          <div className="bg-card border border-border rounded-lg p-6">
            {testComponents[testStep]}
          </div>
        </SkeletonTransitionManager>

        {/* Test Information */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Current Test Information</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Test Type: {testType}</div>
            <div>Loading State: {isLoading ? 'Loading' : 'Loaded'}</div>
            <div>Error State: {error ? 'Error' : 'No Error'}</div>
            <div>Test Step: {testStep + 1} / {testTitles.length}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Performance Features</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• Reduced motion support (prefers-reduced-motion)</div>
            <div>• Staggered animations with configurable delays</div>
            <div>• Hardware acceleration (transform-gpu)</div>
            <div>• Accessibility support (ARIA labels, screen readers)</div>
            <div>• Responsive design (mobile-first approach)</div>
            <div>• Error handling with retry mechanisms</div>
            <div>• Smooth transitions between states</div>
            <div>• Keyboard navigation support</div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { Suspense } from 'react'
import { ErrorBoundary, LoadingFallback, SkeletonFallback } from '@/components/ui/error-boundary'
import { AdminOverview } from '@/components/dashboard/admin-overview'
import { PageSkeleton } from '@/components/dashboard/skeletons'

// Streaming wrapper component for admin dashboard
export function AdminDashboardStreaming() {
  return (
    <ErrorBoundary level="page" onError={(error, errorInfo) => {
      console.error('Admin Dashboard Error:', error, errorInfo)
    }}>
      <div className="min-h-screen bg-background">
        <Suspense 
          fallback={
            <div className="container mx-auto p-6">
              <ErrorBoundary level="section">
                <SkeletonFallback type="dashboard" />
              </ErrorBoundary>
            </div>
          }
        >
          <AdminOverview />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

// Tier-based streaming components for progressive loading
export function CriticalDataStreaming() {
  return (
    <ErrorBoundary level="section">
      <Suspense 
        fallback={
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        }
      >
        <AdminOverview onLoadingChange={(loading) => {
          // Track critical data loading state
          console.log('Critical data loading:', loading)
        }} />
      </Suspense>
    </ErrorBoundary>
  )
}

export default AdminDashboardStreaming
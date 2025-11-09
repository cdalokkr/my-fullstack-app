'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AdminOverview } from '@/components/dashboard/admin-overview'

// Streaming wrapper component for admin dashboard
export function AdminDashboardStreaming() {
  return (
    <ErrorBoundary level="page" onError={(error, errorInfo) => {
      console.error('Admin Dashboard Error:', error, errorInfo)
    }}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <ErrorBoundary level="section">
            <AdminOverview />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}

// Tier-based streaming components for progressive loading
export function CriticalDataStreaming() {
  return (
    <ErrorBoundary level="section">
      <AdminOverview onLoadingChange={(loading) => {
        // Track critical data loading state
        console.log('Critical data loading:', loading)
      }} />
    </ErrorBoundary>
  )
}

export default AdminDashboardStreaming
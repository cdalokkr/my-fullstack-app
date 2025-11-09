'use client'

import React from 'react'

export default function AdminSkeletonTest() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard Test</h1>
          <p className="text-muted-foreground">Testing skeleton loading behavior</p>
        </div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
          <div className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
          <div className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
          <div className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="p-4">
            <div className="h-6 bg-muted rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          This test verifies that skeleton loading only appears in specific sections, 
          not covering the entire page content area.
        </div>
      </div>
    </div>
  )
}
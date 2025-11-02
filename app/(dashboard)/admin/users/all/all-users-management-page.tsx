'use client'

import { useState, useEffect } from 'react'
import UserManagement from '@/components/dashboard/user-management'
import { UserManagementErrorBoundary } from './user-management-error-boundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function AllUsersManagementPage() {
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Handle page refresh
  const handleRetry = () => {
    setHasError(false)
    setRetryCount(prev => prev + 1)
  }

  // Error state
  if (hasError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load user management interface. Please try again.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={handleRetry} 
          variant="outline" 
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Main component - no loading state, just render content
  return (
    <UserManagementErrorBoundary>
      <UserManagement />
    </UserManagementErrorBoundary>
  )
}
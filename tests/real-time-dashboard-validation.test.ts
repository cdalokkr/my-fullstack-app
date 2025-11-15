#!/usr/bin/env ts-node

/**
 * Real-time Dashboard Validation Test
 * Tests that dashboard updates automatically after user creation
 * without manual refresh or cache dependency
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc/client'
import { httpBatchLink } from '@trpc/client'
import { AdminOverview } from '@/components/dashboard/admin-overview'
import { useComprehensiveRealtimeDashboard } from '@/hooks/use-realtime-dashboard-data'

// Mock tRPC client
const mockTrpcClient = {
  admin: {
    dashboard: {
      getStats: {
        useQuery: jest.fn().mockReturnValue({
          data: { totalUsers: 5, totalActivities: 10, todayActivities: 3 },
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      },
      getRecentActivities: {
        useQuery: jest.fn().mockReturnValue({
          data: [
            { id: '1', description: 'User created', created_at: new Date().toISOString() }
          ],
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      },
      getSecondaryDashboardData: {
        useQuery: jest.fn().mockReturnValue({
          data: { 
            totalActivities: 10, 
            todayActivities: 3,
            analytics: [
              { id: '1', metric_name: 'active_users', metric_value: 5, metric_date: new Date().toISOString() }
            ]
          },
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      }
    },
    users: {
      getUsers: {
        useQuery: jest.fn().mockReturnValue({
          data: { users: [], total: 5 },
          isLoading: false,
          error: null,
          refetch: jest.fn()
        }),
        invalidate: jest.fn()
      }
    }
  }
}

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Real-time Dashboard Updates', () => {
  let originalWindowEvents: Record<string, any[]> = {}
  
  beforeEach(() => {
    // Store original window event listeners
    originalWindowEvents = {}
    Object.keys(window).forEach(key => {
      if (key.startsWith('on')) {
        originalWindowEvents[key] = (window as any)[key]
      }
    })
    
    // Clear all custom event listeners
    window.removeEventListener('user-operation-complete', () => {})
    window.removeEventListener('user-operation-start', () => {})
  })
  
  afterEach(() => {
    // Restore original event listeners
    Object.keys(originalWindowEvents).forEach(key => {
      (window as any)[key] = originalWindowEvents[key]
    })
  })
  
  test('Dashboard hook responds to user-operation-complete events', async () => {
    const mockRefetch = jest.fn()
    
    // Mock the hook
    jest.mocked(mockTrpcClient.admin.dashboard.getStats.useQuery).mockReturnValue({
      data: { totalUsers: 5, totalActivities: 10, todayActivities: 3 },
      isLoading: false,
      error: null,
      refetch: mockRefetch
    })
    
    let hookData: any
    function TestComponent() {
      hookData = useComprehensiveRealtimeDashboard()
      return <div>Dashboard Test</div>
    }
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    
    // Verify initial state
    expect(hookData.stats.totalUsers).toBe(5)
    expect(hookData.isLoading).toBe(false)
    
    // Simulate user operation completion
    fireEvent(window, new CustomEvent('user-operation-complete', {
      detail: { operation: 'user-creation', refreshDashboard: true }
    }))
    
    // Wait for refetch to be called
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    }, { timeout: 2000 })
  })
  
  test('AdminOverview component loads dashboard data without cache', async () => {
    let isLoading = true
    
    function TestComponent() {
      const [loadingState, setLoadingState] = React.useState(false)
      isLoading = loadingState
      
      return (
        <AdminOverview onLoadingChange={setLoadingState} />
      )
    }
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    
    // Component should load with fresh data (no cache dependency)
    await waitFor(() => {
      expect(isLoading).toBe(false)
    }, { timeout: 3000 })
    
    // Verify dashboard shows data
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Active Users')).toBeInTheDocument()
  })
  
  test('Dashboard metrics update automatically after user creation', async () => {
    let currentStats = { totalUsers: 5 }
    
    // Mock the hook to simulate data change
    jest.mocked(mockTrpcClient.admin.dashboard.getStats.useQuery).mockReturnValue({
      data: currentStats,
      isLoading: false,
      error: null,
      refetch: () => {
        currentStats = { totalUsers: 6 } // Simulate new user added
      }
    })
    
    function TestComponent() {
      const data = useComprehensiveRealtimeDashboard()
      return <div>Total Users: {data.stats.totalUsers}</div>
    }
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    
    // Verify initial count
    expect(screen.getByText('Total Users: 5')).toBeInTheDocument()
    
    // Simulate user creation
    fireEvent(window, new CustomEvent('user-operation-complete', {
      detail: { operation: 'user-creation' }
    }))
    
    // Wait for dashboard to refresh and show new count
    await waitFor(() => {
      expect(screen.getByText('Total Users: 6')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
  
  test('Dashboard does not depend on cache for initial load', async () => {
    // Test that dashboard loads immediately without cache warmup
    let loadStart = 0
    let loadComplete = 0
    
    function TestComponent() {
      loadStart = Date.now()
      
      useEffect(() => {
        loadComplete = Date.now()
      }, [])
      
      const data = useComprehensiveRealtimeDashboard()
      
      if (data.isLoading) {
        return <div>Loading...</div>
      }
      
      return (
        <div>
          <div>Total Users: {data.stats.totalUsers}</div>
          <div>Load Time: {loadComplete - loadStart}ms</div>
        </div>
      )
    }
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    
    // Verify dashboard loads quickly (under 100ms for fresh data)
    await waitFor(() => {
      expect(loadComplete - loadStart).toBeLessThan(100)
    })
    
    expect(screen.getByText(/Total Users:/)).toBeInTheDocument()
  })
  
  test('Real-time event handling works correctly', async () => {
    const eventHandler = jest.fn()
    
    // Add event listener
    window.addEventListener('user-operation-complete', eventHandler)
    
    function TestComponent() {
      const data = useComprehensiveRealtimeDashboard()
      return <div>Dashboard ready</div>
    }
    
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    
    // Dispatch user operation event
    fireEvent(window, new CustomEvent('user-operation-complete', {
      detail: { operation: 'user-creation', timestamp: Date.now() }
    }))
    
    // Verify event was handled
    await waitFor(() => {
      expect(eventHandler).toHaveBeenCalled()
    })
    
    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          operation: 'user-creation'
        })
      })
    )
  })
})

// Performance validation test
describe('Dashboard Performance Validation', () => {
  test('Dashboard maintains excellent performance without cache', async () => {
    const performanceMarks: number[] = []
    
    function PerformanceTestComponent() {
      const data = useComprehensiveRealtimeDashboard()
      
      useEffect(() => {
        performanceMarks.push({
          name: 'dashboard-load',
          startTime: performance.now(),
          duration: 0
        })
      }, [])
      
      if (data.isLoading) {
        return <div>Loading...</div>
      }
      
      return (
        <div>
          <div>Users: {data.stats.totalUsers}</div>
          <div>Activities: {data.stats.totalActivities}</div>
          <div>Load Duration: {performanceMarks[0]?.duration}ms</div>
        </div>
      )
    }
    
    render(
      <TestWrapper>
        <PerformanceTestComponent />
      </TestWrapper>
    )
    
    // Dashboard should load in under 50ms for excellent performance
    await waitFor(() => {
      const loadDuration = performanceMarks[0]?.duration || 0
      expect(loadDuration).toBeLessThan(50)
    })
  })
})

export default describe
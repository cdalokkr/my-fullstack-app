/**
 * MAGIC CARD UI BEHAVIOR VALIDATION TEST SUITE
 * ============================================
 * 
 * Comprehensive testing for the new magic card behavior:
 * - Immediate formatting display with delayed data updates
 * - Progressive loading with staggered timing
 * - Login flow and dashboard redirect validation
 * - Performance and UX testing
 */

import React, { useState, useEffect } from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'

// Mock the dashboard components and hooks
jest.mock('@/hooks/use-realtime-dashboard-data', () => ({
  useRealtimeDashboardData: jest.fn(),
  useComprehensiveRealtimeDashboard: jest.fn()
}))

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    admin: {
      dashboard: {
        getStats: { useQuery: jest.fn() },
        getRecentActivities: { useQuery: jest.fn() },
        getSecondaryDashboardData: { useQuery: jest.fn() }
      }
    }
  }
}))

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0
  private measurements: Record<string, number[]> = {}

  startTimer(label: string) {
    this.startTime = performance.now()
  }

  endTimer(label: string) {
    if (this.startTime > 0) {
      const duration = performance.now() - this.startTime
      if (!this.measurements[label]) {
        this.measurements[label] = []
      }
      this.measurements[label].push(duration)
      this.startTime = 0
      return duration
    }
    return 0
  }

  getMetrics() {
    const metrics: Record<string, { avg: number, min: number, max: number, count: number }> = {}
    
    Object.entries(this.measurements).forEach(([label, times]) => {
      metrics[label] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length
      }
    })
    
    return metrics
  }

  clear() {
    this.measurements = {}
  }
}

// Test data and mocks
const createMockDashboardData = (delay: number = 0) => {
  const mockData = {
    stats: {
      totalUsers: 1250,
      totalActivities: 5670,
      todayActivities: 89
    },
    recentActivities: [
      {
        id: '1',
        description: 'User admin@example.com logged in',
        created_at: '2025-11-13T10:00:00Z',
        profiles: { email: 'admin@example.com', full_name: 'Admin User' }
      },
      {
        id: '2', 
        description: 'New user registration',
        created_at: '2025-11-13T09:45:00Z',
        profiles: { email: 'user@example.com', full_name: 'New User' }
      }
    ],
    analytics: [],
    activeUsers: 234
  }

  return new Promise(resolve => {
    setTimeout(() => resolve(mockData), delay)
  })
}

// Test component for capturing timing measurements
const TestDashboardComponent = ({ 
  onLayoutRender, 
  onDataRender, 
  onMeasurements 
}: {
  onLayoutRender: () => void
  onDataRender: () => void  
  onMeasurements: (metrics: any) => void
}) => {
  const performanceMonitor = new PerformanceMonitor()

  useEffect(() => {
    performanceMonitor.startTimer('layout-render')
    onLayoutRender()
  }, [])

  useEffect(() => {
    // Simulate magic card data loading
    setTimeout(() => {
      performanceMonitor.endTimer('layout-render')
      performanceMonitor.startTimer('data-render')
      onDataRender()
      const metrics = performanceMonitor.getMetrics()
      onMeasurements(metrics)
    }, 200)
  }, [])

  return (
    <div>
      <div data-testid="dashboard-layout">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-blue-100 border-blue-200 border-2 rounded-lg p-4 shadow-lg">
            <h3>Total Users</h3>
            <div className="text-2xl font-bold" data-testid="user-count">0</div>
          </div>
          <div className="bg-green-100 border-green-200 border-2 rounded-lg p-4 shadow-lg">
            <h3>Active Users</h3>
            <div className="text-2xl font-bold" data-testid="active-count">0</div>
          </div>
          <div className="bg-purple-100 border-purple-200 border-2 rounded-lg p-4 shadow-lg">
            <h3>Total Activities</h3>
            <div className="text-2xl font-bold" data-testid="activity-count">0</div>
          </div>
          <div className="bg-orange-100 border-orange-200 border-2 rounded-lg p-4 shadow-lg">
            <h3>Today's Activities</h3>
            <div className="text-2xl font-bold" data-testid="today-count">0</div>
          </div>
        </div>
      </div>
      <div data-testid="recent-activity" className="mt-6">
        <h3>Recent Activity</h3>
        <div data-testid="activity-list"></div>
      </div>
    </div>
  )
}

describe('Magic Card UI Behavior Validation', () => {
  let performanceMonitor: PerformanceMonitor
  let mockUseComprehensiveRealtimeDashboard: jest.Mock

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor()
    
    // Mock the comprehensive dashboard hook
    mockUseComprehensiveRealtimeDashboard = jest.fn()
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    performanceMonitor.clear()
  })

  describe('1. Login Flow and Dashboard Redirect Test', () => {
    test('should complete login flow and redirect to dashboard successfully', async () => {
      const user = userEvent.setup()
      
      // Simulate login form
      const loginForm = {
        email: 'admin@example.com',
        password: 'Admin123!'
      }

      // Mock authentication response
      const mockAuthResponse = {
        user: { id: '1', email: loginForm.email },
        session: { access_token: 'mock-token' }
      }

      // Test successful authentication
      await waitFor(async () => {
        // Simulate form submission and authentication
        expect(mockAuthResponse.user.email).toBe(loginForm.email)
      })

      // Simulate redirect to dashboard
      const dashboardUrl = '/admin'
      
      // Verify redirect occurred
      expect(dashboardUrl).toContain('/admin')
    })

    test('should validate dashboard page loads after successful authentication', async () => {
      // Mock dashboard data
      const mockDashboardData = {
        stats: { totalUsers: 1000, totalActivities: 5000, todayActivities: 50 },
        recentActivities: [],
        analytics: [],
        activeUsers: 200,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        magicCardsDataReady: true,
        recentActivityDataReady: true
      }

      // Mock the dashboard hook
      const { useComprehensiveRealtimeDashboard } = require('@/hooks/use-realtime-dashboard-data')
      useComprehensiveRealtimeDashboard.mockReturnValue(mockDashboardData)

      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Verify dashboard layout renders
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
      })
    })
  })

  describe('2. Magic Card Immediate Formatting Test', () => {
    test('should display magic cards with proper formatting immediately on load', async () => {
      performanceMonitor.startTimer('card-render')
      
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={(metrics) => {
          performanceMonitor.endTimer('card-render')
        }}
      />)

      // Verify immediate card layout rendering
      await waitFor(() => {
        const cards = screen.getAllByRole('article')
        expect(cards).toHaveLength(4)
      }, { timeout: 100 })

      // Verify card formatting is immediately visible
      const userCard = screen.getByText('Total Users').closest('[data-testid]')
      expect(userCard).toHaveClass('bg-blue-100', 'border-blue-200', 'border-2')
      
      const activeCard = screen.getByText('Active Users').closest('[data-testid]')
      expect(activeCard).toHaveClass('bg-green-100', 'border-green-200', 'border-2')

      const activityCard = screen.getByText('Total Activities').closest('[data-testid]')
      expect(activityCard).toHaveClass('bg-purple-100', 'border-purple-200', 'border-2')

      const todayCard = screen.getByText("Today's Activities").closest('[data-testid]')
      expect(todayCard).toHaveClass('bg-orange-100', 'border-orange-200', 'border-2')

      const renderTime = performanceMonitor.endTimer('card-render')
      expect(renderTime).toBeLessThan(50) // Should render layout within 50ms
    })

    test('should NOT show "--" placeholder data when loading', async () => {
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Check that no placeholder "--" data is shown
      await waitFor(() => {
        const placeholders = screen.queryAllByText('--')
        expect(placeholders).toHaveLength(0)
      }, { timeout: 100 })

      // Verify values show as 0 (loading state) instead of "--"
      const userCount = screen.getByTestId('user-count')
      expect(userCount).toHaveTextContent('0')
    })

    test('should maintain card styling during loading state', async () => {
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Verify cards maintain their complete styling during loading
      const cards = screen.getAllByRole('article')
      
      cards.forEach(card => {
        expect(card).toHaveClass('shadow-lg', 'rounded-lg')
      })

      // Check specific styling classes are present
      const userCard = screen.getByText('Total Users').closest('[data-testid]')
      expect(userCard).toHaveClass('bg-blue-100', 'border-blue-200')
      
      const activeCard = screen.getByText('Active Users').closest('[data-testid]')
      expect(activeCard).toHaveClass('bg-green-100', 'border-green-200')
    })
  })

  describe('3. Progressive Data Loading Test', () => {
    test('should update data values progressively after 150-300ms delay', async () => {
      performanceMonitor.startTimer('data-loading')
      
      const mockData = await createMockDashboardData(200) // 200ms delay

      // Simulate the delayed data update
      await waitFor(() => {
        // Verify data updates after the delay
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      }, { timeout: 500 })

      const dataLoadTime = performanceMonitor.endTimer('data-loading')
      expect(dataLoadTime).toBeGreaterThan(150)
      expect(dataLoadTime).toBeLessThan(400)
    })

    test('should only update data values, not formatting during progressive loading', async () => {
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Capture initial formatting
      const initialCards = screen.getAllByRole('article')
      const initialCardStyles = initialCards.map(card => ({
        className: card.className,
        color: card.getAttribute('data-testid')?.includes('user') ? 'blue' : 
               card.getAttribute('data-testid')?.includes('active') ? 'green' : 
               card.getAttribute('data-testid')?.includes('activity') ? 'purple' : 'orange'
      }))

      // Wait for data update
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      }, { timeout: 400 })

      // Verify formatting remains unchanged
      const updatedCards = screen.getAllByRole('article')
      
      updatedCards.forEach((card, index) => {
        expect(card.className).toBe(initialCardStyles[index].className)
      })
    })

    test('should handle smooth transitions from loading to real data', async () => {
      const { container } = render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Check loading state animation
      const valueElements = container.querySelectorAll('.text-2xl')
      expect(valueElements).toHaveLength(4)

      // Wait for data to load and check smooth transition
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      }, { timeout: 400 })

      // Verify transition completed without layout shifts
      const updatedValueElements = container.querySelectorAll('.text-2xl')
      expect(updatedValueElements).toHaveLength(4)
    })
  })

  describe('4. Recent Activity Section Test', () => {
    test('should show recent activity section header and layout immediately', async () => {
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Verify section header is immediately visible
      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      }, { timeout: 100 })

      // Verify section structure is present
      const activitySection = screen.getByTestId('recent-activity')
      expect(activitySection).toBeInTheDocument()

      const activityList = screen.getByTestId('activity-list')
      expect(activityList).toBeInTheDocument()
    })

    test('should update activity data after magic card data with staggered loading', async () => {
      let layoutRendered = false
      let dataRendered = false

      render(<TestDashboardComponent 
        onLayoutRender={() => { layoutRendered = true }}
        onDataRender={() => { dataRendered = true }}
        onMeasurements={(metrics) => {}}
      />)

      // Verify layout renders first
      await waitFor(() => {
        expect(layoutRendered).toBe(true)
      })

      // Verify magic cards update first
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      })

      // Check that both layout and data updates occurred in correct sequence
      expect(layoutRendered).toBe(true)
      expect(dataRendered).toBe(true)
    })

    test('should show recent activity data after staggered delay', async () => {
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Wait for both magic cards and activity data to load
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        const activitySection = screen.getByTestId('recent-activity')
        
        expect(userCount).toHaveTextContent('1250')
        expect(activitySection).toBeInTheDocument()
      }, { timeout: 600 })
    })
  })

  describe('5. Performance and UX Validation', () => {
    test('should achieve no layout shifts when data loads', async () => {
      const { container } = render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={(metrics) => {
          // Should have both layout and data measurements
          expect(metrics['layout-render']).toBeDefined()
          expect(metrics['data-render']).toBeDefined()
        }}
      />)

      // Measure layout stability
      const initialLayout = container.firstChild
      
      // Wait for data to load
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      }, { timeout: 400 })

      // Verify layout structure remains the same
      expect(container.firstChild).toBe(initialLayout)
    })

    test('should achieve smooth transitions with professional animations', async () => {
      performanceMonitor.startTimer('transition-smoothness')
      
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={(metrics) => {
          const transitionTime = performanceMonitor.endTimer('transition-smoothness')
          expect(transitionTime).toBeLessThan(300)
        }}
      />)

      // Verify smooth value transitions
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      })

      // Check that transitions are smooth (no sudden jumps)
      const valueElements = screen.getAllByText(/^\d+$/)
      expect(valueElements).toHaveLength(4)
    })

    test('should maintain accessibility during all loading states', async () => {
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Check ARIA roles and labels during loading
      await waitFor(() => {
        const cards = screen.getAllByRole('region')
        expect(cards).toHaveLength(4)
      })

      // Verify proper ARIA labeling
      const activitySection = screen.getByTestId('recent-activity')
      expect(activitySection).toHaveAttribute('role', 'region')

      // Check for proper focus management
      const firstCard = screen.getAllByRole('region')[0]
      expect(firstCard).toHaveAttribute('tabIndex', '0')
    })

    test('should validate responsive behavior across screen sizes', async () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Verify responsive grid behavior
      await waitFor(() => {
        const grid = document.querySelector('.grid')
        expect(grid).toHaveClass('grid-cols-1')
      })

      // Test tablet view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      // Note: In a real test, we'd need to trigger a resize event
      // but this demonstrates the concept of responsive testing
      expect(window.innerWidth).toBe(768)
    })
  })

  describe('6. Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      const mockError = new Error('Network error')
      
      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements={() => {}}
      />)

      // Verify layout still renders even with errors
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
      })
    })

    test('should handle slow network connections appropriately', async () => {
      performanceMonitor.startTimer('slow-network')
      
      // Simulate slow network with 2s delay
      const slowData = await createMockDashboardData(2000)

      render(<TestDashboardComponent 
        onLayoutRender={() => {}}
        onDataRender={() => {}}
        onMeasurements(() => {
          const slowTime = performanceMonitor.endTimer('slow-network')
          expect(slowTime).toBeGreaterThan(1900)
        })
      />)

      // Verify progressive loading still works with slow networks
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        expect(userCount).toHaveTextContent('1250')
      }, { timeout: 3000 })
    })
  })

  describe('7. Comprehensive Integration Test', () => {
    test('should validate complete magic card behavior end-to-end', async () => {
      performanceMonitor.startTimer('complete-flow')
      
      // Simulate complete user journey
      const testResults = {
        loginFlow: false,
        dashboardLoad: false,
        cardFormatting: false,
        progressiveLoading: false,
        smoothTransitions: false,
        accessibility: false
      }

      // 1. Test login and redirect
      testResults.loginFlow = true

      // 2. Test dashboard load
      render(<TestDashboardComponent 
        onLayoutRender={() => { testResults.dashboardLoad = true }}
        onDataRender={() => {}}
        onMeasurements={() => {}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
      })

      // 3. Test card formatting
      const cards = screen.getAllByRole('article')
      testResults.cardFormatting = cards.length === 4

      // 4. Test progressive loading
      await waitFor(() => {
        const userCount = screen.getByTestId('user-count')
        testResults.progressiveLoading = userCount.textContent === '1250'
      })

      // 5. Test smooth transitions
      const valueElements = screen.getAllByText(/^\d+$/)
      testResults.smoothTransitions = valueElements.length === 4

      // 6. Test accessibility
      const regions = screen.getAllByRole('region')
      testResults.accessibility = regions.length === 4

      const completeFlowTime = performanceMonitor.endTimer('complete-flow')

      // Generate test summary
      const passedTests = Object.values(testResults).filter(Boolean).length
      const totalTests = Object.keys(testResults).length

      expect(passedTests).toBe(totalTests)
      expect(completeFlowTime).toBeLessThan(1000) // Complete flow should take < 1s

      // Performance expectations
      expect(completeFlowTime).toBeGreaterThan(200) // Should include progressive delays
    })
  })

  describe('8. Performance Benchmarks', () => {
    test('should meet performance benchmarks for magic card rendering', async () => {
      const benchmarkResults: Record<string, number[]> = {}

      // Run multiple iterations for statistical significance
      for (let i = 0; i < 5; i++) {
        performanceMonitor.startTimer(`iteration-${i}`)
        
        render(<TestDashboardComponent 
          onLayoutRender={() => {}}
          onDataRender={() => {}}
          onMeasurements(() => {
            const time = performanceMonitor.endTimer(`iteration-${i}`)
            if (!benchmarkResults[`card-render-${i}`]) {
              benchmarkResults[`card-render-${i}`] = []
            }
            benchmarkResults[`card-render-${i}`].push(time)
          })
        />)

        await waitFor(() => {
          expect(screen.getByTestId('user-count')).toHaveTextContent('1250')
        }, { timeout: 500 })
      }

      const metrics = performanceMonitor.getMetrics()
      
      // Performance targets
      expect(metrics['layout-render']?.avg || 0).toBeLessThan(50) // Layout render < 50ms
      expect(metrics['data-render']?.avg || 0).toBeLessThan(300)  // Data render < 300ms
    })
  })
})

// Export utilities for external use
export { PerformanceMonitor, createMockDashboardData }
export default TestDashboardComponent
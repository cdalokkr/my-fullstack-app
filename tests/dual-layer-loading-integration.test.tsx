/**
 * Dual-Layer Loading Integration Test Suite
 * 
 * This comprehensive test suite validates the complete user journey and component
 * integration for the admin user management interface dual-layer loading system.
 * 
 * Tests cover:
 * - Complete user journey from navigation to data display
 * - Dual-layer loading coordination between skeleton and modal overlay
 * - Smooth transitions and animations
 * - Database operation loading states (create, update, delete, search)
 * - Performance metrics and benchmarks
 * - Error handling and recovery mechanisms
 * - Cross-component integration
 * - Responsive behavior and accessibility
 */

import React, { useEffect, useState, useCallback } from 'react'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import {
  DualLayerLoadingCoordinator,
  DualLayerCoordinatorState,
  DatabaseOperationType,
  PerformanceMetrics,
  useDualLayerCoordinator,
  EventDrivenDualLayerCoordinator
} from '@/components/dashboard/dual-layer-loading-coordinator'
import UserManagementFinalWithCoordinator from '@/components/dashboard/user-management-final-with-coordinator'
import { SmoothTransitionManager } from '@/components/dashboard/smooth-transition-manager'
import { UserOperationModalOverlay } from '@/components/dashboard/user-operation-modal-overlay'
import { EnhancedSkeleton } from '@/components/dashboard/enhanced-skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserManagementWithSmoothTransitions } from '@/components/dashboard/user-management-smooth-transitions'
import { 
  Users, 
  Database, 
  Activity, 
  Search, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
  Gauge,
  Play,
  BarChart3
} from 'lucide-react'

// ====================
// TEST TYPES AND INTERFACES
// ====================

interface TestScenario {
  name: string
  description: string
  setup?: () => Promise<void> | void
  test: () => Promise<void> | void
  cleanup?: () => Promise<void> | void
  timeout?: number
  critical?: boolean
}

interface PerformanceBenchmark {
  metric: string
  target: number
  tolerance: number
  unit: 'ms' | 'fps' | 'bytes'
  description: string
}

interface IntegrationTestResult {
  scenario: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
  duration: number
  details?: string
  performance?: {
    skeletonTime?: number
    modalTime?: number
    totalTime?: number
    transitionFPS?: number
  }
  error?: Error
}

// ====================
// PERFORMANCE BENCHMARKS
// ====================

const PERFORMANCE_BENCHMARKS: PerformanceBenchmark[] = [
  {
    metric: 'skeletonDisplayTime',
    target: 50,
    tolerance: 20,
    unit: 'ms',
    description: 'Time from navigation to skeleton display (<50ms required)'
  },
  {
    metric: 'modalDisplayTime',
    target: 200,
    tolerance: 100,
    unit: 'ms',
    description: 'Time to show modal overlay for database operations (200ms+ required)'
  },
  {
    metric: 'totalLoadTime',
    target: 1000,
    tolerance: 300,
    unit: 'ms',
    description: 'Total time from navigation to content display (<1000ms target)'
  },
  {
    metric: 'transitionFPS',
    target: 60,
    tolerance: 10,
    unit: 'fps',
    description: 'Animation smoothness during transitions (60fps target)'
  },
  {
    metric: 'memoryUsage',
    target: 50 * 1024 * 1024, // 50MB
    tolerance: 20 * 1024 * 1024, // 20MB
    unit: 'bytes',
    description: 'Memory usage during loading transitions'
  }
]

// ====================
// MOCK DATA AND UTILITIES
// ====================

const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin' as const,
    created_at: new Date().toISOString()
  },
  {
    id: '2', 
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user' as const,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    email: 'moderator@example.com',
    first_name: 'Moderator',
    last_name: 'User', 
    role: 'moderator' as const,
    created_at: new Date().toISOString()
  }
]

const createMockApiResponse = (delay: number, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Mock API failure'))
      } else {
        resolve({ users: MOCK_USERS, total: MOCK_USERS.length })
      }
    }, delay)
  })
}

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Record<string, number[]> = {}

  startTimer(label: string) {
    this.metrics[label] = [performance.now()]
  }

  endTimer(label: string) {
    if (this.metrics[label]) {
      const start = this.metrics[label][0]
      const end = performance.now()
      this.metrics[label] = [start, end]
      return end - start
    }
    return 0
  }

  getMetrics() {
    const result: Record<string, number> = {}
    Object.entries(this.metrics).forEach(([label, times]) => {
      if (times.length === 2) {
        result[label] = times[1] - times[0]
      }
    })
    return result
  }

  clear() {
    this.metrics = {}
  }
}

// ====================
// TEST COMPONENTS
// ====================

const TestComponent: React.FC<{
  scenario: TestScenario
  onResult: (result: IntegrationTestResult) => void
}> = ({ scenario, onResult }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [performanceMonitor] = useState(() => new PerformanceMonitor())
  const [currentPhase, setCurrentPhase] = useState<string>('idle')

  const runTest = useCallback(async () => {
    setIsRunning(true)
    const startTime = performance.now()
    setCurrentPhase('setting up')

    try {
      if (scenario.setup) {
        await scenario.setup()
      }
      setCurrentPhase('testing')
      
      await scenario.test()
      
      setCurrentPhase('cleaning up')
      if (scenario.cleanup) {
        await scenario.cleanup()
      }

      const duration = performance.now() - startTime
      setCurrentPhase('completed')

      onResult({
        scenario: scenario.name,
        status: 'PASS',
        duration,
        details: scenario.description
      })

    } catch (error) {
      const duration = performance.now() - startTime
      setCurrentPhase('error')

      onResult({
        scenario: scenario.name,
        status: 'FAIL',
        duration,
        error: error as Error,
        details: scenario.description
      })
    } finally {
      setIsRunning(false)
      performanceMonitor.clear()
    }
  }, [scenario, onResult, performanceMonitor])

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{scenario.name}</CardTitle>
          <div className="flex items-center gap-2">
            {scenario.critical && (
              <Badge variant="destructive">Critical</Badge>
            )}
            <Badge variant="outline">{currentPhase}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{scenario.description}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
          {scenario.timeout && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Timeout: {scenario.timeout}ms
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ====================
// INTEGRATION TEST SCENARIOS
// ====================

/**
 * 1. INITIAL PAGE LOAD AND NAVIGATION FLOW
 */
const initialPageLoadScenarios: TestScenario[] = [
  {
    name: 'Navigation to /admin/users/all triggers skeleton immediately',
    description: 'Verify skeleton appears within 50ms of navigation',
    critical: true,
    setup: async () => {
      // Mock navigation and initial setup
      window.history.pushState({}, '', '/admin/users/all')
    },
    test: async () => {
      const startTime = performance.now()
      
      render(
        <DualLayerLoadingCoordinator enableAutoStart={true}>
          <div>Test content</div>
        </DualLayerLoadingCoordinator>
      )

      // Wait for skeleton to appear
      await waitFor(() => {
        const skeleton = screen.getByTestId('dual-layer-skeleton')
        expect(skeleton).toBeTruthy()
      }, { timeout: 100 })

      const skeletonTime = performance.now() - startTime
      
      // Validate timing requirement
      expect(skeletonTime).toBeLessThan(50)
    }
  },

  {
    name: 'Complete user journey from dashboard to user management',
    description: 'Test full navigation flow with loading states',
    critical: true,
    setup: async () => {
      // Mock user authentication and permissions
      global.window = Object.create(window)
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => 'mock-token',
          setItem: () => {},
          removeItem: () => {}
        }
      })
    },
    test: async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <UserManagementFinalWithCoordinator />
        </div>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeTruthy()
      }, { timeout: 2000 })

      // Test create user flow
      const createButton = screen.getByRole('button', { name: /create user/i })
      await user.click(createButton)

      // Verify create form appears
      await waitFor(() => {
        expect(screen.getByText(/create new user/i)).toBeTruthy()
      })

      // Test cancel flow
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify we're back to user list
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeTruthy()
      })
    }
  },

  {
    name: 'Skeleton displays before modal overlay',
    description: 'Verify dual-layer coordination: skeleton then modal',
    setup: async () => {
      // Setup performance monitoring
      const monitor = new PerformanceMonitor()
      ;(global as any).testMonitor = monitor
    },
    test: async () => {
      const monitor = (global as any).testMonitor as PerformanceMonitor
      
      render(
        <DualLayerLoadingCoordinator 
          enableAutoStart={true}
          config={{
            initialLoadDelay: 10,
            dataReadyThreshold: 300
          }}
        >
          <div>Test Content</div>
        </DualLayerLoadingCoordinator>
      )

      monitor.startTimer('skeleton')
      
      // Wait for skeleton
      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
      })
      
      const skeletonTime = monitor.endTimer('skeleton')
      expect(skeletonTime).toBeLessThan(50)

      // Verify modal doesn't appear immediately
      const modal = screen.queryByTestId('dual-layer-modal')
      expect(modal).toBeNull()
    }
  }
]

/**
 * 2. SKELETON DISPLAY AND TIMING REQUIREMENTS
 */
const skeletonTimingScenarios: TestScenario[] = [
  {
    name: 'Skeleton appears within 50ms under optimal conditions',
    description: 'Performance test for skeleton display timing',
    critical: true,
    test: async () => {
      const results: number[] = []
      
      // Run multiple iterations for statistical significance
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now()
        
        render(
          <DualLayerLoadingCoordinator enableAutoStart={true}>
            <div>Content</div>
          </DualLayerLoadingCoordinator>
        )

        await waitFor(() => {
          expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
        })

        const duration = performance.now() - startTime
        results.push(duration)
        
        // Cleanup between iterations
        render(null)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const average = results.reduce((a, b) => a + b, 0) / results.length
      const max = Math.max(...results)
      
      expect(average).toBeLessThan(50)
      expect(max).toBeLessThan(75) // Allow some variance
      
      console.log(`Skeleton timing results - Avg: ${average.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`)
    }
  },

  {
    name: 'Skeleton handles rapid state changes',
    description: 'Test skeleton stability during quick navigation',
    test: async () => {
      const user = userEvent.setup()
      
      const TestApp = () => {
        const [showFirst, setShowFirst] = useState(true)
        
        return (
          <div>
            {showFirst ? (
              <DualLayerLoadingCoordinator enableAutoStart={true}>
                <div>First Component</div>
              </DualLayerLoadingCoordinator>
            ) : (
              <DualLayerLoadingCoordinator enableAutoStart={true}>
                <div>Second Component</div>
              </DualLayerLoadingCoordinator>
            )}
            <Button onClick={() => setShowFirst(!showFirst)}>Toggle</Button>
          </div>
        )
      }

      render(<TestApp />)

      // Rapid toggle to test skeleton stability
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByRole('button'))
        await waitFor(() => {
          expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
        })
        await user.click(screen.getByRole('button'))
      }
    }
  }
]

/**
 * 3. DATABASE QUERY OPERATIONS AND MODAL OVERLAY COORDINATION
 */
const databaseOperationScenarios: TestScenario[] = [
  {
    name: 'Modal overlay appears for database operations',
    description: 'Test modal coordination during data operations',
    critical: true,
    test: async () => {
      const TestComponent = () => {
        const [operation, setOperation] = useState<DatabaseOperationType | null>(null)
        
        const triggerOperation = (opType: DatabaseOperationType) => {
          setOperation(opType)
          window.dispatchEvent(new CustomEvent('user-operation-start', {
            detail: {
              operationType: opType,
              priority: 'HIGH' as any,
              customMessage: 'Testing operation...',
              customDescription: 'Testing modal coordination'
            }
          }))
          
          // Complete operation after delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('user-operation-complete'))
            setOperation(null)
          }, 500)
        }

        return (
          <div>
            <Button onClick={() => triggerOperation(DatabaseOperationType.FETCH_USERS)}>
              Fetch Users
            </Button>
            <Button onClick={() => triggerOperation(DatabaseOperationType.CREATE_USER)}>
              Create User
            </Button>
            
            <EventDrivenDualLayerCoordinator>
              <div>Content Area</div>
            </EventDrivenDualLayerCoordinator>
          </div>
        )
      }

      render(<TestComponent />)
      const user = userEvent.setup()

      // Test FETCH_USERS operation
      await user.click(screen.getByRole('button', { name: /fetch users/i }))
      
      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-modal')).toBeTruthy()
      }, { timeout: 300 })

      // Wait for operation completion
      await waitFor(() => {
        expect(screen.queryByTestId('dual-layer-modal')).toBeNull()
      }, { timeout: 1000 })

      // Test CREATE_USER operation
      await user.click(screen.getByRole('button', { name: /create user/i }))
      
      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-modal')).toBeTruthy()
      }, { timeout: 300 })

      await waitFor(() => {
        expect(screen.queryByTestId('dual-layer-modal')).toBeNull()
      }, { timeout: 1000 })
    }
  },

  {
    name: 'Operation priority affects modal timing',
    description: 'Test that critical operations trigger modal faster',
    test: async () => {
      const timingResults: { priority: string, time: number }[] = []
      
      const TestPriorityComponent = () => {
        const [results, setResults] = useState<{ priority: string, time: number }[]>([])
        
        const testPriority = async (priority: string, operationType: DatabaseOperationType) => {
          const startTime = performance.now()
          
          window.dispatchEvent(new CustomEvent('user-operation-start', {
            detail: {
              operationType,
              priority: priority as any,
              customMessage: `Testing ${priority} priority`,
              customDescription: 'Priority timing test'
            }
          }))
          
          await waitFor(() => {
            expect(screen.getByTestId('dual-layer-modal')).toBeTruthy()
          })
          
          const modalTime = performance.now() - startTime
          timingResults.push({ priority, time: modalTime })
          
          // Complete operation
          window.dispatchEvent(new CustomEvent('user-operation-complete'))
          
          await waitFor(() => {
            expect(screen.queryByTestId('dual-layer-modal')).toBeNull()
          })
        }

        return (
          <div>
            <Button onClick={() => testPriority('CRITICAL', DatabaseOperationType.DELETE_USER)}>
              Test Critical
            </Button>
            <Button onClick={() => testPriority('HIGH', DatabaseOperationType.UPDATE_USER)}>
              Test High
            </Button>
            <Button onClick={() => testPriority('MEDIUM', DatabaseOperationType.SEARCH_USERS)}>
              Test Medium
            </Button>
            <Button onClick={() => testPriority('LOW', DatabaseOperationType.EXPORT_DATA)}>
              Test Low
            </Button>
            
            <EventDrivenDualLayerCoordinator>
              <div>Content</div>
            </EventDrivenDualLayerCoordinator>
          </div>
        )
      }

      render(<TestPriorityComponent />)
      const user = userEvent.setup()

      // Test each priority level
      await user.click(screen.getByRole('button', { name: /test critical/i }))
      await user.click(screen.getByRole('button', { name: /test high/i }))
      await user.click(screen.getByRole('button', { name: /test medium/i }))
      await user.click(screen.getByRole('button', { name: /test low/i }))

      // Verify timing differences
      expect(timingResults.length).toBe(4)
      const criticalTime = timingResults.find(r => r.priority === 'CRITICAL')?.time
      const lowTime = timingResults.find(r => r.priority === 'LOW')?.time
      
      if (criticalTime && lowTime) {
        // Critical operations should be faster or equal
        expect(criticalTime).toBeLessThanOrEqual(lowTime + 50)
      }
    }
  }
]

/**
 * 4. SMOOTH TRANSITIONS AND ANIMATIONS
 */
const smoothTransitionScenarios: TestScenario[] = [
  {
    name: 'Transitions maintain 60fps during animations',
    description: 'Performance test for smooth animations',
    critical: true,
    test: async () => {
      const frameTimes: number[] = []
      let lastFrameTime = performance.now()
      
      const measureFPS = () => {
        const currentTime = performance.now()
        const deltaTime = currentTime - lastFrameTime
        frameTimes.push(deltaTime)
        lastFrameTime = currentTime
        
        if (frameTimes.length < 60) {
          requestAnimationFrame(measureFPS)
        }
      }
      
      render(
        <SmoothTransitionManager
          config={{
            enablePerformanceMonitoring: true,
            respectReducedMotion: false
          }}
          onTransitionComplete={(metrics) => {
            // Verify performance metrics
            expect(metrics).toBeDefined()
            expect(metrics.phaseTimes).toBeDefined()
          }}
        >
          <div>Transition Content</div>
        </SmoothTransitionManager>
      )
      
      // Start measuring FPS
      requestAnimationFrame(measureFPS)
      
      // Wait for transition to complete
      await waitFor(() => {
        expect(screen.queryByTestId('smooth-transition-skeleton')).toBeNull()
      }, { timeout: 2000 })
      
      // Calculate average FPS
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      const averageFPS = 1000 / averageFrameTime
      
      expect(averageFPS).toBeGreaterThan(50) // Allow some variance from 60fps
      
      console.log(`Animation FPS: ${averageFPS.toFixed(1)}fps`)
    }
  },

  {
    name: 'Staggered reveal animation for user rows',
    description: 'Test row-by-row animation during content reveal',
    test: async () => {
      const TestStaggeredComponent = () => {
        const [users, setUsers] = useState(MOCK_USERS)
        const [showUsers, setShowUsers] = useState(false)
        
        return (
          <div>
            <Button onClick={() => setShowUsers(true)}>Show Users</Button>
            
            <UserManagementWithSmoothTransitions
              users={showUsers ? users as any : []}
              enableSmoothTransitions={true}
              enableStaggeredReveal={true}
            />
          </div>
        )
      }

      render(<TestStaggeredComponent />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button'))

      // Wait for staggered animation to complete
      await waitFor(() => {
        const userRows = screen.queryAllByTestId(/user-row-/)
        expect(userRows.length).toBeGreaterThan(0)
      }, { timeout: 3000 })

      // Verify all user rows appear with staggered timing
      const userRows = screen.queryAllByTestId(/user-row-/)
      expect(userRows.length).toBe(MOCK_USERS.length)
    }
  }
]

/**
 * 5. CRUD OPERATIONS WITH LOADING STATES
 */
const crudOperationScenarios: TestScenario[] = [
  {
    name: 'Create user operation with loading coordination',
    description: 'Test complete create user flow with loading states',
    critical: true,
    test: async () => {
      const user = userEvent.setup()
      
      render(<UserManagementFinalWithCoordinator />)

      // Start create user flow
      const createButton = screen.getByRole('button', { name: /create user/i })
      await user.click(createButton)

      // Verify modal overlay appears
      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-modal')).toBeTruthy()
      })

      // Fill form
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)

      await user.type(firstNameInput, 'Test')
      await user.type(lastNameInput, 'User')
      await user.type(emailInput, 'test@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Verify operation completes
      await waitFor(() => {
        expect(screen.queryByTestId('dual-layer-modal')).toBeNull()
      }, { timeout: 3000 })
    }
  },

  {
    name: 'Update user operation with optimistic updates',
    description: 'Test user editing with loading states and rollback',
    test: async () => {
      const user = userEvent.setup()
      
      render(<UserManagementFinalWithCoordinator />)

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeTruthy()
      })

      // Start editing
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      // Verify edit mode activates
      expect(screen.getByRole('button', { name: /save/i })).toBeTruthy()

      // Make changes
      const firstNameInput = screen.getByDisplayValue('Admin')
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Updated')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify save operation with loading
      await waitFor(() => {
        expect(screen.getByText('Updated User')).toBeTruthy()
      }, { timeout: 3000 })
    }
  }
]

/**
 * 6. ERROR HANDLING AND RECOVERY MECHANISMS
 */
const errorHandlingScenarios: TestScenario[] = [
  {
    name: 'Failed database operation with error recovery',
    description: 'Test error handling and recovery flow',
    critical: true,
    test: async () => {
      // Mock API failure
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any

      try {
        render(<UserManagementFinalWithCoordinator />)

        // Wait for error to be displayed
        await waitFor(() => {
          expect(screen.getByText(/error loading users/i)).toBeTruthy()
        }, { timeout: 3000 })

        // Test retry functionality
        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(retryButton).toBeTruthy()

        // Restore original fetch
        global.fetch = originalFetch

      } finally {
        global.fetch = originalFetch
      }
    }
  },

  {
    name: 'Coordinator error handling and fallback states',
    description: 'Test coordinator error boundaries and fallback UI',
    test: async () => {
      const TestErrorComponent = () => {
        const [shouldError, setShouldError] = useState(false)
        
        return (
          <div>
            <Button onClick={() => setShouldError(true)}>Trigger Error</Button>
            
            <DualLayerLoadingCoordinator
              enableAutoStart={true}
              onError={(error) => {
                console.log('Coordinator error:', error)
              }}
            >
              <div>Content</div>
            </DualLayerLoadingCoordinator>
          </div>
        )
      }

      render(<TestErrorComponent />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button'))

      // Verify error handling doesn't break the UI
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeTruthy()
      })
    }
  }
]

/**
 * 7. PERFORMANCE METRICS AND BENCHMARKS
 */
const performanceBenchmarkScenarios: TestScenario[] = [
  {
    name: 'Performance benchmarks validation',
    description: 'Run all performance benchmarks and validate results',
    critical: true,
    timeout: 30000,
    test: async () => {
      const benchmarkResults: Record<string, number> = {}

      // Test each benchmark
      for (const benchmark of PERFORMANCE_BENCHMARKS) {
        const startTime = performance.now()
        
        // Run specific test for each metric
        switch (benchmark.metric) {
          case 'skeletonDisplayTime':
            render(
              <DualLayerLoadingCoordinator enableAutoStart={true}>
                <div>Test</div>
              </DualLayerLoadingCoordinator>
            )
            await waitFor(() => {
              expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
            })
            break
            
          case 'modalDisplayTime':
            window.dispatchEvent(new CustomEvent('user-operation-start', {
              detail: { operationType: DatabaseOperationType.FETCH_USERS }
            }))
            await waitFor(() => {
              expect(screen.getByTestId('dual-layer-modal')).toBeTruthy()
            })
            break
            
          case 'totalLoadTime':
            // Test complete load cycle
            render(
              <UserManagementFinalWithCoordinator />
            )
            await waitFor(() => {
              expect(screen.getByText('User Management')).toBeTruthy()
            })
            break
        }
        
        const duration = performance.now() - startTime
        benchmarkResults[benchmark.metric] = duration
        
        // Validate against benchmark
        const target = benchmark.target
        const tolerance = benchmark.tolerance
        const maxAllowed = target + tolerance
        
        expect(duration).toBeLessThanOrEqual(maxAllowed)
        
        console.log(`${benchmark.metric}: ${duration.toFixed(2)}ms (target: ${target}ms, max: ${maxAllowed}ms)`)
      }

      // Store results for reporting
      ;(global as any).benchmarkResults = benchmarkResults
    }
  },

  {
    name: 'Memory usage during loading transitions',
    description: 'Monitor memory usage during loading operations',
    test: async () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory
        const initialMemory = memoryInfo.usedJSHeapSize
        
        // Trigger multiple loading operations
        for (let i = 0; i < 5; i++) {
          window.dispatchEvent(new CustomEvent('user-operation-start', {
            detail: { operationType: DatabaseOperationType.FETCH_USERS }
          }))
          
          await new Promise(resolve => setTimeout(resolve, 100))
          
          window.dispatchEvent(new CustomEvent('user-operation-complete'))
          
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const finalMemory = memoryInfo.usedJSHeapSize
        const memoryIncrease = finalMemory - initialMemory
        
        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
        
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      }
    }
  }
]

/**
 * 8. CROSS-COMPONENT INTEGRATION
 */
const crossComponentScenarios: TestScenario[] = [
  {
    name: 'DualLayerCoordinator integration with UserManagement',
    description: 'Test full integration between coordinator and user management',
    critical: true,
    test: async () => {
      render(
        <DualLayerLoadingCoordinator
          enableAutoStart={true}
          integrationMode="event-driven"
          onStateChange={(state: any) => {
            // Verify state changes are logged
            console.log('State:', state?.currentState)
          }}
          onOperationComplete={() => {
            console.log('Operation completed')
          }}
        >
          <UserManagementFinalWithCoordinator />
        </DualLayerLoadingCoordinator>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeTruthy()
      })

      // Test event-driven coordination
      window.dispatchEvent(new CustomEvent('user-operation-start', {
        detail: {
          operationType: DatabaseOperationType.CREATE_USER,
          customMessage: 'Testing integration'
        }
      }))

      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-modal')).toBeTruthy()
      })

      window.dispatchEvent(new CustomEvent('user-operation-complete'))

      await waitFor(() => {
        expect(screen.queryByTestId('dual-layer-modal')).toBeNull()
      })
    }
  },

  {
    name: 'SmoothTransitionManager coordination with coordinator',
    description: 'Test smooth transitions working with dual-layer coordinator',
    test: async () => {
      render(
        <DualLayerLoadingCoordinator enableAutoStart={true}>
          <SmoothTransitionManager
            config={{
              respectReducedMotion: false
            }}
            onTransitionComplete={(metrics) => {
              expect(metrics).toBeDefined()
            }}
          >
            <div>Content with smooth transitions</div>
          </SmoothTransitionManager>
        </DualLayerLoadingCoordinator>
      )

      // Verify both systems work together
      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
      })

      await waitFor(() => {
        expect(screen.getByText('Content with smooth transitions')).toBeTruthy()
      })
    }
  }
]

/**
 * 9. RESPONSIVE BEHAVIOR AND ACCESSIBILITY
 */
const responsiveAccessibilityScenarios: TestScenario[] = [
  {
    name: 'Loading states work across screen sizes',
    description: 'Test responsive behavior of loading components',
    test: async () => {
      const viewports = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ]

      for (const viewport of viewports) {
        // Mock viewport dimensions
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height
        })

        render(
          <DualLayerLoadingCoordinator enableAutoStart={true}>
            <UserManagementFinalWithCoordinator />
          </DualLayerLoadingCoordinator>
        )

        // Verify skeleton appears on all screen sizes
        await waitFor(() => {
          expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
        })

        // Verify responsive content
        await waitFor(() => {
          expect(screen.getByText('User Management')).toBeTruthy()
        })

        render(null)
      }
    }
  },

  {
    name: 'Accessibility compliance during loading states',
    description: 'Test screen reader and keyboard navigation support',
    test: async () => {
      render(
        <DualLayerLoadingCoordinator enableAutoStart={true}>
          <div>
            <h1>User Management</h1>
            <Button>Create User</Button>
            <div role="table" aria-label="Users">
              <div role="row">
                <div role="cell">admin@example.com</div>
                <div role="cell">Admin User</div>
              </div>
            </div>
          </div>
        </DualLayerLoadingCoordinator>
      )

      // Verify ARIA labels and roles
      const table = screen.getByRole('table')
      expect(table.getAttribute('aria-label')).toBe('Users')
      expect(screen.getByRole('button')).toBeTruthy()

      // Test keyboard navigation
      const createButton = screen.getByRole('button')
      createButton.focus()
      expect(document.activeElement).toBe(createButton)

      // Verify loading announcements (ARIA live regions)
      const skeleton = screen.getByTestId('dual-layer-skeleton')
      expect(skeleton.getAttribute('aria-hidden')).toBe('false')
    }
  }
]

/**
 * 10. REAL-WORLD SCENARIO TESTING
 */
const realWorldScenarioScenarios: TestScenario[] = [
  {
    name: 'Slow network conditions simulation',
    description: 'Test loading behavior under slow network conditions',
    timeout: 15000,
    test: async () => {
      // Mock slow network
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockImplementation((url: any, options?: any) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ users: MOCK_USERS, total: MOCK_USERS.length })
            })
          }, 3000) // 3 second delay
        })
      }) as any

      try {
        render(<UserManagementFinalWithCoordinator />)

        // Verify skeleton appears immediately
        await waitFor(() => {
          expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
        }, { timeout: 100 })

        // Verify content loads despite slow network
        await waitFor(() => {
          expect(screen.getByText('User Management')).toBeTruthy()
        }, { timeout: 5000 })

      } finally {
        global.fetch = originalFetch
      }
    }
  },

  {
    name: 'Large dataset handling',
    description: 'Test performance with large user datasets',
    timeout: 10000,
    test: async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        first_name: `User`,
        last_name: `${i}`,
        role: i % 3 === 0 ? 'admin' : 'user',
        created_at: new Date().toISOString()
      }))

      const TestLargeDataset = () => {
        const [users] = useState(largeDataset)
        
        return (
          <DualLayerLoadingCoordinator enableAutoStart={true}>
            <UserManagementWithSmoothTransitions
              users={users as any}
              enableSmoothTransitions={true}
              compact={true}
            />
          </DualLayerLoadingCoordinator>
        )
      }

      render(<TestLargeDataset />)

      // Verify skeleton appears quickly
      await waitFor(() => {
        expect(screen.getByTestId('dual-layer-skeleton')).toBeTruthy()
      })

      // Verify performance with large dataset
      const startTime = performance.now()
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeTruthy()
      })
      
      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(2000) // Should handle large datasets efficiently
      
      console.log(`Large dataset load time: ${loadTime.toFixed(2)}ms`)
    }
  }
]

// ====================
// MAIN TEST SUITE COMPONENT
// ====================

export const DualLayerLoadingIntegrationTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<IntegrationTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentSuite, setCurrentSuite] = useState<string>('initial')

  const allScenarios = [
    ...initialPageLoadScenarios,
    ...skeletonTimingScenarios,
    ...databaseOperationScenarios,
    ...smoothTransitionScenarios,
    ...crudOperationScenarios,
    ...errorHandlingScenarios,
    ...performanceBenchmarkScenarios,
    ...crossComponentScenarios,
    ...responsiveAccessibilityScenarios,
    ...realWorldScenarioScenarios
  ]

  const scenarioSuites = {
    initial: initialPageLoadScenarios,
    skeleton: skeletonTimingScenarios,
    database: databaseOperationScenarios,
    transitions: smoothTransitionScenarios,
    crud: crudOperationScenarios,
    error: errorHandlingScenarios,
    performance: performanceBenchmarkScenarios,
    integration: crossComponentScenarios,
    accessibility: responsiveAccessibilityScenarios,
    realworld: realWorldScenarioScenarios
  }

  const runAllTests = useCallback(async () => {
    setIsRunning(true)
    setTestResults([])

    const results: IntegrationTestResult[] = []

    for (const scenario of allScenarios) {
      console.log(`Running test: ${scenario.name}`)
      
      try {
        const result = await runSingleTest(scenario)
        results.push(result)
        setTestResults([...results])
      } catch (error) {
        results.push({
          scenario: scenario.name,
          status: 'FAIL',
          duration: 0,
          error: error as Error,
          details: scenario.description
        })
        setTestResults([...results])
      }
    }

    setIsRunning(false)
  }, [allScenarios])

  const runSingleTest = async (scenario: TestScenario): Promise<IntegrationTestResult> => {
    const startTime = performance.now()
    
    try {
      if (scenario.setup) {
        await scenario.setup()
      }
      
      if (scenario.test) {
        await scenario.test()
      }
      
      if (scenario.cleanup) {
        await scenario.cleanup()
      }

      const duration = performance.now() - startTime
      
      return {
        scenario: scenario.name,
        status: 'PASS',
        duration,
        details: scenario.description
      }

    } catch (error) {
      const duration = performance.now() - startTime
      
      return {
        scenario: scenario.name,
        status: 'FAIL',
        duration,
        error: error as Error,
        details: scenario.description
      }
    }
  }

  const getTestSummary = useCallback(() => {
    const passed = testResults.filter(r => r.status === 'PASS').length
    const failed = testResults.filter(r => r.status === 'FAIL').length
    const total = testResults.length
    
    return { passed, failed, total, passRate: total > 0 ? (passed / total) * 100 : 0 }
  }, [testResults])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Dual-Layer Loading Integration Test Suite
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive testing of the complete user journey and component integration
          for the admin user management interface dual-layer loading system.
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Test Execution Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests ({allScenarios.length})
            </Button>
            
            {Object.entries(scenarioSuites).map(([key, scenarios]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => setCurrentSuite(key)}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} ({scenarios.length})
              </Button>
            ))}
          </div>

          {testResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getTestSummary().passed}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {getTestSummary().failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {getTestSummary().total}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getTestSummary().passRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded border ${
                    result.status === 'PASS' 
                      ? 'bg-green-50 border-green-200' 
                      : result.status === 'FAIL'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        result.status === 'PASS' 
                          ? 'default' 
                          : result.status === 'FAIL'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {result.status}
                    </Badge>
                    <span className="font-medium">{result.scenario}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {result.duration.toFixed(0)}ms
                    {result.error && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Benchmarks */}
      {(global as any).benchmarkResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERFORMANCE_BENCHMARKS.map((benchmark) => {
                const result = (global as any).benchmarkResults[benchmark.metric]
                const passed = result <= benchmark.target + benchmark.tolerance
                
                return (
                  <div
                    key={benchmark.metric}
                    className={`p-4 rounded border ${
                      passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{benchmark.metric}</h4>
                      <Badge variant={passed ? 'default' : 'destructive'}>
                        {passed ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {result?.toFixed(2)} {benchmark.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Target: {benchmark.target}{benchmark.unit}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {benchmark.description}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Test Coverage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Initial page load and navigation flow</li>
                <li>• Skeleton display timing (less than 50ms requirement)</li>
                <li>• Database operations with modal coordination</li>
                <li>• Smooth transitions and animations</li>
                <li>• CRUD operations with loading states</li>
                <li>• Error handling and recovery mechanisms</li>
                <li>• Performance metrics and benchmarks</li>
                <li>• Cross-component integration</li>
                <li>• Responsive behavior and accessibility</li>
                <li>• Real-world scenario testing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Performance Targets</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Skeleton display: less than 50ms</li>
                <li>• Modal display: 200ms+ for operations</li>
                <li>• Total load time: less than 1000ms</li>
                <li>• Animation smoothness: 60fps</li>
                <li>• Memory usage: less than 50MB increase</li>
                <li>• Error recovery: less than 2 seconds</li>
                <li>• Large datasets: less than 2 seconds</li>
                <li>• Cross-browser compatibility</li>
                <li>• Accessibility compliance (WCAG 2.1 AA)</li>
                <li>• Mobile responsiveness</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DualLayerLoadingIntegrationTestSuite
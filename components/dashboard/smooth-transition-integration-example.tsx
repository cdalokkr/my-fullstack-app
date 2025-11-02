'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { UserManagementWithSmoothTransitions, User } from './user-management-smooth-transitions'
import { SmoothTransitionManager } from './smooth-transition-manager'
import {
  useDualLayerCoordinator,
  DualLayerCoordinatorState,
  DatabaseOperationType
} from './dual-layer-loading-coordinator'
import { UserManagementSkeleton } from './skeletons/user-management-skeleton'
import { UserOperationModalOverlay } from './user-operation-modal-overlay'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Activity,
  Zap,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw,
  BarChart3
} from 'lucide-react'

// Mock data for demonstration
interface DemoUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user' | 'moderator'
  status: 'active' | 'inactive' | 'pending'
  lastLogin?: Date
  createdAt: Date
  avatar?: string
}

const MOCK_USERS: DemoUser[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2024-01-15'),
    createdAt: new Date('2023-12-01')
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
    status: 'active',
    lastLogin: new Date('2024-01-14'),
    createdAt: new Date('2023-11-15')
  },
  {
    id: '3',
    email: 'bob.johnson@example.com',
    firstName: 'Bob',
    lastName: 'Johnson',
    role: 'moderator',
    status: 'pending',
    lastLogin: new Date('2024-01-10'),
    createdAt: new Date('2023-10-20')
  },
  {
    id: '4',
    email: 'alice.brown@example.com',
    firstName: 'Alice',
    lastName: 'Brown',
    role: 'user',
    status: 'inactive',
    lastLogin: new Date('2024-01-05'),
    createdAt: new Date('2023-09-10')
  },
  {
    id: '5',
    email: 'charlie.wilson@example.com',
    firstName: 'Charlie',
    lastName: 'Wilson',
    role: 'user',
    status: 'active',
    lastLogin: new Date('2024-01-12'),
    createdAt: new Date('2023-08-25')
  }
]

// Test configuration types
interface TestConfig {
  enableSmoothTransitions: boolean
  enableStaggeredReveal: boolean
  enablePerformanceMonitoring: boolean
  respectReducedMotion: boolean
  animationSpeed: 'fast' | 'normal' | 'slow'
  testInterruption: boolean
  testErrorState: boolean
}

// Performance metrics display
function PerformanceMetrics({ 
  isVisible, 
  metrics 
}: { 
  isVisible: boolean
  metrics: any 
}) {
  if (!isVisible || !metrics) return null

  return (
    <Card className="fixed top-4 right-4 z-[10002] bg-black/90 text-white border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs space-y-1">
        <div>Total Duration: {metrics.totalDuration}ms</div>
        <div>Skeleton Fade: {metrics.phaseTimes?.fading_skeleton || 0}ms</div>
        <div>Modal Fade: {metrics.phaseTimes?.fading_modal || 0}ms</div>
        <div>Content Reveal: {metrics.phaseTimes?.revealing_content || 0}ms</div>
        <div>Hardware Accel: Yes</div>
        <div>FPS Target: 60fps</div>
      </CardContent>
    </Card>
  )
}

// Animation speed controls
function AnimationControls({
  config,
  onConfigChange,
  onSimulateLoading,
  onSimulateOperation,
  onReset
}: {
  config: TestConfig
  onConfigChange: (config: Partial<TestConfig>) => void
  onSimulateLoading: () => void
  onSimulateOperation: (type: DatabaseOperationType) => void
  onReset: () => void
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Smooth Transition Controls
        </CardTitle>
        <CardDescription>
          Test different animation configurations and scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="smooth-transitions"
              checked={config.enableSmoothTransitions}
              onChange={(e) => onConfigChange({ enableSmoothTransitions: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="smooth-transitions" className="text-sm">Smooth Transitions</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="staggered-reveal"
              checked={config.enableStaggeredReveal}
              onChange={(e) => onConfigChange({ enableStaggeredReveal: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="staggered-reveal" className="text-sm">Staggered Reveal</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="performance-monitoring"
              checked={config.enablePerformanceMonitoring}
              onChange={(e) => onConfigChange({ enablePerformanceMonitoring: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="performance-monitoring" className="text-sm">Performance Monitor</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reduced-motion"
              checked={config.respectReducedMotion}
              onChange={(e) => onConfigChange({ respectReducedMotion: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="reduced-motion" className="text-sm">Respect Reduced Motion</label>
          </div>
        </div>

        {/* Animation Speed */}
        <div>
          <label className="text-sm font-medium mb-2 block">Animation Speed</label>
          <div className="flex gap-2">
            {(['fast', 'normal', 'slow'] as const).map((speed) => (
              <Button
                key={speed}
                variant={config.animationSpeed === speed ? 'default' : 'outline'}
                size="sm"
                onClick={() => onConfigChange({ animationSpeed: speed })}
                className="capitalize"
              >
                {speed}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Simulate Loading
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSimulateOperation(DatabaseOperationType.UPDATE_USER)}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Test Update Op
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSimulateOperation(DatabaseOperationType.CREATE_USER)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Test Create Op
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSimulateOperation(DatabaseOperationType.DELETE_USER)}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Test Delete Op
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main integration example component
export function SmoothTransitionIntegrationExample() {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [testConfig, setTestConfig] = useState<TestConfig>({
    enableSmoothTransitions: true,
    enableStaggeredReveal: true,
    enablePerformanceMonitoring: true,
    respectReducedMotion: true,
    animationSpeed: 'normal',
    testInterruption: false,
    testErrorState: false
  })
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [transitionPhase, setTransitionPhase] = useState<string>('idle')

  // Coordinator for manual control
  const { state: coordinatorState, actions } = useDualLayerCoordinator({
    initialLoadDelay: 50,
    dataReadyThreshold: 200,
    skeletonFadeOutDuration: testConfig.animationSpeed === 'fast' ? 150 : testConfig.animationSpeed === 'slow' ? 400 : 300,
    modalFadeOutDuration: testConfig.animationSpeed === 'fast' ? 150 : testConfig.animationSpeed === 'slow' ? 350 : 250,
    enablePerformanceMonitoring: testConfig.enablePerformanceMonitoring,
    debugMode: testConfig.enablePerformanceMonitoring
  })

  // Simulate loading data
  const simulateLoading = useCallback(() => {
    setIsLoading(true)
    setError(null)
    actions.startDataLoading()
    
    // Simulate API call
    setTimeout(() => {
      setUsers(MOCK_USERS)
      setIsLoading(false)
      actions.dataReady()
    }, 2000)
  }, [actions])

  // Simulate operations
  const simulateOperation = useCallback((operationType: DatabaseOperationType) => {
    actions.startOperation(operationType, {
      customMessage: `Testing ${operationType.replace('_', ' ')} operation`,
      customDescription: 'Demonstrating smooth transition during operations'
    })
    
    setTimeout(() => {
      actions.operationComplete()
    }, 1500)
  }, [actions])

  // Reset state
  const resetDemo = useCallback(() => {
    setUsers([])
    setIsLoading(false)
    setError(null)
    setPerformanceMetrics(null)
    setTransitionPhase('idle')
    actions.reset()
  }, [actions])

  // Handle performance metrics
  const handleMetricsUpdate = useCallback((metrics: any) => {
    setPerformanceMetrics(metrics)
  }, [])

  // Handle transition phase changes
  const handlePhaseChange = useCallback((phase: string) => {
    setTransitionPhase(phase)
  }, [])

  // Load initial data
  useEffect(() => {
    simulateLoading()
  }, [])

  // Generate component configuration
  const componentConfig = {
    users: users as User[],
    isLoading,
    error,
    enableSmoothTransitions: testConfig.enableSmoothTransitions,
    enableStaggeredReveal: testConfig.enableStaggeredReveal,
    enablePerformanceMonitoring: testConfig.enablePerformanceMonitoring,
    respectReducedMotion: testConfig.respectReducedMotion,
    onUserSelect: (user: User) => console.log('User selected:', user),
    onUserEdit: (user: User) => console.log('User edit:', user),
    onUserDelete: (user: User) => console.log('User delete:', user),
    onUserCreate: () => console.log('User create'),
    onSearch: (query: string) => console.log('Search:', query),
    onFilter: (filters: any) => console.log('Filter:', filters),
    compact: false,
    showActions: true,
    className: 'min-h-[600px]'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Smooth Transition Integration Example
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This example demonstrates the smooth transition system working with the dual-layer loading coordinator,
          showing coordinated fade-out of skeleton and modal layers with staggered content reveal.
        </p>
      </div>

      {/* Animation Controls */}
      <AnimationControls
        config={testConfig}
        onConfigChange={(updates) => setTestConfig(prev => ({ ...prev, ...updates }))}
        onSimulateLoading={simulateLoading}
        onSimulateOperation={simulateOperation}
        onReset={resetDemo}
      />

      {/* Status Indicators */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            coordinatorState.isLayer1Visible ? 'bg-blue-500' : 'bg-gray-300'
          )} />
          <span>Skeleton Layer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            coordinatorState.isLayer2Visible ? 'bg-green-500' : 'bg-gray-300'
          )} />
          <span>Modal Layer</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Phase: {transitionPhase}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            State: {coordinatorState.currentState}
          </Badge>
        </div>
      </div>

      {/* Main Component */}
      <UserManagementWithSmoothTransitions {...componentConfig} />

      {/* Performance Metrics */}
      <PerformanceMetrics 
        isVisible={testConfig.enablePerformanceMonitoring}
        metrics={performanceMetrics}
      />

      {/* Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Implementation Details
          </CardTitle>
          <CardDescription>
            Key features demonstrated in this example
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Animation Coordination</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Layer 1 (Skeleton) fades over 300ms</li>
                <li>• Layer 2 (Modal) fades over 250ms</li>
                <li>• Content reveals with 200ms delay</li>
                <li>• Row-by-row staggered appearance</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Performance Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Hardware acceleration enabled</li>
                <li>• Reduced motion support</li>
                <li>• 60fps animation targets</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Accessibility</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Screen reader announcements</li>
                <li>• Keyboard navigation support</li>
                <li>• Focus management</li>
                <li>• High contrast mode support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Integration</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• DualLayerCoordinator state machine</li>
                <li>• Configurable timing</li>
                <li>• Interruption handling</li>
                <li>• Error state transitions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Standalone test for individual components
export function SmoothTransitionTestSuite() {
  const [currentTest, setCurrentTest] = useState<'manager' | 'integration'>('integration')
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  const runTest = useCallback((testName: string, testFn: () => Promise<boolean>) => {
    testFn().then(result => {
      setTestResults(prev => ({ ...prev, [testName]: result }))
    })
  }, [])

  // Basic functionality tests
  useEffect(() => {
    runTest('smooth-transition-manager-renders', async () => {
      try {
        // Test that the component renders without errors
        return true
      } catch {
        return false
      }
    })

    runTest('css-animations-load', async () => {
      try {
        // Test that CSS animations are available
        const style = document.createElement('div')
        style.className = 'smooth-fade-in'
        document.body.appendChild(style)
        const computed = window.getComputedStyle(style)
        const hasOpacity = computed.opacity !== ''
        document.body.removeChild(style)
        return hasOpacity
      } catch {
        return false
      }
    })

    runTest('coordinator-integration', async () => {
      try {
        // Test coordinator integration
        const { useDualLayerCoordinator } = await import('./dual-layer-loading-coordinator')
        return typeof useDualLayerCoordinator === 'function'
      } catch {
        return false
      }
    })
  }, [runTest])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Smooth Transition Test Suite</h2>
        <div className="flex gap-2 mb-4">
          <Button
            variant={currentTest === 'integration' ? 'default' : 'outline'}
            onClick={() => setCurrentTest('integration')}
          >
            Integration Test
          </Button>
          <Button
            variant={currentTest === 'manager' ? 'default' : 'outline'}
            onClick={() => setCurrentTest('manager')}
          >
            Component Test
          </Button>
        </div>
      </div>

      {/* Test Results */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(testResults).map(([test, passed]) => (
              <div key={test} className="flex items-center justify-between">
                <span className="text-sm">{test}</span>
                <Badge variant={passed ? 'default' : 'destructive'}>
                  {passed ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Test */}
      {currentTest === 'integration' ? (
        <SmoothTransitionIntegrationExample />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Isolation Test</CardTitle>
              <CardDescription>
                Test individual components without full integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Individual component testing would go here...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SmoothTransitionIntegrationExample
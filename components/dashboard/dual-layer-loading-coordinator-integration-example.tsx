'use client'

import React, { useState, useEffect } from 'react'
import { 
  DualLayerLoadingCoordinator,
  UserManagementDualLayerCoordinator,
  EventDrivenDualLayerCoordinator,
  DatabaseOperationType,
  DualLayerCoordinatorState,
  CoordinatorConfig,
  PerformanceMetrics
} from './dual-layer-loading-coordinator'
import { UserOperationModalState } from './user-operation-modal-overlay'
import { LoadingPriority } from '@/components/ui/loading-states'
import UserManagement from './user-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  Users, 
  Search, 
  Plus, 
  Download,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'

/**
 * DualLayerLoadingCoordinator Integration Examples
 * 
 * This file demonstrates how to integrate the DualLayerLoadingCoordinator
 * with the existing UserManagement component using different integration patterns.
 */

// ====================
// MOCK DATA FOR DEMONSTRATION
// ====================

interface MockUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'user' | 'admin'
}

const MOCK_USERS: MockUser[] = [
  { id: '1', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: 'admin' },
  { id: '2', email: 'john.doe@example.com', first_name: 'John', last_name: 'Doe', role: 'user' },
  { id: '3', email: 'jane.smith@example.com', first_name: 'Jane', last_name: 'Smith', role: 'user' },
  { id: '4', email: 'bob.johnson@example.com', first_name: 'Bob', last_name: 'Johnson', role: 'user' },
]

// ====================
// EXAMPLE 1: BASIC INTEGRATION WITH EVENT-DRIVEN COORDINATOR
// ====================

export function BasicIntegrationExample() {
  const [users, setUsers] = useState<MockUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentOperation, setCurrentOperation] = useState<string>('Ready')

  // Simulate data fetching with coordinator events
  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    setCurrentOperation('Fetching users...')

    // Dispatch event to start coordinator
    window.dispatchEvent(new CustomEvent('user-operation-start', {
      detail: {
        operationType: DatabaseOperationType.FETCH_USERS,
        priority: LoadingPriority.HIGH,
        customMessage: 'Loading user data...',
        customDescription: 'Retrieving user information from database'
      }
    }))

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUsers(MOCK_USERS)
      setCurrentOperation('Users loaded successfully')
      
      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('user-operation-complete'))
      
    } catch (err) {
      const error = new Error('Failed to fetch users')
      setError(error)
      setCurrentOperation('Error loading users')
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('user-operation-error', {
        detail: { error }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const createUser = async () => {
    setCurrentOperation('Creating new user...')
    
    window.dispatchEvent(new CustomEvent('user-operation-start', {
      detail: {
        operationType: DatabaseOperationType.CREATE_USER,
        priority: LoadingPriority.HIGH,
        customMessage: 'Creating user account...',
        customDescription: 'Setting up new user profile and permissions'
      }
    }))

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newUser: MockUser = {
        id: Date.now().toString(),
        email: 'new.user@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'user'
      }
      
      setUsers(prev => [...prev, newUser])
      setCurrentOperation('User created successfully')
      
      window.dispatchEvent(new CustomEvent('user-operation-complete'))
      
    } catch (err) {
      const error = new Error('Failed to create user')
      setError(error)
      setCurrentOperation('Error creating user')
      
      window.dispatchEvent(new CustomEvent('user-operation-error', {
        detail: { error }
      }))
    }
  }

  const searchUsers = async () => {
    setCurrentOperation('Searching users...')
    
    window.dispatchEvent(new CustomEvent('user-search-start'))

    try {
      // Simulate search
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCurrentOperation('Search completed')
      window.dispatchEvent(new CustomEvent('user-search-complete'))
      
    } catch (err) {
      const error = new Error('Search failed')
      setError(error)
      setCurrentOperation('Search failed')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Integration Example</CardTitle>
          <CardDescription>
            Demonstrates basic event-driven integration with the dual-layer coordinator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchUsers} disabled={isLoading}>
              <Database className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Load Users'}
            </Button>
            <Button onClick={createUser} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button onClick={searchUsers} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Users
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">Current: {currentOperation}</Badge>
            <Badge variant={error ? 'destructive' : 'default'}>
              {error ? 'Error' : 'Ready'}
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dual Layer Coordinator with actual user management */}
      {/* TODO: Fix EventDrivenDualLayerCoordinator type compatibility */}
      {/* <EventDrivenDualLayerCoordinator */}
      {/*   integrationMode="event-driven"
        onStateChange={(state) => {
          console.log('Coordinator state changed:', state.currentState)
        }}
        onError={(error) => {
          console.error('Coordinator error:', error)
          setError(error)
        }}
        onOperationComplete={() => {
          console.log('Operation completed')
        }}
        className="min-h-[600px]"
        enableMetrics={true}
        onMetricsUpdate={(metrics) => {
          console.log('Performance metrics:', metrics)
        }}
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current users: {users.length}
          </div>
          
          {users.length > 0 ? (
            <div className="grid gap-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users loaded. Click "Load Users" to fetch data.</p>
            </div>
          )}
        </div>
      </EventDrivenDualLayerCoordinator> */}
      <div className="min-h-[600px] border-2 border-dashed border-muted rounded-lg p-8">
        <div className="text-center text-muted-foreground">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Coordinator Demo Placeholder</p>
          <p className="text-sm">Event-driven coordinator temporarily disabled for build compatibility</p>
        </div>
        <div className="mt-6 space-y-4">
          <div className="text-sm text-muted-foreground">
            Current users: {users.length}
          </div>
          
          {users.length > 0 && (
            <div className="grid gap-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ====================
// EXAMPLE 2: MANUAL COORDINATOR WITH tRPC INTEGRATION
// ====================

export function TRPCIntegrationExample() {
  const [coordinatorState, setCoordinatorState] = useState<DualLayerCoordinatorState | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [users, setUsers] = useState<MockUser[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Custom hooks for coordinator and data
  const [coordinator, setCoordinator] = useState<any>(null)
  const [isDataReady, setIsDataReady] = useState(false)

  useEffect(() => {
    // Simulate initialization
    const initCoordinator = async () => {
      setCoordinatorState(DualLayerCoordinatorState.INITIALIZING)
      
      // Simulate coordinator initialization
      await new Promise(resolve => setTimeout(resolve, 100))
      setCoordinatorState(DualLayerCoordinatorState.LOADING_DATA)
      
      // Start data loading
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUsers(MOCK_USERS)
      setCoordinatorState(DualLayerCoordinatorState.READY)
      setIsDataReady(true)
      setIsInitialized(true)
    }

    initCoordinator()
  }, [])

  const simulateOperation = async (operationType: DatabaseOperationType) => {
    if (!isInitialized) return

    setCoordinatorState(DualLayerCoordinatorState.UPDATING)
    
    // Simulate operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setCoordinatorState(DualLayerCoordinatorState.READY)
  }

  const handleStateChange = (state: any) => {
    setCoordinatorState(state.currentState)
    setMetrics(state.metrics)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>tRPC Integration Example</CardTitle>
          <CardDescription>
            Demonstrates manual coordinator integration with tRPC-like data fetching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Coordinator State</h4>
              <Badge variant="outline">{coordinatorState || 'Not initialized'}</Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Status</h4>
              <Badge variant={isDataReady ? 'default' : 'secondary'}>
                {isDataReady ? 'Ready' : 'Loading'}
              </Badge>
            </div>
          </div>

          {metrics && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>Phase 1: {metrics.phase1Time}ms</div>
              <div>Phase 2: {metrics.phase2Time}ms</div>
              <div>Total: {metrics.totalLoadTime}ms</div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => simulateOperation(DatabaseOperationType.CREATE_USER)}
              disabled={!isInitialized || coordinatorState === DualLayerCoordinatorState.UPDATING}
            >
              Create User
            </Button>
            <Button 
              onClick={() => simulateOperation(DatabaseOperationType.UPDATE_USER)}
              variant="outline"
              disabled={!isInitialized || coordinatorState === DualLayerCoordinatorState.UPDATING}
            >
              Update User
            </Button>
            <Button 
              onClick={() => simulateOperation(DatabaseOperationType.DELETE_USER)}
              variant="outline"
              disabled={!isInitialized || coordinatorState === DualLayerCoordinatorState.UPDATING}
            >
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual coordinator integration */}
      <DualLayerLoadingCoordinator
        enableAutoStart={true}
        integrationMode="manual"
        onStateChange={handleStateChange}
        onOperationComplete={() => {
          console.log('Manual operation completed')
        }}
        enableMetrics={true}
        onMetricsUpdate={setMetrics}
        config={{
          initialLoadDelay: 50,
          dataReadyThreshold: 200,
          debugMode: true
        }}
        className="min-h-[400px]"
      >
        <div className="space-y-4">
          {isDataReady ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Management</h3>
                <Badge variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Data Ready
                </Badge>
              </div>
              
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Initializing coordinator...</p>
            </div>
          )}
        </div>
      </DualLayerLoadingCoordinator>
    </div>
  )
}

// ====================
// EXAMPLE 3: ADVANCED CONFIGURATION EXAMPLE
// ====================

export function AdvancedConfigurationExample() {
  const [customConfig, setCustomConfig] = useState<Partial<CoordinatorConfig>>({
    initialLoadDelay: 100,
    dataReadyThreshold: 300,
    skeletonFadeOutDuration: 400,
    modalFadeOutDuration: 350,
    debugMode: true,
    enablePerformanceMonitoring: true
  })

  const [users, setUsers] = useState<MockUser[]>([])
  const [operationLog, setOperationLog] = useState<string[]>([])

  const addToLog = (message: string) => {
    setOperationLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)])
  }

  const simulateComplexOperation = async () => {
    addToLog('Starting complex multi-phase operation')

    // Phase 1: Search
    window.dispatchEvent(new CustomEvent('user-operation-start', {
      detail: {
        operationType: DatabaseOperationType.SEARCH_USERS,
        priority: LoadingPriority.MEDIUM,
        customMessage: 'Searching users...',
        customDescription: 'Finding users matching criteria'
      }
    }))

    await new Promise(resolve => setTimeout(resolve, 800))
    addToLog('Search completed')

    // Phase 2: Export
    window.dispatchEvent(new CustomEvent('user-operation-start', {
      detail: {
        operationType: DatabaseOperationType.EXPORT_DATA,
        priority: LoadingPriority.LOW,
        customMessage: 'Exporting data...',
        customDescription: 'Generating export file',
        showProgress: true,
        progress: { current: 0, total: 100, label: 'Export Progress' }
      }
    }))

    // Simulate progress
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 200))
      addToLog(`Export progress: ${i}%`)
    }

    addToLog('Export completed')
    window.dispatchEvent(new CustomEvent('user-operation-complete'))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Configuration Example</CardTitle>
          <CardDescription>
            Demonstrates advanced coordinator configuration and complex operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Configuration</h4>
              <div className="space-y-2 text-sm">
                <div>Initial Delay: {customConfig.initialLoadDelay}ms</div>
                <div>Data Threshold: {customConfig.dataReadyThreshold}ms</div>
                <div>Skeleton Fade: {customConfig.skeletonFadeOutDuration}ms</div>
                <div>Modal Fade: {customConfig.modalFadeOutDuration}ms</div>
                <div>Debug Mode: {customConfig.debugMode ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Operation Log</h4>
              <div className="h-32 overflow-y-auto text-xs space-y-1 bg-muted p-2 rounded">
                {operationLog.length > 0 ? (
                  operationLog.map((entry, index) => (
                    <div key={index} className="font-mono">{entry}</div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No operations yet</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={simulateComplexOperation}>
              <Activity className="h-4 w-4 mr-2" />
              Complex Operation
            </Button>
            <Button onClick={() => setOperationLog([])} variant="outline">
              Clear Log
            </Button>
          </div>
        </CardContent>
      </Card>

      <DualLayerLoadingCoordinator
        enableAutoStart={true}
        integrationMode="event-driven"
        config={customConfig}
        onStateChange={(state) => {
          addToLog(`State: ${state}`)
        }}
        onError={(error) => {
          addToLog(`Error: ${error.message}`)
        }}
        onOperationComplete={() => {
          addToLog('Operation completed')
        }}
        enableMetrics={true}
        onMetricsUpdate={(metrics) => {
          if (metrics.totalLoadTime > 500) {
            addToLog(`Slow load detected: ${metrics.totalLoadTime}ms`)
          }
        }}
        className="min-h-[500px]"
      >
        <div className="text-center py-12">
          <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Advanced Coordinator Demo</h3>
          <p className="text-muted-foreground">
            Click "Complex Operation" to see multi-phase loading coordination
          </p>
          
          {users.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Loaded Users ({users.length})</h4>
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-center gap-2 text-sm">
                    <span>{user.first_name} {user.last_name}</span>
                    <Badge variant="outline" className="text-xs">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DualLayerLoadingCoordinator>
    </div>
  )
}

// ====================
// MAIN DEMONSTRATION COMPONENT
// ====================

export default function DualLayerCoordinatorIntegrationDemo() {
  const [activeExample, setActiveExample] = useState<'basic' | 'trpc' | 'advanced'>('basic')

  const examples = [
    {
      id: 'basic' as const,
      title: 'Basic Integration',
      description: 'Event-driven coordination with UserManagement',
      component: BasicIntegrationExample,
      icon: Users
    },
    {
      id: 'trpc' as const,
      title: 'tRPC Integration',
      description: 'Manual coordination with data fetching',
      component: TRPCIntegrationExample,
      icon: Database
    },
    {
      id: 'advanced' as const,
      title: 'Advanced Configuration',
      description: 'Complex operations and performance monitoring',
      component: AdvancedConfigurationExample,
      icon: Activity
    }
  ]

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || BasicIntegrationExample

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">DualLayerLoadingCoordinator Integration Examples</h1>
        <p className="text-muted-foreground max-w-3xl">
          Comprehensive examples showing how to integrate the DualLayerLoadingCoordinator
          with existing components using different patterns and configurations.
        </p>
      </div>

      {/* Example selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            {examples.map((example) => {
              const Icon = example.icon
              return (
                <Button
                  key={example.id}
                  variant={activeExample === example.id ? 'default' : 'outline'}
                  onClick={() => setActiveExample(example.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {example.title}
                </Button>
              )
            })}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {examples.find(ex => ex.id === activeExample)?.description}
          </div>
        </CardContent>
      </Card>

      {/* Active example */}
      <ActiveComponent />

      {/* Usage guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-green-600">Event-Driven (Recommended)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Minimal code changes required</li>
                <li>• Dispatch events for operations</li>
                <li>• Automatic coordination</li>
                <li>• Best for existing components</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-blue-600">Manual Control</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full control over states</li>
                <li>• Custom data flow</li>
                <li>• Advanced configurations</li>
                <li>• Complex operation handling</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-purple-600">tRPC Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hook-based data fetching</li>
                <li>• Automatic cache coordination</li>
                <li>• Error handling integration</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
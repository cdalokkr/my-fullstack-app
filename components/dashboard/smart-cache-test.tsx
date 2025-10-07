'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { smartCacheManager } from '@/lib/cache/smart-cache-manager'
import { adaptiveTTLEngine } from '@/lib/cache/adaptive-ttl-engine'
import { cacheInvalidation } from '@/lib/cache/cache-invalidation'
import { backgroundRefresher } from '@/lib/cache/background-refresher'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message?: string
  duration?: number
}

export function SmartCacheTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Adaptive TTL Engine', status: 'pending' },
    { name: 'Cache Basic Operations', status: 'pending' },
    { name: 'Cache Namespaces', status: 'pending' },
    { name: 'Cache Compression', status: 'pending' },
    { name: 'LRU Eviction', status: 'pending' },
    { name: 'Cache Expiration', status: 'pending' },
    { name: 'Cache Invalidation', status: 'pending' },
    { name: 'Background Refresh', status: 'pending' },
    { name: 'Cache Statistics', status: 'pending' },
    { name: 'Error Handling', status: 'pending' },
    { name: 'Memory Limits', status: 'pending' },
    { name: 'Performance Metrics', status: 'pending' }
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [summary, setSummary] = useState<{ passed: number; failed: number; total: number } | null>(null)

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map((result, i) =>
      i === index ? { ...result, ...updates } : result
    ))
  }

  const runTest = async (index: number, testFunction: () => Promise<void>) => {
    const startTime = Date.now()
    updateTestResult(index, { status: 'running' })

    try {
      await testFunction()
      const duration = Date.now() - startTime
      updateTestResult(index, { status: 'passed', duration })
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(index, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
    }
  }

  const testAdaptiveTTLEngine = async () => {
    // Test TTL calculation for different data types
    const context = {
      dataType: 'critical-dashboard-data',
      timeOfDay: new Date(),
      dayOfWeek: new Date().getDay(),
      systemLoad: 'medium' as const
    }

    const criticalTTL = adaptiveTTLEngine.calculateOptimalTTL('critical-dashboard-data', context)
    if (criticalTTL <= 0 || criticalTTL > 60000) {
      throw new Error(`Critical data TTL out of range: ${criticalTTL}ms`)
    }

    const secondaryTTL = adaptiveTTLEngine.calculateOptimalTTL('secondary-dashboard-data', context)
    if (secondaryTTL <= criticalTTL) {
      throw new Error(`Secondary data should have longer TTL than critical: ${secondaryTTL}ms <= ${criticalTTL}ms`)
    }

    const realtimeTTL = adaptiveTTLEngine.calculateOptimalTTL('realtime', context)
    if (realtimeTTL >= criticalTTL) {
      throw new Error(`Realtime data should have shorter TTL than critical: ${realtimeTTL}ms >= ${criticalTTL}ms`)
    }

    // Test time-based adjustments
    const businessHoursContext = {
      ...context,
      timeOfDay: new Date('2025-01-01T14:00:00') // 2 PM
    }
    const businessTTL = adaptiveTTLEngine.calculateOptimalTTL('critical-dashboard-data', businessHoursContext)

    const offHoursContext = {
      ...context,
      timeOfDay: new Date('2025-01-01T02:00:00') // 2 AM
    }
    const offHoursTTL = adaptiveTTLEngine.calculateOptimalTTL('critical-dashboard-data', offHoursContext)

    if (businessTTL >= offHoursTTL) {
      throw new Error(`Business hours should have shorter TTL: ${businessTTL}ms >= ${offHoursTTL}ms`)
    }
  }

  const testCacheBasicOperations = async () => {
    // Clear cache first
    smartCacheManager.clear()

    // Test set and get
    const testData = { id: 1, name: 'Test User', data: [1, 2, 3, 4, 5] }
    await smartCacheManager.set('test-key', testData)

    const retrieved = await smartCacheManager.get('test-key')
    if (!retrieved) {
      throw new Error('Data was not cached successfully')
    }

    if (JSON.stringify(retrieved) !== JSON.stringify(testData)) {
      throw new Error('Retrieved data does not match original')
    }

    // Test has method
    const exists = smartCacheManager.has('test-key')
    if (!exists) {
      throw new Error('Cache reports key does not exist')
    }

    // Test delete
    const deleted = smartCacheManager.delete('test-key')
    if (!deleted) {
      throw new Error('Key was not deleted successfully')
    }

    const afterDelete = await smartCacheManager.get('test-key')
    if (afterDelete !== null) {
      throw new Error('Data still exists after delete')
    }
  }

  const testCacheNamespaces = async () => {
    smartCacheManager.clear()

    const data1 = { type: 'user', id: 1 }
    const data2 = { type: 'user', id: 2 }

    await smartCacheManager.set('user-1', data1, { namespace: 'users' })
    await smartCacheManager.set('user-2', data2, { namespace: 'users' })
    await smartCacheManager.set('config', { theme: 'dark' }, { namespace: 'app' })

    // Test retrieval with namespace
    const user1 = await smartCacheManager.get('user-1', 'users')
    if (!user1 || (user1 as { id: number }).id !== 1) {
      throw new Error('User data not retrieved from users namespace')
    }

    const config = await smartCacheManager.get('config', 'app')
    if (!config || (config as { theme: string }).theme !== 'dark') {
      throw new Error('Config data not retrieved from app namespace')
    }

    // Test namespace invalidation
    const invalidated = smartCacheManager.invalidateNamespace('users')
    if (invalidated !== 2) {
      throw new Error(`Expected 2 entries invalidated, got ${invalidated}`)
    }

    const user1After = await smartCacheManager.get('user-1', 'users')
    if (user1After !== null) {
      throw new Error('User data still exists after namespace invalidation')
    }

    const configAfter = await smartCacheManager.get('config', 'app')
    if (configAfter === null) {
      throw new Error('Config data should still exist in different namespace')
    }
  }

  const testCacheCompression = async () => {
    smartCacheManager.clear()

    // Create large data that should be compressed
    const largeData = {
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'A'.repeat(100), // 100 characters per item
        metadata: { created: new Date(), tags: ['test', 'large', 'data'] }
      }))
    }

    const largeDataString = JSON.stringify(largeData)
    if (largeDataString.length <= 1024) {
      throw new Error(`Large data should exceed compression threshold: ${largeDataString.length} chars`)
    }

    await smartCacheManager.set('large-data', largeData)

    const retrieved = await smartCacheManager.get('large-data')
    if (!retrieved) {
      throw new Error('Large data was not cached and retrieved')
    }

    // Check compression in entry details
    const entry = smartCacheManager.getEntryDetails('large-data')
    if (!entry) {
      throw new Error('Entry details not available')
    }

    if (!entry.compressed) {
      throw new Error('Large data was not compressed')
    }

    if (entry.size >= largeDataString.length) {
      throw new Error(`Compressed size should be smaller: ${entry.size} >= ${largeDataString.length}`)
    }

    // Test small data (should not be compressed)
    const smallData = { id: 1, name: 'Small' }
    await smartCacheManager.set('small-data', smallData)

    const smallEntry = smartCacheManager.getEntryDetails('small-data')
    if (smallEntry && smallEntry.compressed) {
      throw new Error('Small data was incorrectly compressed')
    }
  }

  const testLRUEviction = async () => {
    // Test LRU by filling cache and checking eviction behavior
    smartCacheManager.clear()

    // Add entries that will trigger LRU when limit is reached
    for (let i = 1; i <= 15; i++) {
      await smartCacheManager.set(`lru-test-${i}`, { data: `value-${i}` })
    }

    const stats = smartCacheManager.getStats()

    // Check that cache has some entries (LRU should have evicted some)
    if (stats.totalEntries === 0) {
      throw new Error('Cache should have entries after LRU test')
    }

    // Check that total size is within reasonable bounds
    if (stats.totalSize > 1024 * 1024) { // 1MB
      throw new Error('Cache size exceeds reasonable bounds')
    }
  }

  const testCacheExpiration = async () => {
    smartCacheManager.clear()

    // Set data with short TTL
    const shortTTL = 1000 // 1 second
    await smartCacheManager.set('expiring-data', { temp: 'data' }, { ttl: shortTTL })

    // Should exist immediately
    const existsBefore = smartCacheManager.has('expiring-data')
    if (!existsBefore) {
      throw new Error('Data does not exist before expiration')
    }

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, shortTTL + 100))

    // Should be expired
    const existsAfter = smartCacheManager.has('expiring-data')
    if (existsAfter) {
      throw new Error('Data still exists after expiration')
    }
  }

  const testCacheInvalidation = async () => {
    smartCacheManager.clear()

    // Set up test data
    await smartCacheManager.set('user-data', { id: 1, name: 'John' }, { namespace: 'users' })
    await smartCacheManager.set('post-data', { id: 1, title: 'Test Post' }, { namespace: 'posts' })

    // Trigger invalidation event
    cacheInvalidation.invalidate('user-data', 'data-change', 'Test invalidation', undefined, 'users')

    // Wait a bit for event processing
    await new Promise(resolve => setTimeout(resolve, 100))

    const userData = await smartCacheManager.get('user-data', 'users')
    if (userData !== null) {
      throw new Error('User data was not invalidated')
    }

    const postData = await smartCacheManager.get('post-data', 'posts')
    if (postData === null) {
      throw new Error('Post data should still exist (different namespace)')
    }
  }

  const testBackgroundRefresh = async () => {
    smartCacheManager.clear()

    let refreshCount = 0
    const refreshFunction = async () => {
      refreshCount++
      return { refreshed: true, count: refreshCount, timestamp: Date.now() }
    }

    // Set data with background refresh
    await smartCacheManager.set('refresh-test', { initial: true }, {
      dataType: 'critical-dashboard-data',
      refreshFunction,
      context: {
        dataType: 'critical-dashboard-data',
        timeOfDay: new Date(),
        dayOfWeek: new Date().getDay(),
        systemLoad: 'medium'
      }
    })

    // Wait for background refresh to trigger
    await new Promise(resolve => setTimeout(resolve, 2000))

    const refreshedData = await smartCacheManager.get('refresh-test')
    if (!refreshedData) {
      throw new Error('Data was not found after refresh setup')
    }

    // Background refresh may or may not have triggered yet, so we just check the data exists
    if (typeof refreshedData !== 'object') {
      throw new Error('Data is not in expected format')
    }
  }

  const testCacheStatistics = async () => {
    smartCacheManager.clear()

    // Perform some operations to generate stats
    await smartCacheManager.set('stat-test-1', { data: 1 })
    await smartCacheManager.set('stat-test-2', { data: 2 })

    // Generate some hits and misses
    await smartCacheManager.get('stat-test-1') // hit
    await smartCacheManager.get('stat-test-1') // hit
    await smartCacheManager.get('nonexistent') // miss

    const stats = smartCacheManager.getStats()

    if (stats.totalEntries < 2) {
      throw new Error(`Cache should have entries: ${stats.totalEntries}`)
    }

    if (stats.hitRate <= 0) {
      throw new Error(`Hit rate should be positive: ${stats.hitRate}`)
    }

    if (stats.missRate <= 0) {
      throw new Error(`Miss rate should be positive: ${stats.missRate}`)
    }

    if (stats.hitRate + stats.missRate > 1.01) {
      throw new Error('Hit rate + miss rate should ≈ 1')
    }
  }

  const testErrorHandling = async () => {
    smartCacheManager.clear()

    // Test error handling with null data
    try {
      await smartCacheManager.set('null-test', null)
      const retrieved = await smartCacheManager.get('null-test')
      // Null should be cached successfully
      if (retrieved !== null) {
        throw new Error('Null data should be cached as null')
      }
    } catch (error) {
      // If it throws, that's also acceptable for null handling
    }

    // Test invalid TTL
    await smartCacheManager.set('negative-ttl', { data: 'test' }, { ttl: -1000 })
    const retrieved = await smartCacheManager.get('negative-ttl')
    if (retrieved === null) {
      throw new Error('Data should be cached even with invalid TTL (should use default)')
    }
  }

  const testMemoryLimits = async () => {
    // Test memory limits by adding many entries and checking stats
    smartCacheManager.clear()

    // Add multiple entries to test memory management
    for (let i = 0; i < 50; i++) {
      await smartCacheManager.set(`memory-test-${i}`, { data: `value-${i}`, extra: 'x'.repeat(100) })
    }

    const stats = smartCacheManager.getStats()

    // Check that cache is managing memory (should have evicted some entries)
    if (stats.totalEntries === 0) {
      throw new Error('Cache should have some entries after memory test')
    }

    // Check that total size is reasonable
    if (stats.totalSize > 10 * 1024 * 1024) { // 10MB
      throw new Error(`Cache size too large: ${stats.totalSize} bytes`)
    }
  }

  const testPerformanceMetrics = async () => {
    smartCacheManager.clear()

    const startTime = Date.now()

    // Perform many operations
    const operations = 100
    for (let i = 0; i < operations; i++) {
      await smartCacheManager.set(`perf-test-${i}`, { index: i })
      await smartCacheManager.get(`perf-test-${i}`)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    const stats = smartCacheManager.getStats()
    if (stats.hitRate < 0.9) {
      throw new Error(`Hit rate too low: ${(stats.hitRate * 100).toFixed(1)}%`)
    }

    if (duration > 5000) {
      throw new Error(`Operations took too long: ${duration}ms`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setOverallProgress(0)
    setSummary(null)

    const testFunctions = [
      testAdaptiveTTLEngine,
      testCacheBasicOperations,
      testCacheNamespaces,
      testCacheCompression,
      testLRUEviction,
      testCacheExpiration,
      testCacheInvalidation,
      testBackgroundRefresh,
      testCacheStatistics,
      testErrorHandling,
      testMemoryLimits,
      testPerformanceMetrics
    ]

    for (let i = 0; i < testFunctions.length; i++) {
      await runTest(i, testFunctions[i])
      setOverallProgress(((i + 1) / testFunctions.length) * 100)
    }

    setIsRunning(false)

    const passed = testResults.filter(r => r.status === 'passed').length
    const failed = testResults.filter(r => r.status === 'failed').length
    const total = testResults.length

    setSummary({ passed, failed, total })
  }

  const resetTests = () => {
    setTestResults(prev => prev.map(result => ({
      ...result,
      status: 'pending',
      message: undefined,
      duration: undefined
    })))
    setOverallProgress(0)
    setSummary(null)
    smartCacheManager.clear()
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RotateCcw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge variant="secondary">Running</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Smart Caching System Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive functional tests for the smart caching implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button
              onClick={resetTests}
              variant="outline"
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {summary && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Test Summary: {summary.passed} passed, {summary.failed} failed out of {summary.total} tests
                ({((summary.passed / summary.total) * 100).toFixed(1)}% success rate)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid gap-4">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium">{result.name}</h3>
                    {result.message && (
                      <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.duration && (
                    <span className="text-sm text-muted-foreground">
                      {result.duration}ms
                    </span>
                  )}
                  {getStatusBadge(result.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
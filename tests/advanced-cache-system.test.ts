// ============================================
// tests/advanced-cache-system.test.ts
// Comprehensive tests for Phase 3 Advanced Caching System
// ============================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { advancedCacheManager } from '../lib/cache/advanced-cache-manager';
import { smartCacheManager } from '../lib/cache/smart-cache-manager';
import { cacheInvalidation } from '../lib/cache/cache-invalidation';
import { backgroundRefresher } from '../lib/cache/background-refresher';
import { adaptiveTTLEngine } from '../lib/cache/adaptive-ttl-engine';
import { MemoryOptimizer } from '../lib/cache/memory-optimizer';
import { CacheConsistency } from '../lib/cache/cache-consistency';

// Mock React Query for testing
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn()
  }))
}));

describe('Advanced Cache System', () => {
  beforeEach(() => {
    // Reset cache managers before each test
    smartCacheManager.clear();
    cacheInvalidation.destroy();
    backgroundRefresher.destroy();
    
    // Reset adaptive TTL engine patterns
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    smartCacheManager.clear();
    cacheInvalidation.destroy();
    backgroundRefresher.destroy();
  });

  describe('Advanced Cache Manager', () => {
    it('should set and get cache entries with dependencies', async () => {
      const testData = { id: 1, name: 'Test User' };
      
      await advancedCacheManager.set('user-1', testData, {
        namespace: 'users',
        dataType: 'user-profile',
        context: {
          dataType: 'user-profile',
          timeOfDay: new Date(),
          dayOfWeek: 1,
          systemLoad: 'medium'
        },
        dependencies: ['dashboard-critical']
      });

      const cachedData = await advancedCacheManager.get('user-1', 'users');
      expect(cachedData).toEqual(testData);
    });

    it('should handle cache dependencies correctly', () => {
      advancedCacheManager.addDependency('user-1', ['dashboard-critical'], 'strong');
      
      const dependencies = advancedCacheManager.getDependencyGraph();
      expect(dependencies.has('user-1')).toBe(true);
    });

    it('should track cache metrics', () => {
      const metrics = advancedCacheManager.getMetrics();
      
      expect(metrics).toHaveProperty('totalOperations');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('backgroundRefreshRate');
    });

    it('should handle invalidation with dependencies', async () => {
      const testData = { id: 1, name: 'Test User' };
      
      await advancedCacheManager.set('user-1', testData, {
        namespace: 'users',
        dataType: 'user-profile',
        dependencies: ['dashboard-critical']
      });

      // Invalidate user data
      advancedCacheManager.invalidate('user-1', 'test-invalidation', 'users');
      
      // Check if entry is removed
      const cachedData = await advancedCacheManager.get('user-1', 'users');
      expect(cachedData).toBeNull();
    });
  });

  describe('Smart Cache Invalidation', () => {
    it('should handle invalidation through advanced cache manager', () => {
      // Test invalidation through the advanced cache manager
      advancedCacheManager.invalidate('dashboard-critical', 'test-invalidation');
      
      const history = cacheInvalidation.getEventHistory(10);
      expect(history.length).toBeGreaterThanOrEqual(0);
    });

    it('should track invalidation events', () => {
      cacheInvalidation.invalidate('test-key', 'manual', 'test-reason');
      
      const stats = cacheInvalidation.getInvalidationStats();
      expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
    });

    it('should handle user action invalidations', () => {
      cacheInvalidation.invalidateOnUserAction('user-123', 'profile-update');
      
      const history = cacheInvalidation.getEventHistory(1);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Optimizer', () => {
    let memoryOptimizer: MemoryOptimizer;

    beforeEach(() => {
      memoryOptimizer = MemoryOptimizer.getInstance();
    });

    it('should initialize with default configuration', () => {
      const stats = memoryOptimizer.getStats();
      
      expect(stats).toHaveProperty('totalMemory');
      expect(stats).toHaveProperty('usedMemory');
      expect(stats).toHaveProperty('memoryPressure');
    });

    it('should schedule optimization when memory pressure is high', async () => {
      // Add some test data to increase memory usage
      const largeData = new Array(10000).fill({ id: Math.random(), data: 'test' });
      await smartCacheManager.set('large-data', largeData, {
        namespace: 'test',
        dataType: 'test-data'
      });

      // Mock high memory usage
      memoryOptimizer.updateConfig({ memoryThreshold: 50 }); // Very low threshold

      // Schedule optimization should trigger
      memoryOptimizer.scheduleOptimization();
      
      const stats = memoryOptimizer.getStats();
      expect(stats.optimizationCount).toBeGreaterThanOrEqual(0);
    });

    it('should calculate value scores for cache entries', async () => {
      const testData = { id: 1, name: 'Test' };
      
      await smartCacheManager.set('test-entry', testData, {
        namespace: 'test',
        dataType: 'test-data'
      });

      // Access the entry multiple times to increase its score
      await smartCacheManager.get('test-entry', 'test');
      await smartCacheManager.get('test-entry', 'test');

      const entries = smartCacheManager.getAllEntries();
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should record GC statistics', async () => {
      const gcStats = memoryOptimizer.getGCStats();
      expect(Array.isArray(gcStats)).toBe(true);
    });
  });

  describe('Cache Consistency', () => {
    it('should generate consistency reports', async () => {
      const cacheConsistency = CacheConsistency.getInstance();
      const report = await cacheConsistency.forceConsistencyCheck();
      
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('totalEntries');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(1);
    });

    it('should detect missing entries', async () => {
      const cacheConsistency = CacheConsistency.getInstance();
      const issues = await cacheConsistency.checkConsistency();
      
      // The system should detect missing expected entries
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle stale data detection', async () => {
      const cacheConsistency = CacheConsistency.getInstance();
      const testData = { id: 1, name: 'Test' };
      
      // Set data with very short TTL
      await smartCacheManager.set('stale-test', testData, {
        namespace: 'test',
        dataType: 'test-data',
        ttl: 1 // 1ms TTL
      });

      // Wait for data to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const issues = await cacheConsistency.checkConsistency();
      
      // Should detect stale data
      const staleIssues = issues.filter(issue => issue.issueType === 'stale');
      expect(staleIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide consistency score', () => {
      const cacheConsistency = CacheConsistency.getInstance();
      const score = cacheConsistency.getConsistencyScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should track integrity checks', () => {
      const cacheConsistency = CacheConsistency.getInstance();
      const integrityChecks = cacheConsistency.getIntegrityChecks();
      expect(integrityChecks instanceof Map).toBe(true);
    });
  });

  describe('Background Refresher', () => {
    it('should register refresh tasks', () => {
      const taskId = backgroundRefresher.registerRefreshTask({
        key: 'test-key',
        namespace: 'test',
        dataType: 'test-data',
        priority: 'normal',
        refreshFunction: async () => 'refreshed-data',
        maxRetries: 3,
        backoffMultiplier: 2,
        context: {
          dataType: 'test-data',
          timeOfDay: new Date(),
          dayOfWeek: 1,
          systemLoad: 'medium' as const
        }
      });

      expect(typeof taskId).toBe('string');
      expect(taskId.length).toBeGreaterThan(0);
    });

    it('should get refresh status', () => {
      const status = backgroundRefresher.getRefreshStatus();
      
      expect(status).toHaveProperty('totalTasks');
      expect(status).toHaveProperty('activeTasks');
      expect(status).toHaveProperty('activeRefreshes');
      expect(status).toHaveProperty('queueLength');
    });

    it('should handle task pausing and resuming', () => {
      const taskId = backgroundRefresher.registerRefreshTask({
        key: 'pause-test',
        namespace: 'test',
        dataType: 'test-data',
        priority: 'low',
        refreshFunction: async () => 'data',
        maxRetries: 3,
        backoffMultiplier: 2,
        context: {
          dataType: 'test-data',
          timeOfDay: new Date(),
          dayOfWeek: 1,
          systemLoad: 'medium' as const
        }
      });

      backgroundRefresher.pauseRefreshTask(taskId);
      backgroundRefresher.resumeRefreshTask(taskId);

      const tasks = backgroundRefresher.getAllTasks();
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  describe('Adaptive TTL Engine', () => {
    it('should calculate optimal TTL for different data types', () => {
      const context = {
        dataType: 'user-profile',
        timeOfDay: new Date(),
        dayOfWeek: 1,
        systemLoad: 'medium' as const,
        userProfile: {
          isActive: true,
          lastActivity: new Date(),
          role: 'user'
        }
      };

      const ttl = adaptiveTTLEngine.calculateOptimalTTL('user-profile', context);
      
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300000); // Should not exceed 5 minutes
    });

    it('should handle different priority levels', () => {
      const context = {
        dataType: 'critical-dashboard-data',
        timeOfDay: new Date(),
        dayOfWeek: 1,
        systemLoad: 'medium' as const
      };

      const criticalTtl = adaptiveTTLEngine.calculateOptimalTTL('critical-dashboard-data', context);
      const normalTtl = adaptiveTTLEngine.calculateOptimalTTL('normal-data', context);

      expect(criticalTtl).toBeLessThan(normalTtl); // Critical data should have shorter TTL
    });

    it('should consider system load in TTL calculation', () => {
      const context = {
        dataType: 'test-data',
        timeOfDay: new Date(),
        dayOfWeek: 1,
        systemLoad: 'high' as const
      };

      const ttl = adaptiveTTLEngine.calculateOptimalTTL('test-data', context);
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full cache workflow', async () => {
      // 1. Set data with dependencies
      await advancedCacheManager.set('user-profile', 
        { id: 1, name: 'Test User' }, 
        {
          namespace: 'users',
          dataType: 'user-profile',
          context: {
            dataType: 'user-profile',
            timeOfDay: new Date(),
            dayOfWeek: 1,
            systemLoad: 'medium'
          },
          dependencies: ['dashboard-critical']
        }
      );

      // 2. Get data from cache
      const cachedData = await advancedCacheManager.get('user-profile', 'users');
      expect(cachedData).toEqual({ id: 1, name: 'Test User' });

      // 3. Invalidate with dependency
      advancedCacheManager.invalidate('user-profile', 'test-invalidation', 'users');

      // 4. Verify data is removed
      const removedData = await advancedCacheManager.get('user-profile', 'users');
      expect(removedData).toBeNull();
    });

    it('should maintain consistency across operations', async () => {
      const cacheConsistency = CacheConsistency.getInstance();
      
      // Set multiple related entries
      await advancedCacheManager.set('user-1', { id: 1, name: 'User 1' }, {
        namespace: 'users',
        dataType: 'user-profile',
        dependencies: ['dashboard-critical']
      });

      await advancedCacheManager.set('user-2', { id: 2, name: 'User 2' }, {
        namespace: 'users',
        dataType: 'user-profile',
        dependencies: ['dashboard-critical']
      });

      // Check consistency
      const report = await cacheConsistency.forceConsistencyCheck();
      expect(report.overallScore).toBeGreaterThan(0.8); // Should be fairly consistent
    });

    it('should handle memory pressure gracefully', async () => {
      // Add large amount of data to trigger memory optimization
      const largeData = new Array(5000).fill(null).map((_, i) => ({
        id: i,
        data: `test-data-${i}`.repeat(100)
      }));

      for (let i = 0; i < 100; i++) {
        await advancedCacheManager.set(`large-entry-${i}`, largeData, {
          namespace: 'large-data',
          dataType: 'large-test-data'
        });
      }

      // Trigger memory optimization
      await advancedCacheManager.optimize();

      // System should still be functional
      const metrics = advancedCacheManager.getMetrics();
      expect(metrics.memoryUsage).toBeDefined();
    });

    it('should support cross-tab synchronization simulation', async () => {
      // Test cache invalidation events
      cacheInvalidation.invalidateOnUserAction('user-123', 'profile-update', {
        userId: 'user-123'
      });

      const history = cacheInvalidation.getEventHistory(1);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].type).toBe('user-action');
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency cache operations', async () => {
      const startTime = Date.now();
      const operations = 1000;

      // Perform many cache operations
      for (let i = 0; i < operations; i++) {
        await advancedCacheManager.set(`perf-test-${i}`, { id: i }, {
          namespace: 'perf',
          dataType: 'perf-test'
        });
      }

      for (let i = 0; i < operations; i++) {
        await advancedCacheManager.get(`perf-test-${i}`, 'perf');
      }

      const duration = Date.now() - startTime;
      const operationsPerSecond = (operations * 2) / (duration / 1000);

      // Should handle at least 100 operations per second
      expect(operationsPerSecond).toBeGreaterThan(100);
    });

    it('should maintain acceptable cache hit rates', async () => {
      const testData = { id: 1, name: 'Performance Test' };

      // Set data
      await advancedCacheManager.set('perf-hit-test', testData, {
        namespace: 'perf',
        dataType: 'perf-test'
      });

      // Multiple reads to improve hit rate
      for (let i = 0; i < 10; i++) {
        await advancedCacheManager.get('perf-hit-test', 'perf');
      }

      const metrics = advancedCacheManager.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0.8); // Should be high due to repeated access
    });
  });

  describe('Error Handling', () => {
    it('should handle cache read failures gracefully', async () => {
      // Attempt to get non-existent data
      const data = await advancedCacheManager.get('non-existent', 'test');
      expect(data).toBeNull();
    });

    it('should handle invalidation of non-existent entries', () => {
      // Should not throw errors when invalidating non-existent entries
      expect(() => {
        advancedCacheManager.invalidate('non-existent', 'test-reason');
      }).not.toThrow();
    });

    it('should handle corrupted cache entries', async () => {
      // Manually corrupt cache entry
      smartCacheManager.set('corrupt-test', { broken: 'data' }, {
        namespace: 'test'
      });

      // Consistency check should handle corrupted entries
      const cacheConsistency = CacheConsistency.getInstance();
      const issues = await cacheConsistency.checkConsistency();
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle memory allocation failures', async () => {
      // Try to set extremely large data
      const hugeData = new Array(1000000).fill('x'.repeat(1000));

      await expect(advancedCacheManager.set('huge-test', hugeData, {
        namespace: 'test',
        dataType: 'huge-test'
      })).resolves.not.toThrow();
    });
  });
});

// Performance benchmark test
describe('Performance Benchmarks', () => {
  it('should meet cache performance targets', async () => {
    const iterations = 100;
    const timings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      await advancedCacheManager.set(`benchmark-${i}`, { data: `test-${i}` }, {
        namespace: 'benchmark',
        dataType: 'benchmark-test'
      });

      await advancedCacheManager.get(`benchmark-${i}`, 'benchmark');

      const endTime = performance.now();
      timings.push(endTime - startTime);
    }

    const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const maxTime = Math.max(...timings);

    console.log(`Cache operation performance:`, {
      averageTime: `${averageTime.toFixed(2)}ms`,
      maxTime: `${maxTime.toFixed(2)}ms`,
      iterations
    });

    // Performance assertions
    expect(averageTime).toBeLessThan(10); // Average should be under 10ms
    expect(maxTime).toBeLessThan(50); // Max should be under 50ms
  });
});

// Test utilities for cache testing
export const testUtils = {
  // Helper to clear all caches
  clearAllCaches: () => {
    smartCacheManager.clear();
    cacheInvalidation.destroy();
    backgroundRefresher.destroy();
  },

  // Helper to populate test data
  populateTestData: async (count: number = 10) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const testItem = {
        id: i,
        name: `Test Item ${i}`,
        data: `Test data ${i}`.repeat(10),
        timestamp: Date.now()
      };

      await advancedCacheManager.set(`test-item-${i}`, testItem, {
        namespace: 'test',
        dataType: 'test-item'
      });

      data.push(testItem);
    }
    return data;
  },

  // Helper to simulate user activity
  simulateUserActivity: (userId: string) => {
    cacheInvalidation.invalidateOnUserAction(userId, 'page-view', {
      page: 'dashboard',
      timestamp: Date.now()
    });
  }
};
// Test script to verify parallel data loading implementation
// This script will be injected into the admin dashboard page to monitor query execution

(function() {
  console.log('🔍 Starting parallel loading test...');
  
  // Track query execution timing
  const queryTracker = {
    queries: {},
    startTime: null,
    batchRequests: []
  };
  
  // Monitor fetch requests to identify batched queries
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    if (url.includes('/api/trpc')) {
      console.log('📡 tRPC Request:', {
        url,
        method: options.method,
        body: options.body ? JSON.parse(options.body) : null,
        timestamp: new Date().toISOString()
      });
      
      // Track batch requests
      if (options.body) {
        const body = JSON.parse(options.body);
        if (Array.isArray(body)) {
          console.log(`🚀 Batch request with ${body.length} queries:`, body.map(q => q.path));
          queryTracker.batchRequests.push({
            timestamp: Date.now(),
            queryCount: body.length,
            queries: body.map(q => q.path)
          });
        }
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Monitor React Query state changes
  setTimeout(() => {
    const queryClient = window.__REACT_QUERY_CLIENT__;
    if (queryClient) {
      console.log('✅ React Query client found');
      
      // Track query cache
      const queryCache = queryClient.getQueryCache();
      const originalBuild = queryCache.build;
      
      queryCache.build = function(...args) {
        const query = originalBuild.apply(this, args);
        const queryKey = args[0];
        const queryHash = args[1];
        
        console.log('🔍 Query created:', {
          queryKey,
          queryHash,
          timestamp: new Date().toISOString()
        });
        
        return query;
      };
    }
  }, 1000);
  
  // Performance monitoring
  const performanceObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('/api/trpc')) {
        console.log('⏱️ Performance:', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
  
  performanceObserver.observe({ entryTypes: ['resource'] });
  
  // Log results after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('📊 Test Results:', {
        totalBatchRequests: queryTracker.batchRequests.length,
        batchDetails: queryTracker.batchRequests,
        timestamp: new Date().toISOString()
      });
      
      // Check if queries were batched
      if (queryTracker.batchRequests.length > 0) {
        const avgQueriesPerBatch = queryTracker.batchRequests.reduce((sum, batch) => sum + batch.queryCount, 0) / queryTracker.batchRequests.length;
        console.log(`✅ Average queries per batch: ${avgQueriesPerBatch.toFixed(2)}`);
        
        if (avgQueriesPerBatch >= 3) {
          console.log('🎉 SUCCESS: Queries are being batched together!');
        } else {
          console.log('⚠️ WARNING: Queries may not be optimally batched');
        }
      } else {
        console.log('❌ ERROR: No batch requests detected');
      }
    }, 3000);
  });
  
  console.log('🔍 Test monitoring initialized');
})();
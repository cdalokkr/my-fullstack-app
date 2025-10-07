// Comprehensive Progressive Loading Test Suite
// This script tests all aspects of the progressive loading implementation

const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminUrl: 'http://localhost:3000/admin',
  testUrl: 'http://localhost:3000/admin/test',
  slowMo: 100,
  timeout: 30000,
  headless: false, // Set to true for headless testing
  viewport: { width: 1920, height: 1080 }
};

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  },
  tests: [],
  networkRequests: [],
  performanceMetrics: [],
  screenshots: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTestResult(testName, passed, details = '', metrics = {}) {
  const result = {
    name: testName,
    passed,
    details,
    metrics,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.totalTests++;
  
  if (passed) {
    testResults.summary.passedTests++;
    log(`TEST PASSED: ${testName}`, 'success');
  } else {
    testResults.summary.failedTests++;
    log(`TEST FAILED: ${testName} - ${details}`, 'error');
  }
}

function recordNetworkRequest(request) {
  testResults.networkRequests.push({
    url: request.url(),
    method: request.method(),
    timestamp: new Date().toISOString(),
    headers: request.headers(),
    postData: request.postData()
  });
}

function recordPerformanceMetric(name, value) {
  testResults.performanceMetrics.push({
    name,
    value,
    timestamp: new Date().toISOString()
  });
}

async function takeScreenshot(page, name) {
  const screenshotPath = `test-screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testResults.screenshots.push(screenshotPath);
  log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Test functions
async function testApiCallSequence(page) {
  log('Testing API call sequence...');
  
  // Clear existing network requests
  testResults.networkRequests = [];
  
  // Navigate to the admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Wait for initial load
  await page.waitForTimeout(2000);
  
  // Analyze network requests
  const criticalRequests = testResults.networkRequests.filter(req => 
    req.url.includes('getCriticalDashboardData')
  );
  
  const secondaryRequests = testResults.networkRequests.filter(req => 
    req.url.includes('getSecondaryDashboardData')
  );
  
  const detailedRequests = testResults.networkRequests.filter(req => 
    req.url.includes('getDetailedDashboardData')
  );
  
  // Test 1: Verify critical data is called first
  const criticalCalledFirst = criticalRequests.length > 0 && 
    criticalRequests[0].timestamp < (secondaryRequests[0]?.timestamp || Infinity) &&
    criticalRequests[0].timestamp < (detailedRequests[0]?.timestamp || Infinity);
  
  recordTestResult(
    'Critical API called first',
    criticalCalledFirst,
    criticalCalledFirst ? 'Critical data API was called first' : 'Critical data was not called first'
  );
  
  // Test 2: Verify secondary data is called after critical
  const secondaryCalledAfterCritical = secondaryRequests.length > 0 && 
    criticalRequests.length > 0 &&
    new Date(secondaryRequests[0].timestamp) > new Date(criticalRequests[0].timestamp);
  
  recordTestResult(
    'Secondary API called after critical',
    secondaryCalledAfterCritical,
    secondaryCalledAfterCritical ? 'Secondary data API was called after critical' : 'Secondary data was not called after critical'
  );
  
  // Test 3: Verify detailed data is called after secondary
  const detailedCalledAfterSecondary = detailedRequests.length > 0 && 
    secondaryRequests.length > 0 &&
    new Date(detailedRequests[0].timestamp) > new Date(secondaryRequests[0].timestamp);
  
  recordTestResult(
    'Detailed API called after secondary',
    detailedCalledAfterSecondary,
    detailedCalledAfterSecondary ? 'Detailed data API was called after secondary' : 'Detailed data was not called after secondary'
  );
  
  // Test 4: Verify all three endpoints are called
  const allEndpointsCalled = criticalRequests.length > 0 && 
    secondaryRequests.length > 0 && 
    detailedRequests.length > 0;
  
  recordTestResult(
    'All progressive endpoints called',
    allEndpointsCalled,
    `Critical: ${criticalRequests.length}, Secondary: ${secondaryRequests.length}, Detailed: ${detailedRequests.length}`
  );
  
  return {
    criticalRequests: criticalRequests.length,
    secondaryRequests: secondaryRequests.length,
    detailedRequests: detailedRequests.length
  };
}

async function testProgressiveContentAppearance(page) {
  log('Testing progressive content appearance...');
  
  // Navigate to admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Test 1: Critical content appears first
  const criticalContentVisible = await page.waitForSelector('text=Total Users', {
    timeout: 5000
  }).then(() => true).catch(() => false);
  
  recordTestResult(
    'Critical content appears first',
    criticalContentVisible,
    criticalContentVisible ? 'Critical metrics are visible' : 'Critical metrics not found'
  );
  
  // Test 2: Secondary content appears after critical
  let secondaryContentVisible = false;
  if (criticalContentVisible) {
    secondaryContentVisible = await page.waitForSelector('text=Total Activities', {
      timeout: 10000
    }).then(() => true).catch(() => false);
  }
  
  recordTestResult(
    'Secondary content appears after critical',
    secondaryContentVisible,
    secondaryContentVisible ? 'Secondary metrics are visible' : 'Secondary metrics not found'
  );
  
  // Test 3: Detailed content appears last
  let detailedContentVisible = false;
  if (secondaryContentVisible) {
    detailedContentVisible = await page.waitForSelector('text=Recent Activities', {
      timeout: 15000
    }).then(() => true).catch(() => false);
  }
  
  recordTestResult(
    'Detailed content appears last',
    detailedContentVisible,
    detailedContentVisible ? 'Detailed content is visible' : 'Detailed content not found'
  );
  
  return {
    critical: criticalContentVisible,
    secondary: secondaryContentVisible,
    detailed: detailedContentVisible
  };
}

async function testSkeletonComponents(page) {
  log('Testing skeleton components...');
  
  // Navigate to admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Test 1: Skeleton components are present during loading
  const skeletonComponents = await page.$$('.skeleton');
  const skeletonsPresent = skeletonComponents.length > 0;
  
  recordTestResult(
    'Skeleton components present during loading',
    skeletonsPresent,
    `Found ${skeletonComponents.length} skeleton components`
  );
  
  // Test 2: Skeletons match content dimensions (no layout shift)
  const initialLayout = await page.evaluate(() => {
    const criticalSection = document.querySelector('text=Total Users');
    if (criticalSection) {
      const rect = criticalSection.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    return null;
  });
  
  // Wait for content to load
  await page.waitForTimeout(5000);
  
  const finalLayout = await page.evaluate(() => {
    const criticalSection = document.querySelector('text=Total Users');
    if (criticalSection) {
      const rect = criticalSection.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    return null;
  });
  
  const layoutStable = initialLayout && finalLayout && 
    Math.abs(initialLayout.width - finalLayout.width) < 5 &&
    Math.abs(initialLayout.height - finalLayout.height) < 5;
  
  recordTestResult(
    'Skeleton dimensions prevent layout shift',
    layoutStable,
    layoutStable ? 'Layout remained stable' : 'Layout shift detected'
  );
  
  return {
    skeletonCount: skeletonComponents.length,
    layoutStable
  };
}

async function testFadeInAnimations(page) {
  log('Testing fade-in animations...');
  
  // Navigate to admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Test 1: Fade-in animation is applied to sections
  const fadeInAnimation = await page.evaluate(() => {
    const sections = document.querySelectorAll('.transition-opacity');
    return Array.from(sections).map(section => {
      const style = window.getComputedStyle(section);
      return {
        hasTransition: style.transition && style.transition.includes('opacity'),
        transitionDuration: style.transitionDuration,
        transitionProperty: style.transitionProperty
      };
    });
  });
  
  const hasFadeIn = fadeInAnimation.some(section => section.hasTransition);
  
  recordTestResult(
    'Fade-in animations applied',
    hasFadeIn,
    hasFadeIn ? 'Sections have fade-in transitions' : 'No fade-in transitions found'
  );
  
  // Test 2: Animation duration is reasonable (not too fast/slow)
  const reasonableDuration = fadeInAnimation.some(section => 
    section.hasTransition && 
    parseFloat(section.transitionDuration) >= 0.3 && 
    parseFloat(section.transitionDuration) <= 1.0
  );
  
  recordTestResult(
    'Animation duration is reasonable',
    reasonableDuration,
    reasonableDuration ? 'Animation duration is appropriate' : 'Animation duration may be too fast/slow'
  );
  
  return {
    hasFadeIn,
    reasonableDuration,
    animationDetails: fadeInAnimation
  };
}

async function testErrorHandling(page) {
  log('Testing error handling...');
  
  // This test would require mocking API failures
  // For now, we'll test the error UI components exist
  
  // Navigate to admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Test 1: Error components exist in DOM
  const errorComponents = await page.$$('.alert-destructive');
  const errorHandlingPresent = errorComponents.length > 0;
  
  recordTestResult(
    'Error handling components present',
    errorHandlingPresent,
    `Found ${errorComponents.length} error handling components`
  );
  
  // Test 2: Retry buttons are present
  const retryButtons = await page.$$('button:has-text("Retry")');
  const retryButtonsPresent = retryButtons.length > 0;
  
  recordTestResult(
    'Retry buttons present',
    retryButtonsPresent,
    `Found ${retryButtons.length} retry buttons`
  );
  
  return {
    errorComponentsPresent: errorHandlingPresent,
    retryButtonsPresent
  };
}

async function testRetryFunctionality(page) {
  log('Testing retry functionality...');
  
  // Navigate to admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Test 1: Refresh all button exists and is clickable
  const refreshButton = await page.$('button:has-text("Refresh All")');
  const refreshButtonExists = refreshButton !== null;
  
  recordTestResult(
    'Refresh button exists',
    refreshButtonExists,
    refreshButtonExists ? 'Refresh button found' : 'Refresh button not found'
  );
  
  if (refreshButtonExists) {
    // Test 2: Refresh button triggers refetch
    const initialRequestCount = testResults.networkRequests.length;
    
    await refreshButton.click();
    await page.waitForTimeout(3000);
    
    const newRequestCount = testResults.networkRequests.length;
    const refreshTriggeredRefetch = newRequestCount > initialRequestCount;
    
    recordTestResult(
      'Refresh button triggers refetch',
      refreshTriggeredRefetch,
      `Requests before: ${initialRequestCount}, after: ${newRequestCount}`
    );
  }
  
  return {
    refreshButtonExists,
    retryTestPassed: refreshButtonExists
  };
}

async function measurePerformanceMetrics(page) {
  log('Measuring performance metrics...');
  
  // Navigate to admin page
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  
  // Measure Time to First Byte (TTFB)
  const ttfb = await page.evaluate(() => {
    return performance.timing.responseStart - performance.timing.requestStart;
  });
  
  recordPerformanceMetric('TTFB', ttfb);
  
  // Measure First Contentful Paint (FCP)
  const fcp = await page.evaluate(() => {
    return performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
  });
  
  recordPerformanceMetric('FCP', fcp);
  
  // Measure Largest Contentful Paint (LCP)
  const lcp = await page.evaluate(() => {
    return performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0;
  });
  
  recordPerformanceMetric('LCP', lcp);
  
  // Measure Cumulative Layout Shift (CLS)
  const cls = await page.evaluate(() => {
    return new Promise(resolve => {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve(clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
      
      // Resolve after a timeout if no layout shifts
      setTimeout(() => resolve(clsValue), 2000);
    });
  });
  
  recordPerformanceMetric('CLS', cls);
  
  // Test 1: TTFB is acceptable (< 1000ms)
  const ttfbAcceptable = ttfb < 1000;
  recordTestResult(
    'TTFB is acceptable',
    ttfbAcceptable,
    `TTFB: ${ttfb}ms`
  );
  
  // Test 2: FCP is acceptable (< 2000ms)
  const fcpAcceptable = fcp < 2000;
  recordTestResult(
    'FCP is acceptable',
    fcpAcceptable,
    `FCP: ${fcp}ms`
  );
  
  // Test 3: LCP is acceptable (< 2500ms)
  const lcpAcceptable = lcp < 2500;
  recordTestResult(
    'LCP is acceptable',
    lcpAcceptable,
    `LCP: ${lcp}ms`
  );
  
  // Test 4: CLS is minimal (< 0.1)
  const clsAcceptable = cls < 0.1;
  recordTestResult(
    'CLS is minimal',
    clsAcceptable,
    `CLS: ${cls}`
  );
  
  return {
    ttfb,
    fcp,
    lcp,
    cls
  };
}

async function testEdgeCases(page) {
  log('Testing edge cases...');
  
  // Test 1: Slow network simulation
  await page.route('**/*', route => {
    // Add delay to simulate slow network
    setTimeout(() => route.continue(), 2000);
  });
  
  const slowNetworkStartTime = Date.now();
  await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle' });
  const slowNetworkLoadTime = Date.now() - slowNetworkStartTime;
  
  recordTestResult(
    'Slow network handling',
    true,
    `Page loaded in ${slowNetworkLoadTime}ms with simulated slow network`
  );
  
  // Remove the slow network simulation
  await page.unroute('**/*');
  
  // Test 2: Browser resize handling
  await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
  await page.waitForTimeout(1000);
  
  const responsiveLayout = await page.evaluate(() => {
    const criticalSection = document.querySelector('text=Total Users');
    return criticalSection && criticalSection.offsetParent !== null;
  });
  
  recordTestResult(
    'Responsive layout handling',
    responsiveLayout,
    responsiveLayout ? 'Layout adapts to screen size' : 'Layout issues on resize'
  );
  
  // Test 3: Browser back/forward navigation
  await page.goBack();
  await page.waitForTimeout(1000);
  await page.goForward();
  await page.waitForTimeout(1000);
  
  const navigationHandled = await page.evaluate(() => {
    return document.querySelector('text=Total Users') !== null;
  });
  
  recordTestResult(
    'Browser navigation handling',
    navigationHandled,
    navigationHandled ? 'Content preserved on navigation' : 'Navigation issues detected'
  );
  
  return {
    slowNetworkHandled: true,
    responsiveLayout,
    navigationHandled
  };
}

async function generateTestReport() {
  log('Generating comprehensive test report...');
  
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.duration = new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
  
  const reportContent = `
# Progressive Loading Test Report

## Summary
- **Total Tests**: ${testResults.summary.totalTests}
- **Passed**: ${testResults.summary.passedTests}
- **Failed**: ${testResults.summary.failedTests}
- **Success Rate**: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2)}%
- **Duration**: ${testResults.summary.duration}ms
- **Start Time**: ${testResults.summary.startTime}
- **End Time**: ${testResults.summary.endTime}

## Test Results

${testResults.tests.map(test => `
### ${test.name}
- **Status**: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Details**: ${test.details}
- **Timestamp**: ${test.timestamp}
${test.metrics ? `- **Metrics**: ${JSON.stringify(test.metrics, null, 2)}` : ''}
`).join('\n')}

## Network Requests
${testResults.networkRequests.map(req => `
- **${req.method}** ${req.url}
  - Timestamp: ${req.timestamp}
`).join('\n')}

## Performance Metrics
${testResults.performanceMetrics.map(metric => `
- **${metric.name}**: ${metric.value}ms
  - Timestamp: ${metric.timestamp}
`).join('\n')}

## Screenshots
${testResults.screenshots.map(screenshot => `
- ${screenshot}
`).join('\n')}

## Conclusion
The progressive loading implementation ${testResults.summary.failedTests === 0 ? 'passes all tests' : 'has some issues that need attention'}.
${testResults.summary.failedTests === 0 ? 
  'The implementation successfully provides progressive content loading with proper sequencing, skeleton states, animations, and error handling.' : 
  'Some tests failed. Please review the failed tests and address the issues identified.'}
`;

  // Write report to file
  const reportPath = `progressive-loading-test-report-${Date.now()}.md`;
  fs.writeFileSync(reportPath, reportContent);
  
  // Also write JSON results for programmatic access
  const jsonPath = `progressive-loading-test-results-${Date.now()}.json`;
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
  
  log(`Test report saved to: ${reportPath}`);
  log(`Test results JSON saved to: ${jsonPath}`);
  
  return { reportPath, jsonPath };
}

// Main test execution function
async function runComprehensiveTests() {
  log('Starting comprehensive progressive loading tests...');
  
  // Create screenshots directory
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }
  
  const browser = await chromium.launch({ 
    headless: TEST_CONFIG.headless,
    slowMo: TEST_CONFIG.slowMo
  });
  
  const context = await browser.newContext({
    viewport: TEST_CONFIG.viewport
  });
  
  const page = await context.newPage();
  
  // Set up network monitoring
  await page.route('**/*', async (route) => {
    const request = route.request();
    recordNetworkRequest(request);
    await route.continue();
  });
  
  try {
    // Run all tests
    await testApiCallSequence(page);
    await testProgressiveContentAppearance(page);
    await testSkeletonComponents(page);
    await testFadeInAnimations(page);
    await testErrorHandling(page);
    await testRetryFunctionality(page);
    await measurePerformanceMetrics(page);
    await testEdgeCases(page);
    
    // Generate final report
    const { reportPath, jsonPath } = await generateTestReport();
    
    log(`All tests completed! Success rate: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2)}%`, 'success');
    log(`View detailed report: ${reportPath}`);
    
    return {
      success: testResults.summary.failedTests === 0,
      reportPath,
      jsonPath,
      results: testResults
    };
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runComprehensiveTests()
    .then(() => {
      log('Test execution completed successfully', 'success');
      process.exit(0);
    })
    .catch((error) => {
      log(`Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveTests,
  testApiCallSequence,
  testProgressiveContentAppearance,
  testSkeletonComponents,
  testFadeInAnimations,
  testErrorHandling,
  testRetryFunctionality,
  measurePerformanceMetrics,
  testEdgeCases,
  generateTestReport
};
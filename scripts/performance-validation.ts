#!/usr/bin/env ts-node
/**
 * Performance Validation Scripts
 * Automated testing and validation procedures for Phase 3 optimizations
 */

import { performanceValidator, runPerformanceValidation, ValidationResult } from '../lib/monitoring/performance-validator';
import { performanceAnalytics } from '../lib/monitoring/performance-analytics';
import { webVitalsMonitor } from '../lib/monitoring/web-vitals';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// CLI configuration
interface CLIOptions {
  url?: string;
  urls?: string[];
  output?: string;
  format?: 'json' | 'csv' | 'html';
  verbose?: boolean;
  continuous?: boolean;
  interval?: number;
  failThreshold?: number;
  targetScore?: number;
  includeLoadTesting?: boolean;
  deviceTesting?: 'all' | 'mobile' | 'desktop';
  help?: boolean;
}

// Test results
interface TestExecution {
  timestamp: number;
  url: string;
  success: boolean;
  duration: number;
  score: number;
  details: ValidationResult;
}

// Main execution function
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArguments(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    if (options.continuous) {
      await runContinuousValidation(options);
    } else {
      await runSingleValidation(options);
    }
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArguments(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--url':
      case '-u':
        options.url = next;
        i++;
        break;
      case '--urls':
      case '-U':
        options.urls = next.split(',');
        i++;
        break;
      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;
      case '--format':
      case '-f':
        options.format = next as 'json' | 'csv' | 'html';
        i++;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--continuous':
      case '-c':
        options.continuous = true;
        break;
      case '--interval':
      case '-i':
        options.interval = parseInt(next);
        i++;
        break;
      case '--fail-threshold':
        options.failThreshold = parseInt(next);
        i++;
        break;
      case '--target-score':
        options.targetScore = parseInt(next);
        i++;
        break;
      case '--include-load-testing':
        options.includeLoadTesting = true;
        break;
      case '--device-testing':
        options.deviceTesting = next as 'all' | 'mobile' | 'desktop';
        i++;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  // Default values
  options.format = options.format || 'json';
  options.interval = options.interval || 300; // 5 minutes
  options.failThreshold = options.failThreshold || 1; // Fail after 1 failed test
  options.targetScore = options.targetScore || 80; // Target score 80%

  return options;
}

// Run single validation
async function runSingleValidation(options: CLIOptions): Promise<void> {
  const urls = getTestUrls(options);
  const results: TestExecution[] = [];

  console.log(`Starting performance validation for ${urls.length} URL(s)...`);
  console.log(`Target score: ${options.targetScore}%, Format: ${options.format}`);
  console.log('='.repeat(60));

  for (const url of urls) {
    const startTime = Date.now();
    
    try {
      if (options.verbose) {
        console.log(`\nTesting: ${url}`);
      }

      const result = await runPerformanceValidation({
        testUrls: [url],
        includeLoadTesting: options.includeLoadTesting,
        includeDeviceTesting: options.deviceTesting === 'all' || !options.deviceTesting,
        detailedReporting: true,
      });

      const duration = Date.now() - startTime;
      const success = result.passed && result.overallScore >= (options.targetScore || 80);

      results.push({
        timestamp: startTime,
        url,
        success,
        duration,
        score: result.overallScore,
        details: result,
      });

      // Display results
      displayResult(url, result, options.verbose);
      
      // Check if we should exit on failure
      if (!success && options.failThreshold === 1) {
        console.log(`\n❌ Validation failed for ${url}`);
        console.log(`Score: ${result.overallScore}% (target: ${options.targetScore}%)`);
        process.exit(1);
      }

    } catch (error) {
      console.error(`❌ Validation failed for ${url}:`, error);
      results.push({
        timestamp: startTime,
        url,
        success: false,
        duration: Date.now() - startTime,
        score: 0,
        details: {} as ValidationResult,
      });
    }
  }

  // Generate summary report
  const summary = generateSummaryReport(results);
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(summary);

  // Save results
  if (options.output) {
    saveResults(results, options.format!, options.output);
  }

  // Exit with appropriate code
  const allPassed = results.every(r => r.success);
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  if (!allPassed && averageScore < (options.targetScore || 80)) {
    console.log('\n❌ Some validations failed');
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed');
    process.exit(0);
  }
}

// Run continuous validation
async function runContinuousValidation(options: CLIOptions): Promise<void> {
  const urls = getTestUrls(options);
  let consecutiveFailures = 0;
  let testCount = 0;

  console.log(`Starting continuous validation (every ${options.interval}s)`);
  console.log(`Target score: ${options.targetScore}%, Fail threshold: ${options.failThreshold}`);
  console.log('Press Ctrl+C to stop');
  console.log('='.repeat(60));

  const runTest = async () => {
    testCount++;
    console.log(`\n[${new Date().toISOString()}] Test #${testCount}`);
    
    try {
      const results = await Promise.all(
        urls.map(url => runPerformanceValidation({
          testUrls: [url],
          includeLoadTesting: options.includeLoadTesting,
          includeDeviceTesting: options.deviceTesting === 'all' || !options.deviceTesting,
        }))
      );

      const allPassed = results.every(r => r.passed && r.overallScore >= (options.targetScore || 80));
      const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;

      if (allPassed) {
        console.log(`✅ PASSED - Average score: ${averageScore}%`);
        consecutiveFailures = 0;
      } else {
        console.log(`❌ FAILED - Average score: ${averageScore}%`);
        consecutiveFailures++;
        
        if (consecutiveFailures >= (options.failThreshold || 1)) {
          console.log(`\n🚨 ALERT: ${consecutiveFailures} consecutive failures!`);
          
          // Send alert (in real implementation)
          await sendAlert(results, consecutiveFailures);
          
          if (options.failThreshold! > 0) {
            process.exit(1);
          }
        }
      }

      // Save continuous monitoring data
      if (options.output) {
        saveContinuousResults(results, testCount);
      }

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      consecutiveFailures++;
    }
  };

  // Initial test
  await runTest();

  // Schedule subsequent tests
  const interval = setInterval(runTest, (options.interval || 300) * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nStopping continuous validation...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Get test URLs
function getTestUrls(options: CLIOptions): string[] {
  if (options.urls) return options.urls;
  if (options.url) return [options.url];
  
  // Default to localhost for development
  return ['http://localhost:3000'];
}

// Display validation result
function displayResult(url: string, result: ValidationResult, verbose: boolean = false): void {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  const score = `${result.overallScore}%`;
  
  console.log(`\n${status} ${url} - Score: ${score}`);
  
  if (verbose) {
    console.log(`Overall Score: ${result.overallScore}/100`);
    console.log(`Criteria Passed: ${result.summary.passedCriteria}/${result.summary.totalCriteria}`);
    console.log(`Compliance Rate: ${result.summary.complianceRate}%`);
    
    if (result.summary.criticalIssues.length > 0) {
      console.log(`Critical Issues: ${result.summary.criticalIssues.join(', ')}`);
    }
    
    if (result.recommendations.length > 0) {
      console.log('Recommendations:');
      result.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
  }
}

// Generate summary report
function generateSummaryReport(results: TestExecution[]): string {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / total;
  const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  return `
Total Tests: ${total}
Passed: ${passed} (${Math.round(passed / total * 100)}%)
Failed: ${failed} (${Math.round(failed / total * 100)}%)
Average Score: ${Math.round(averageScore)}%
Average Duration: ${Math.round(averageDuration)}ms

Detailed Results:
${results.map(r => 
  `${r.success ? '✅' : '❌'} ${r.url} - ${r.score}% (${r.duration}ms)`
).join('\n')}
`.trim();
}

// Save results to file
function saveResults(results: TestExecution[], format: 'json' | 'csv' | 'html', outputPath: string): void {
  switch (format) {
    case 'json':
      writeFileSync(outputPath, JSON.stringify({
        timestamp: Date.now(),
        results,
        summary: generateSummaryReport(results),
      }, null, 2));
      break;
      
    case 'csv':
      const csv = [
        'URL,Status,Score,Duration,Timestamp',
        ...results.map(r => 
          `"${r.url}",${r.success ? 'PASS' : 'FAIL'},${r.score},${r.duration},${new Date(r.timestamp).toISOString()}`
        )
      ].join('\n');
      writeFileSync(outputPath, csv);
      break;
      
    case 'html':
      const html = generateHTMLReport(results);
      writeFileSync(outputPath, html);
      break;
  }
  
  console.log(`\n📄 Results saved to: ${outputPath}`);
}

// Save continuous monitoring results
async function saveContinuousResults(results: ValidationResult[], testNumber: number): Promise<void> {
  const dataDir = 'performance-monitoring-data';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${dataDir}/continuous-${timestamp}.json`;
  
  if (!existsSync(dataDir)) {
    // Create directory (simplified for this example)
  }
  
  writeFileSync(filename, JSON.stringify({
    testNumber,
    timestamp: Date.now(),
    results,
    summary: {
      averageScore: results.reduce((sum, r) => sum + r.overallScore, 0) / results.length,
      passedTests: results.filter(r => r.passed).length,
      totalTests: results.length,
    }
  }, null, 2));
}

// Generate HTML report
function generateHTMLReport(results: TestExecution[]): string {
  const summary = generateSummaryReport(results);
  const rows = results.map(r => `
    <tr class="${r.success ? 'pass' : 'fail'}">
      <td>${r.url}</td>
      <td>${r.success ? 'PASS' : 'FAIL'}</td>
      <td>${r.score}%</td>
      <td>${r.duration}ms</td>
      <td>${new Date(r.timestamp).toLocaleString()}</td>
    </tr>
  `).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { background-color: #d4edda; }
        .fail { background-color: #f8d7da; }
        .summary { background-color: #e7f3ff; padding: 15px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Performance Validation Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <pre>${summary}</pre>
    </div>
    <table>
        <thead>
            <tr>
                <th>URL</th>
                <th>Status</th>
                <th>Score</th>
                <th>Duration</th>
                <th>Timestamp</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
</body>
</html>
`.trim();
}

// Send alert for failures
async function sendAlert(results: ValidationResult[], consecutiveFailures: number): Promise<void> {
  const alertData = {
    type: 'performance_validation_failure',
    timestamp: Date.now(),
    consecutiveFailures,
    results: results.map(r => ({
      url: 'unknown', // Would be extracted from result
      score: r.overallScore,
      passed: r.passed,
    })),
    message: `Performance validation failed ${consecutiveFailures} consecutive times`,
  };
  
  // In a real implementation, this would send to monitoring system
  console.log('🚨 ALERT:', alertData.message);
}

// Show help information
function showHelp(): void {
  console.log(`
Performance Validation Scripts
Usage: ts-node scripts/performance-validation.ts [options]

Options:
  --url, -u <url>                    Single URL to test
  --urls, -U <urls>                  Comma-separated list of URLs
  --output, -o <file>                Output file path
  --format, -f <json|csv|html>       Output format (default: json)
  --verbose, -v                      Verbose output
  --continuous, -c                   Run continuous validation
  --interval, -i <seconds>           Test interval for continuous mode (default: 300)
  --fail-threshold <number>          Exit after N consecutive failures (default: 1)
  --target-score <percentage>        Target performance score (default: 80)
  --include-load-testing             Enable load testing
  --device-testing <all|mobile|desktop> Device testing mode
  --help, -h                         Show this help

Examples:
  # Test single URL
  ts-node scripts/performance-validation.ts --url http://localhost:3000
  
  # Test multiple URLs
  ts-node scripts/performance-validation.ts --urls http://localhost:3000,https://example.com
  
  # Continuous monitoring
  ts-node scripts/performance-validation.ts --continuous --interval 600 --output results/
  
  # Generate HTML report
  ts-node scripts/performance-validation.ts --url http://localhost:3000 --format html --output report.html
  
  # With load testing and verbose output
  ts-node scripts/performance-validation.ts --url http://localhost:3000 --include-load-testing --verbose
`);
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main, runSingleValidation, runContinuousValidation, type TestExecution };
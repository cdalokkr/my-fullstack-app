// Test file to validate the TypeScript fixes
import { dataTransformationPipeline } from './lib/data/data-transformation-pipeline'

// Test basic functionality
async function testPipeline() {
  try {
    // Test data
    const testData = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com'
    }

    const context = {
      sourceType: 'user-raw',
      targetType: 'user-normalized',
      priority: 'normal' as const,
      deviceCapabilities: {
        memory: 'medium' as const,
        processing: 'medium' as const
      }
    }

    // Test transformation
    const result = await dataTransformationPipeline.transform(
      testData,
      'user-raw',
      'user-normalized',
      context
    )

    console.log('Transformation successful:', result)
    return true
  } catch (error) {
    console.error('Test failed:', error)
    return false
  }
}

// Test rule management
function testRuleManagement() {
  try {
    // Test getting available rules
    const rules = dataTransformationPipeline.getAvailableRules()
    console.log('Available rules:', rules.length)

    // Test with filter
    const userRules = dataTransformationPipeline.getAvailableRules('user-raw')
    console.log('User rules:', userRules.length)

    return true
  } catch (error) {
    console.error('Rule management test failed:', error)
    return false
  }
}

// Run tests
async function runTests() {
  console.log('Testing data transformation pipeline...')
  
  const test1 = await testPipeline()
  const test2 = testRuleManagement()
  
  if (test1 && test2) {
    console.log('All tests passed!')
  } else {
    console.log('Some tests failed!')
  }
}

runTests()
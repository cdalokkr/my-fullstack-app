/**
 * Simple Test Runner for Login Fix Tests
 * This script can be executed with Node.js to run the tests
 */

// Mock DOM APIs that would be available in the browser
global.localStorage = {
  data: {},
  setItem: function(key, value) {
    this.data[key] = value;
  },
  getItem: function(key) {
    return this.data[key] || null;
  },
  removeItem: function(key) {
    delete this.data[key];
  },
  clear: function() {
    this.data = {};
  }
};

// Simple Jest-like test framework
global.describe = function(name, fn) {
  console.log(`\n${name}`);
  fn();
};

global.test = function(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
  }
};

global.beforeEach = function(fn) {
  // Run the beforeEach function before each test
  // For simplicity, we'll just run it immediately
  fn();
};

// Add afterEach to clean up after tests
global.afterEach = function(fn) {
  // Run the afterEach function after each test
  fn();
};

global.expect = function(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toHaveBeenCalled: () => {
      if (!actual.mock || actual.mock.calls.length === 0) {
        throw new Error('Expected function to have been called');
      }
    },
    toHaveBeenCalledWith: (...args) => {
      if (!actual.mock || actual.mock.calls.length === 0) {
        throw new Error('Expected function to have been called');
      }
      const lastCall = actual.mock.calls[actual.mock.calls.length - 1];
      if (JSON.stringify(lastCall) !== JSON.stringify(args)) {
        throw new Error(`Expected to be called with ${JSON.stringify(args)} but was called with ${JSON.stringify(lastCall)}`);
      }
    },
    not: {
      toHaveBeenCalled: () => {
        if (actual.mock && actual.mock.calls.length > 0) {
          throw new Error('Expected function not to have been called');
        }
      },
      toHaveBeenCalledWith: (...args) => {
        if (actual.mock && actual.mock.calls.length > 0) {
          const lastCall = actual.mock.calls[actual.mock.calls.length - 1];
          if (JSON.stringify(lastCall) === JSON.stringify(args)) {
            throw new Error(`Expected not to be called with ${JSON.stringify(args)}`);
          }
        }
      },
      toBe: (expected) => {
        if (actual === expected) {
          throw new Error(`Expected ${actual} not to be ${expected}`);
        }
      },
    },
    resolves: {
      not: {
        toThrow: async () => {
          try {
            await actual;
          } catch (error) {
            throw new Error(`Expected promise not to throw but it threw: ${error.message}`);
          }
        },
      },
    }
  };
};

const jestInstance = {
  fn: () => {
    const mockFn = (...args) => {
      mockFn.mock.calls.push(args);
      return mockFn.mock.returnValue;
    };
    mockFn.mock = {
      calls: [],
      returnValue: undefined,
    };
    mockFn.mockReturnValue = (value) => {
      mockFn.mock.returnValue = value;
      return mockFn;
    };
    mockFn.mockResolvedValue = (value) => {
      mockFn.mock.returnValue = Promise.resolve(value);
      return mockFn;
    };
    mockFn.mockRejectedValue = (value) => {
      mockFn.mock.returnValue = Promise.reject(value);
      return mockFn;
    };
    mockFn.mockImplementation = (fn) => {
      mockFn.implementation = fn;
      mockFn.mock.returnValue = undefined;
      return mockFn;
    };
    return mockFn;
  },
  clearAllMocks: () => {
    // Implementation for clearing mocks would go here
  },
};

global.jest = jestInstance;

// Add expect.any function
global.expect.any = function(type) {
  return {
    $$typeof: 'jest.any',
    type: type,
  };
};

// Update expect function to handle jest.any
const originalExpect = global.expect;
global.expect = function(actual) {
  const result = originalExpect(actual);
  
  // Override toHaveBeenCalledWith to handle jest.any
  const originalToHaveBeenCalledWith = result.toHaveBeenCalledWith;
  result.toHaveBeenCalledWith = function(...args) {
    if (!actual.mock || actual.mock.calls.length === 0) {
      throw new Error('Expected function to have been called');
    }
    
    const lastCall = actual.mock.calls[actual.mock.calls.length - 1];
    
    // Check if any argument uses jest.any
    const argsMatch = args.every((arg, index) => {
      if (arg && arg.$$typeof === 'jest.any') {
        return typeof lastCall[index] === arg.type;
      }
      return JSON.stringify(lastCall[index]) === JSON.stringify(arg);
    });
    
    if (!argsMatch) {
      throw new Error(`Expected to be called with ${JSON.stringify(args)} but was called with ${JSON.stringify(lastCall)}`);
    }
  };
  
  return result;
};

// Mock Image constructor after jest is defined
global.Image = jest.fn().mockImplementation(() => {
  const img = {
    src: '',
    onload: null,
    onerror: null,
  };
  return img;
});

// Import and run the tests
import('./test-login-fix.js').then((module) => {
  if (module.runTests) {
    module.runTests();
  }
}).catch(error => {
  console.error('Error running tests:', error);
});
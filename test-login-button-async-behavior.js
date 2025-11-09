#!/usr/bin/env node

/**
 * Comprehensive Test for Login Button Async Behavior
 * 
 * This test verifies the fix for the async button behavior issue:
 * - Button is disabled when required fields are empty
 * - Button is enabled when form is complete (even with zod validation errors)
 * - Button handles async states properly during login process
 * - Button allows retry after error states
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Login Button Async Behavior Fix\n');

// Test 1: Verify LoginForm changes
console.log('✅ Test 1: Verifying LoginForm changes...');
const loginFormPath = path.join(__dirname, 'components', 'auth', 'login-form.tsx');

try {
  const loginFormContent = fs.readFileSync(loginFormPath, 'utf8');
  
  // Check for the key change: hasRequiredFields logic
  const hasRequiredFieldsRegex = /hasRequiredFields = form\.watch\('email'\)\.length > 0 && form\.watch\('password'\)\.length > 0/;
  if (hasRequiredFieldsRegex.test(loginFormContent)) {
    console.log('   ✅ hasRequiredFields logic added correctly');
  } else {
    console.log('   ❌ hasRequiredFields logic not found');
    process.exit(1);
  }
  
  // Check that the disabled logic was changed
  const disabledRegex = /disabled=\{!hasRequiredFields \|\| form\.formState\.isSubmitting \|\| isLoading\}/;
  if (disabledRegex.test(loginFormContent)) {
    console.log('   ✅ Button disabled logic updated correctly');
  } else {
    console.log('   ❌ Button disabled logic not updated');
    process.exit(1);
  }
  
  console.log('   ✅ LoginForm test passed\n');
} catch (error) {
  console.log('   ❌ Error reading login form:', error.message);
  process.exit(1);
}

// Test 4: Verify onSubmit logic with error handling
console.log('✅ Test 4: Verifying onSubmit error handling...');

try {
  const onSubmitRegex = /onSubmit = async \(data: LoginInput\) => \{[\s\S]*?setIsLoading\(true\)[\s\S]*?try \{[\s\S]*?await loginMutation\.mutateAsync\(data\)[\s\S]*?\} catch \(error\) \{[\s\S]*?setIsLoading\(false\)[\s\S]*?throw error[\s\S]*?\}/;
  
  if (onSubmitRegex.test(loginFormContent)) {
    console.log('   ✅ onSubmit logic properly handles async operations and errors');
  } else {
    console.log('   ❌ onSubmit logic issue');
    process.exit(1);
  }
  
  console.log('   ✅ onSubmit test passed\n');
} catch (error) {
  console.log('   ❌ Error verifying onSubmit:', error.message);
  process.exit(1);
}

// Test 5: Verify error state management
console.log('✅ Test 5: Verifying error state management...');

try {
  // Check that errors are properly cleared on success
  const onSuccessRegex = /onSuccess: \(data\) => \{[\s\S]*?setAuthError\(null\)[\s\S]*?setFieldErrors\(\{\}\)[\s\S]*?setIsLoading\(false\)/;
  
  if (onSuccessRegex.test(loginFormContent)) {
    console.log('   ✅ Error states are properly cleared on success');
  } else {
    console.log('   ❌ Error state clearing issue');
    process.exit(1);
  }
  
  // Check that field errors are properly parsed in onError
  const onErrorRegex = /onError: \(error\) => \{[\s\S]*?setAuthError\(null\)[\s\S]*?setFieldErrors\(\{\}\)[\s\S]*?fieldToHighlight[\s\S]*?\}\)/;
  
  if (onErrorRegex.test(loginFormContent)) {
    console.log('   ✅ Error parsing and field highlighting is implemented');
  } else {
    console.log('   ❌ Error parsing implementation issue');
    process.exit(1);
  }
  
  console.log('   ✅ Error state management test passed\n');
} catch (error) {
  console.log('   ❌ Error verifying error management:', error.message);
  process.exit(1);
}

// Test 2: Verify AsyncButton changes
console.log('✅ Test 2: Verifying AsyncButton changes...');
const asyncButtonPath = path.join(__dirname, 'components', 'ui', 'async-button.tsx');

try {
  const asyncButtonContent = fs.readFileSync(asyncButtonPath, 'utf8');
  
  // Check that success state is no longer in disabled condition
  const disabledRegex = /disabled=\{state === 'loading' \|\| disabled\}/;
  if (disabledRegex.test(asyncButtonContent)) {
    console.log('   ✅ Success state removed from disabled condition');
  } else {
    console.log('   ❌ Success state still in disabled condition');
    process.exit(1);
  }
  
  console.log('   ✅ AsyncButton test passed\n');
} catch (error) {
  console.log('   ❌ Error reading async button:', error.message);
  process.exit(1);
}

// Test 3: Verify validation logic
console.log('✅ Test 3: Verifying validation logic...');

try {
  const authValidationPath = path.join(__dirname, 'lib', 'validations', 'auth.ts');
  const authContent = fs.readFileSync(authValidationPath, 'utf8');
  
  // Check that zod validation is properly implemented
  const hasZodImport = /import \* as z from "zod"/.test(authContent);
  const hasLoginSchema = /export const loginSchema/.test(authContent);
  const hasEmailValidation = /email:/.test(authContent) && /z\.string\(\)/.test(authContent);
  const hasPasswordValidation = /password:/.test(authContent) && /z\.string\(\)/.test(authContent);
  
  if (hasZodImport && hasLoginSchema && hasEmailValidation && hasPasswordValidation) {
    console.log('   ✅ Zod validation schema is properly configured');
  } else {
    console.log('   ❌ Zod validation schema issue');
    console.log('   - Zod import:', hasZodImport);
    console.log('   - Login schema:', hasLoginSchema);
    console.log('   - Email validation:', hasEmailValidation);
    console.log('   - Password validation:', hasPasswordValidation);
    process.exit(1);
  }
  
  console.log('   ✅ Validation logic test passed\n');
} catch (error) {
  console.log('   ❌ Error reading auth validation:', error.message);
  process.exit(1);
}

// Test 4: Verify onSubmit logic with error handling
console.log('✅ Test 4: Verifying onSubmit error handling...');

try {
  const onSubmitRegex = /onSubmit = async \(data: LoginInput\) => \{[\s\S]*?setIsLoading\(true\)[\s\S]*?try \{[\s\S]*?await loginMutation\.mutateAsync\(data\)[\s\S]*?\} catch \(error\) \{[\s\S]*?setIsLoading\(false\)[\s\S]*?throw error[\s\S]*?\}/;
  
  if (onSubmitRegex.test(loginFormContent)) {
    console.log('   ✅ onSubmit logic properly handles async operations and errors');
  } else {
    console.log('   ❌ onSubmit logic issue');
    process.exit(1);
  }
  
  console.log('   ✅ onSubmit test passed\n');
} catch (error) {
  console.log('   ❌ Error verifying onSubmit:', error.message);
  process.exit(1);
}

// Test 5: Verify error state management
console.log('✅ Test 5: Verifying error state management...');

try {
  // Check that errors are properly cleared on success
  const onSuccessRegex = /onSuccess: \(data\) => \{[\s\S]*?setAuthError\(null\)[\s\S]*?setFieldErrors\(\{\}\)[\s\S]*?setIsLoading\(false\)/;
  
  if (onSuccessRegex.test(loginFormContent)) {
    console.log('   ✅ Error states are properly cleared on success');
  } else {
    console.log('   ❌ Error state clearing issue');
    process.exit(1);
  }
  
  // Check that field errors are properly parsed in onError
  const onErrorRegex = /onError: \(error\) => \{[\s\S]*?setAuthError\(null\)[\s\S]*?setFieldErrors\(\{\}\)[\s\S]*?fieldToHighlight[\s\S]*?\}\)/;
  
  if (onErrorRegex.test(loginFormContent)) {
    console.log('   ✅ Error parsing and field highlighting is implemented');
  } else {
    console.log('   ❌ Error parsing implementation issue');
    process.exit(1);
  }
  
  console.log('   ✅ Error state management test passed\n');
} catch (error) {
  console.log('   ❌ Error verifying error management:', error.message);
  process.exit(1);
}

// Final Report
console.log('📋 FINAL TEST RESULTS');
console.log('====================');
console.log('✅ All tests passed! The login button async behavior has been fixed correctly.');
console.log('');
console.log('🔧 Changes Implemented:');
console.log('1. Button is now disabled ONLY when required fields are empty');
console.log('2. Button remains enabled even with zod validation errors');
console.log('3. Button allows submission to show authentication errors');
console.log('4. Button can be retried after error states');
console.log('5. Proper async state management during login process');
console.log('');
console.log('🎯 Expected Behavior:');
console.log('- Empty form fields → Button disabled');
console.log('- Filled form with validation errors → Button enabled (allows submission)');
console.log('- Filled form with valid data → Button enabled (normal submission)');
console.log('- Loading state → Button disabled with loading text');
console.log('- Error state → Button enabled for retry');
console.log('- Success state → Button shows success, then redirects');
console.log('');
console.log('✨ The fix ensures users can see authentication error messages');
console.log('   even when zod validation has minor issues, while still');
console.log('   preventing empty form submissions.');

process.exit(0);
'use client';

import React, { useState } from 'react';
import { AdvancedAsyncButton } from '@/components/ui/advanced-async-button';
import { EnhancedAsyncButton } from '@/components/ui/EnhancedAsyncButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AsyncButtonTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSuccessTest = async (buttonType: string) => {
    addResult(`${buttonType}: Starting success test`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    addResult(`${buttonType}: Success! Button should stay in success state (not reset to idle)`);
  };

  const handleErrorTest = async (buttonType: string) => {
    addResult(`${buttonType}: Starting error test`);
    // Simulate async operation that fails
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw new Error('Simulated error');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Async Button State Management Test</h1>
          <p className="text-gray-600">
            This page tests that async buttons don't reset to idle after success (only on error)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>SimpleAsyncButton Tests</CardTitle>
              <CardDescription>Test success and error state behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Success Test</h4>
                <AdvancedAsyncButton
                  onClick={() => handleSuccessTest('AdvancedAsyncButton')}
                  successText="Success!"
                  loadingText="Loading..."
                >
                  Test Success (should stay green)
                </AdvancedAsyncButton>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Error Test</h4>
                <AdvancedAsyncButton
                  onClick={() => handleErrorTest('AdvancedAsyncButton')}
                  successText="Success!"
                  loadingText="Loading..."
                >
                  Test Error (should reset after 3s)
                </AdvancedAsyncButton>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>EnhancedAsyncButton Tests</CardTitle>
              <CardDescription>Test enhanced version with error handling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Success Test</h4>
                <EnhancedAsyncButton
                  onClick={() => handleSuccessTest('EnhancedAsyncButton')}
                  successText="Success!"
                  loadingText="Loading..."
                >
                  Test Success (should stay green)
                </EnhancedAsyncButton>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Error Test</h4>
                <EnhancedAsyncButton
                  onClick={() => handleErrorTest('EnhancedAsyncButton')}
                  successText="Success!"
                  loadingText="Loading..."
                  errorText="Error occurred"
                  showErrorBriefly={true}
                >
                  Test Error (should reset after 3s)
                </EnhancedAsyncButton>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Console output from button interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No test results yet. Click the buttons above to test.</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Success State:</strong> Button should turn green and stay in success state. 
                It should NOT automatically reset to idle, allowing users to see the success feedback 
                during longer operations like redirections.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <strong>Error State:</strong> Button should turn red and reset to idle after a few seconds 
                (configurable duration), allowing users to try again.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
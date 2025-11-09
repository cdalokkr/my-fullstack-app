"use client";

import React, { useState } from 'react';
import AsyncButton from '@/components/ui/async-button';

// Test component to demonstrate adaptive width functionality
export default function AdaptiveWidthTest() {
  const [testState, setTestState] = useState(false);

  const handleAsyncAction = async (): Promise<void> => {
    return new Promise<void>(resolve => setTimeout(resolve, 2000));
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AsyncButton Adaptive Width Test</h1>
      
      {/* Test 1: Normal behavior (backward compatibility) */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 1: Normal Button (Backward Compatible)</h2>
        <p className="text-sm text-gray-600 mb-4">
          These buttons use the default behavior (full width) - should match existing usage
        </p>
        <div className="space-y-4">
          <AsyncButton 
            onClick={handleAsyncAction}
            className="w-full"
            loadingText="Processing..."
            successText="Completed successfully!"
            errorText="Failed to process"
          >
            Save Changes
          </AsyncButton>
          
          <AsyncButton 
            onClick={handleAsyncAction}
            loadingText="Loading..."
            successText="Success!"
            errorText="Error"
            variant="secondary"
            size="lg"
            className="w-48"
          >
            Submit
          </AsyncButton>
        </div>
      </div>

      {/* Test 2: Adaptive width with different text lengths */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 2: Adaptive Width Buttons</h2>
        <p className="text-sm text-gray-600 mb-4">
          These buttons use adaptive width - should maintain consistent width across all states
        </p>
        <div className="space-y-4">
          <AsyncButton 
            customWidth={true}
            onClick={handleAsyncAction}
            loadingText="This is a longer loading text..."
            successText="Success! Action completed!"
            errorText="Error occurred during processing"
            variant="primary"
          >
            Short Text
          </AsyncButton>
          
          <AsyncButton 
            customWidth={true}
            onClick={handleAsyncAction}
            loadingText="Loading..."
            successText="Success!"
            errorText="Error"
            variant="success"
            size="sm"
          >
            This is a much longer initial text that should test the adaptive width calculation
          </AsyncButton>
          
          <AsyncButton 
            customWidth={true}
            onClick={handleAsyncAction}
            loadingText="Processing..."
            successText="Done!"
            errorText="Failed"
            variant="danger"
            size="lg"
          >
            Medium
          </AsyncButton>
        </div>
      </div>

      {/* Test 3: State transition visualization */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 3: State Transition Comparison</h2>
        <p className="text-sm text-gray-600 mb-4">
          Compare normal vs adaptive width during state changes - adaptive should not shift
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Normal Width (w-full)</h3>
            <AsyncButton 
              onClick={handleAsyncAction}
              loadingText="Loading..."
              successText="Completed!"
              errorText="Error"
              className="w-full"
            >
              Save
            </AsyncButton>
          </div>
          <div>
            <h3 className="font-medium mb-2">Adaptive Width</h3>
            <AsyncButton 
              customWidth={true}
              onClick={handleAsyncAction}
              loadingText="Loading..."
              successText="Completed!"
              errorText="Error"
            >
              Save
            </AsyncButton>
          </div>
        </div>
      </div>

      {/* Test 4: Different variants and sizes */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 4: Variants with Adaptive Width</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <AsyncButton 
              customWidth={true}
              onClick={handleAsyncAction}
              variant="primary"
              size="sm"
            >
              Primary Small
            </AsyncButton>
            
            <AsyncButton 
              customWidth={true}
              onClick={handleAsyncAction}
              variant="secondary"
              size="md"
            >
              Secondary Medium with longer text
            </AsyncButton>
            
            <AsyncButton 
              customWidth={true}
              onClick={handleAsyncAction}
              variant="success"
              size="lg"
            >
              Success Large Button Text
            </AsyncButton>
            
            <AsyncButton 
              customWidth={true}
              onClick={handleAsyncAction}
              variant="danger"
              size="md"
            >
              Danger
            </AsyncButton>
          </div>
        </div>
      </div>

      {/* Test 5: Edge cases */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 5: Edge Cases</h2>
        <div className="space-y-4">
          <AsyncButton 
            customWidth={true}
            onClick={handleAsyncAction}
            loadingText=""
            successText=""
            errorText=""
          >
            {/* Empty text edge case */}
          </AsyncButton>
          
          <AsyncButton 
            customWidth={true}
            onClick={handleAsyncAction}
            loadingText="This is an extremely long loading text that should test the maximum width calculation for adaptive width functionality"
            successText="This is also a very long success message to test width boundaries"
            errorText="And this is an error message that might be even longer than the others"
          >
            Short
          </AsyncButton>
        </div>
      </div>

      {/* Test 6: Preset button variants */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test 6: Preset Button Components</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test the preset button components (LoginButton, SaveButton, etc.) with adaptive width
        </p>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <AsyncButton 
              customWidth={true}
              onClick={handleAsyncAction}
              variant="primary"
            >
              Custom Text
            </AsyncButton>
          </div>
        </div>
      </div>
    </div>
  );
}
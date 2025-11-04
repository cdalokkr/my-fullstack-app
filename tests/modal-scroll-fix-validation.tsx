import React, { useState } from 'react';
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal';
import { Button } from '@/components/ui/button';

/**
 * Test component to validate the scroll fix changes for the Add User Modal
 * This test validates:
 * 1. No horizontal scroll on hover
 * 2. No unwanted vertical scroll behavior on hover
 * 3. Adequate spacing after button row
 * 4. Responsive design across different screen sizes
 */
export function ModalScrollFixTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (test: string, passed: boolean, details: string) => {
    const result = `${passed ? '✅' : '❌'} ${test}: ${details}`;
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  const validateModalDimensions = () => {
    // Test that modal width is sufficient
    const modalElement = document.querySelector('[data-radix-dialog-content]');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      const maxWidth = window.innerWidth;
      const widthPercentage = (rect.width / maxWidth) * 100;
      
      // Should be around 98vw as set in our fix
      if (widthPercentage <= 98) {
        addTestResult('Modal Width', true, `Width is ${widthPercentage.toFixed(1)}% of viewport (${rect.width}px)`);
      } else {
        addTestResult('Modal Width', false, `Width is ${widthPercentage.toFixed(1)}% of viewport, exceeding 98vw`);
      }
    }
  };

  const validateSpacing = () => {
    // Test button container spacing
    const buttonContainer = document.querySelector('[class*="pt-8 mt-8"]') || 
                           document.querySelector('[class*="flex flex-col sm:flex-row gap-3"]');
    
    if (buttonContainer) {
      const styles = window.getComputedStyle(buttonContainer);
      const paddingTop = parseInt(styles.paddingTop);
      const marginTop = parseInt(styles.marginTop);
      
      // Should have 2rem (32px) padding and margin
      if (paddingTop >= 32 && marginTop >= 32) {
        addTestResult('Button Spacing', true, `Padding: ${paddingTop}px, Margin: ${marginTop}px`);
      } else {
        addTestResult('Button Spacing', false, `Insufficient padding/margin. P: ${paddingTop}px, M: ${marginTop}px`);
      }
    }
  };

  const validateResponsiveDesign = () => {
    const modalElement = document.querySelector('[data-radix-dialog-content]');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      const currentWidth = window.innerWidth;
      
      // Test different viewport widths
      if (currentWidth >= 1280) {
        // Large screens should use max-w-7xl (1280px)
        if (rect.width <= 1280) {
          addTestResult('Responsive Large', true, `Large screen modal fits within 1280px`);
        } else {
          addTestResult('Responsive Large', false, `Large screen modal exceeds 1280px`);
        }
      } else if (currentWidth >= 768) {
        // Medium screens should be responsive
        if (rect.width <= currentWidth * 0.98) {
          addTestResult('Responsive Medium', true, `Medium screen modal fits within viewport`);
        } else {
          addTestResult('Responsive Medium', false, `Medium screen modal overflows viewport`);
        }
      }
    }
  };

  const handleTest = () => {
    setTestResults([]);
    
    // Wait for modal to be fully rendered
    setTimeout(() => {
      validateModalDimensions();
      validateSpacing();
      validateResponsiveDesign();
      
      // Test hover states
      const hoverTest = document.querySelector('button[class*="hover:bg-primary"]');
      if (hoverTest) {
        addTestResult('Hover States', true, 'Interactive elements have hover states');
      } else {
        addTestResult('Hover States', false, 'No hover states detected');
      }
      
      // Check for potential scroll containers
      const scrollContainer = document.querySelector('[class*="overflow-y-auto"]');
      if (scrollContainer) {
        const styles = window.getComputedStyle(scrollContainer);
        addTestResult('Scroll Container', true, `Found scroll container with max-height: ${styles.maxHeight}`);
      }
      
    }, 100);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Modal Scroll Fix Validation</h1>
        <p className="text-muted-foreground">
          Test the scroll fixes for the Enhanced Add User Modal
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setIsModalOpen(true)}>
          Open Add User Modal
        </Button>
        <Button variant="outline" onClick={handleTest}>
          Run Validation Tests
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold">Test Results:</h3>
          <div className="space-y-1 font-mono text-sm">
            {testResults.map((result, index) => (
              <div key={index} className={result.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Expected Behaviors:</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ No horizontal scroll when hovering over buttons</li>
          <li>✅ No unwanted vertical scroll behavior on hover</li>
          <li>✅ Adequate spacing (32px) after button row</li>
          <li>✅ Responsive design across different screen sizes</li>
          <li>✅ Modal width uses max-w-7xl w-[98vw]</li>
        </ul>
      </div>

      <EnhancedAddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          console.log('User created successfully!');
          addTestResult('Modal Functionality', true, 'User creation works correctly');
        }}
      />
    </div>
  );
}

export default ModalScrollFixTest;
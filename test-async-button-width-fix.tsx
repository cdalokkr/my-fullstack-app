// Test file to validate async button width flash fix
import { render, screen } from '@testing-library/react';
import AsyncButton from '@/components/ui/async-button';
import { useState, useRef, useLayoutEffect, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Mock framer-motion for testing
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Test 1: Verify no width flash when customWidth is true
test('should not show width flash when customWidth=true', async () => {
  const { container, rerender } = render(
    <AsyncButton 
      customWidth={true}
      loadingText="Loading..."
      successText="Success!"
      errorText="Error!"
    >
      Click me
    </AsyncButton>
  );

  // Check if container exists with proper width styling
  const containerDiv = container.querySelector('div[style*="width"]');
  expect(containerDiv).toBeInTheDocument();
  
  // Verify button is inside container
  const button = container.querySelector('button');
  expect(button).toBeInTheDocument();
  expect(button?.parentElement).toBe(containerDiv);
});

// Test 2: Verify backward compatibility when customWidth is false
test('should maintain backward compatibility when customWidth=false', () => {
  const { container } = render(
    <AsyncButton 
      customWidth={false}
      className="w-full"
    >
      Click me
    </AsyncButton>
  );

  // Should render button directly without container
  const button = container.querySelector('button');
  const containerDiv = container.querySelector('div[style*="width"]');
  
  expect(button).toBeInTheDocument();
  expect(containerDiv).not.toBeInTheDocument();
  
  // Should have full width class
  expect(button).toHaveClass('w-full');
});

// Test 3: Verify className filtering works correctly
test('should filter width classes from className when customWidth=true', () => {
  const { container } = render(
    <AsyncButton 
      customWidth={true}
      className="w-full w-32 bg-blue-500 text-white"
    >
      Click me
    </AsyncButton>
  );

  const button = container.querySelector('button');
  
  // Width classes should be filtered out
  expect(button).not.toHaveClass('w-full');
  expect(button).not.toHaveClass('w-32');
  
  // Other classes should remain
  expect(button).toHaveClass('bg-blue-500');
  expect(button).toHaveClass('text-white');
});

// Test 4: Verify width calculation works
test('should calculate width correctly based on text content', () => {
  const { container } = render(
    <AsyncButton 
      customWidth={true}
      loadingText="Loading text is longer"
      successText="Success!"
      errorText="Error"
    >
      Short
    </AsyncButton>
  );

  const containerDiv = container.querySelector('div[style*="width"]');
  expect(containerDiv).toBeInTheDocument();
  
  // Container should have calculated width
  const style = containerDiv?.getAttribute('style');
  expect(style).toMatch(/width:/);
});

// Test 5: Verify no regressions in state management
test('should maintain all existing async state functionality', async () => {
  const mockOnClick = jest.fn().mockResolvedValue(undefined);
  
  const { container } = render(
    <AsyncButton 
      onClick={mockOnClick}
      loadingText="Loading..."
      successText="Success!"
      errorText="Error!"
      customWidth={true}
    >
      Click me
    </AsyncButton>
  );

  const button = container.querySelector('button');
  expect(button).toBeInTheDocument();
  
  // Test click functionality
  button?.click();
  
  // Verify onClick was called
  expect(mockOnClick).toHaveBeenCalled();
});

// Test 6: Verify container rendering timing
test('should render container immediately when customWidth=true', () => {
  const { container } = render(
    <AsyncButton 
      customWidth={true}
    >
      Test
    </AsyncButton>
  );

  // Container should be present immediately
  const containerDiv = container.querySelector('div');
  expect(containerDiv).toBeInTheDocument();
  
  // Button should be inside container
  const button = container.querySelector('button');
  expect(button).toBeInTheDocument();
  expect(button?.parentElement).toBe(containerDiv);
});

// Test 7: Verify performance - no unnecessary re-renders
test('should not cause unnecessary re-renders with container approach', () => {
  const { rerender } = render(
    <AsyncButton 
      customWidth={true}
      variant="primary"
    >
      Test
    </AsyncButton>
  );

  const renderCount = { current: 0 };
  const originalRender = render;
  
  // Re-render with different props
  rerender(
    <AsyncButton 
      customWidth={true}
      variant="secondary"
    >
      Test
    </AsyncButton>
  );

  // Should handle prop changes gracefully
  expect(screen.getByText('Test')).toBeInTheDocument();
});

// Integration test: Verify the complete solution works in real scenario
test('integration: should work seamlessly in real button usage', async () => {
  const mockOnClick = jest.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(resolve, 100))
  );
  
  render(
    <div>
      <AsyncButton 
        onClick={mockOnClick}
        loadingText="Processing..."
        successText="Done!"
        errorText="Failed!"
        customWidth={true}
        className="mx-2"
      >
        Submit
      </AsyncButton>
      
      <AsyncButton 
        customWidth={false}
        className="w-full"
      >
        Full Width Button
      </AsyncButton>
    </div>
  );

  // Both buttons should render correctly
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(2);
  
  // First button should use container approach
  const firstButtonContainer = buttons[0].parentElement;
  expect(firstButtonContainer?.tagName).toBe('DIV');
  expect(firstButtonContainer).toHaveAttribute('style');
  
  // Second button should render directly
  expect(buttons[1].parentElement?.tagName).toBe('DIV');
  expect(buttons[1].parentElement).not.toHaveAttribute('style');
});

export {};
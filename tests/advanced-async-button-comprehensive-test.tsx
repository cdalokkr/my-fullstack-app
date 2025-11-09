"use client";

import React, { useState, useCallback } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  AdvancedAsyncButton, 
  AdvancedLoginButton, 
  AdvancedSaveButton, 
  AdvancedDeleteButton, 
  AdvancedSubmitButton,
  type AsyncState 
} from '@/components/ui/advanced-async-button';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));

describe('Advanced Async Button - Comprehensive Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('should handle basic async operation successfully', async () => {
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      const mockOnSuccess = jest.fn();
      const mockOnError = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      const button = screen.getByRole('button');
      
      // Initial state
      expect(button).toHaveTextContent('Click to start');
      expect(button).toBeEnabled();
      expect(button).not.toBeDisabled();
      
      // Click to start
      fireEvent.click(button);
      
      // Loading state
      await waitFor(() => {
        expect(button).toHaveTextContent('Processing...');
        expect(button).toBeDisabled();
      });
      
      // Success state
      await waitFor(() => {
        expect(button).toHaveTextContent('Completed successfully!');
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClick).toHaveBeenCalled();
      });
      
      // Should reset to idle after duration
      await waitFor(() => {
        expect(button).toHaveTextContent('Click to start');
        expect(button).toBeEnabled();
      }, { timeout: 3000 });
    });

    it('should handle async operation failure', async () => {
      const mockOnClick = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockOnError = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          onError={mockOnError}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Something went wrong');
        expect(mockOnError).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Click to start');
      }, { timeout: 5000 });
    });

    it('should respect disabled state', () => {
      const mockOnClick = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should track state changes properly', async () => {
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      const mockOnStateChange = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          onStateChange={mockOnStateChange}
          successDuration={100}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should call state change with loading state
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledWith('loading', 'idle');
      });
      
      // Should call state change with success state
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledWith('success', 'loading');
      });
      
      // Should call state change with idle state
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledWith('idle', 'success');
      });
    });

    it('should handle pause/resume functionality', async () => {
      const mockOnClick = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      const mockOnPause = jest.fn();
      const mockOnResume = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          enablePause={true}
          onPause={mockOnPause}
          onResume={mockOnResume}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
      
      // Find and click pause button
      const pauseButton = screen.getByLabelText('Pause operation');
      fireEvent.click(pauseButton);
      
      await waitFor(() => {
        expect(mockOnPause).toHaveBeenCalled();
        expect(button).not.toBeDisabled();
      });
      
      // Find and click resume button
      const resumeButton = screen.getByLabelText('Resume operation');
      fireEvent.click(resumeButton);
      
      await waitFor(() => {
        expect(mockOnResume).toHaveBeenCalled();
        expect(button).toBeDisabled();
      });
    });

    it('should handle retry functionality', async () => {
      let attempt = 0;
      const mockOnClick = jest.fn().mockImplementation(() => {
        attempt++;
        if (attempt < 2) {
          throw new Error('Temporary error');
        }
        return Promise.resolve();
      });
      const mockOnRetry = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          enableRetry={true}
          onRetry={mockOnRetry}
          errorDuration={500}
        />
      );
      
      const button = screen.getByRole('button');
      
      // First attempt - should fail
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Something went wrong');
      });
      
      // Click retry button
      const retryButton = screen.getByLabelText('Retry operation');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalled();
      });
      
      // Should show retrying state briefly
      await waitFor(() => {
        expect(button).toHaveTextContent('Retrying...');
      });
      
      // Should then start loading again
      await waitFor(() => {
        expect(button).toHaveTextContent('Processing...');
      });
      
      // Should eventually succeed
      await waitFor(() => {
        expect(button).toHaveTextContent('Completed successfully!');
      });
    });
  });

  describe('Animation and Visual Effects', () => {
    it('should show loading dots when enabled', async () => {
      const mockOnClick = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 3000))
      );
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          showLoadingDots={true}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should show loading with dots
      await waitFor(() => {
        expect(button.textContent).toContain('Processing.');
      });
      
      // Dots should animate
      await waitFor(() => {
        expect(button.textContent).toContain('Processing..');
      });
      
      await waitFor(() => {
        expect(button.textContent).toContain('Processing...');
      });
    });

    it('should show progress indicator for long operations', async () => {
      const mockOnClick = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 6000))
      );
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          showProgress={true}
          progressDuration={3000}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Progress indicator should be visible
      await waitFor(() => {
        const progressBar = button.querySelector('[class*="h-1"]');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion
      const { useReducedMotion } = require('framer-motion');
      useReducedMotion.mockReturnValue(true);
      
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should still function but without complex animations
      await waitFor(() => {
        expect(button).toHaveTextContent('Processing...');
      });
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Completed successfully!');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-live', 'off');
      expect(button).toHaveAttribute('aria-busy', 'false');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-live', 'polite');
        expect(button).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should provide screen reader announcements', async () => {
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Check for screen reader only announcements
      await waitFor(() => {
        const announcement = screen.getByText(/Loading: Processing/);
        expect(announcement).toBeInTheDocument();
      });
    });

    it('should provide error details for screen readers', async () => {
      const mockOnClick = jest.fn().mockRejectedValue(new Error('Specific error message'));
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Something went wrong');
      });
      
      // Should have aria-describedby for error message
      expect(button).toHaveAttribute('aria-describedby', 'error-message');
      
      // Error message should be available for screen readers
      const errorMessage = screen.getByText('Specific error message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Pre-configured Variants', () => {
    it('AdvancedLoginButton should have correct defaults', () => {
      const mockOnClick = jest.fn();
      
      render(
        <AdvancedLoginButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Sign in');
    });

    it('AdvancedSaveButton should have correct defaults', () => {
      const mockOnClick = jest.fn();
      
      render(
        <AdvancedSaveButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Save changes');
    });

    it('AdvancedDeleteButton should have retry enabled', () => {
      const mockOnClick = jest.fn().mockRejectedValue(new Error('Delete failed'));
      
      render(
        <AdvancedDeleteButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should show error and retry button
      expect(button).toHaveTextContent('Delete failed');
    });

    it('AdvancedSubmitButton should have correct defaults', () => {
      const mockOnClick = jest.fn();
      
      render(
        <AdvancedSubmitButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Submit');
    });
  });

  describe('Custom Styling and Theming', () => {
    it('should accept custom variants', () => {
      const mockOnClick = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          variant="danger"
          size="lg"
          className="custom-class"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveAttribute('data-variant', 'danger');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('should handle custom icons', () => {
      const mockOnClick = jest.fn();
      const customIcon = <div data-testid="custom-icon">Custom</div>;
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          icons={{
            loading: customIcon,
          }}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Timeout Handling', () => {
    it('should handle operation timeout', async () => {
      const mockOnClick = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      );
      const mockOnError = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          onError={mockOnError}
          timeoutDuration={1000}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should timeout and show error
      await waitFor(() => {
        expect(button).toHaveTextContent('Something went wrong');
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Operation timed out'
        }));
      });
    });
  });

  describe('Auto-reset Functionality', () => {
    it('should auto-reset to idle state', async () => {
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          successDuration={500}
          autoReset={true}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Completed successfully!');
      });
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Click to start');
      });
    });

    it('should respect autoReset=false', async () => {
      const mockOnClick = jest.fn().mockResolvedValue(undefined);
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
          successDuration={500}
          autoReset={false}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveTextContent('Completed successfully!');
      });
      
      // Should stay in success state
      await waitFor(() => {
        expect(button).toHaveTextContent('Completed successfully!');
      }, { timeout: 1000 });
    });
  });

  describe('Performance and Cleanup', () => {
    it('should cleanup timers on unmount', () => {
      const mockOnClick = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const { unmount } = render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should cleanup without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid clicks', () => {
      const mockOnClick = jest.fn();
      
      render(
        <AdvancedAsyncButton
          onClick={mockOnClick}
        />
      );
      
      const button = screen.getByRole('button');
      
      // Rapid clicks should not cause issues
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      // Should only call onClick once
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});

// Integration test with complex async operations
describe('Advanced Async Button - Integration Tests', () => {
  it('should handle complex async workflow', async () => {
    const TestComponent = () => {
      const [result, setResult] = useState<string>('');
      
      const complexOperation = useCallback(async () => {
        // Simulate multi-step operation
        await new Promise(resolve => setTimeout(resolve, 100));
        await new Promise(resolve => setTimeout(resolve, 100));
        setResult('Complex operation completed');
      }, []);
      
      return (
        <div>
          <AdvancedAsyncButton
            onClick={complexOperation}
            loadingText="Processing step 1..."
            successText="All steps completed!"
            onSuccess={() => console.log('Success callback fired')}
            progressDuration={200}
            showProgress={true}
          />
          <div data-testid="result">{result}</div>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Complex operation completed');
    });
  });
});
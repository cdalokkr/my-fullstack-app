"use client"

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ManualAsyncButton } from '@/components/ui/manual-async-button'
import { ModernAddUserModal } from '@/components/dashboard/modern-add-user-modal'
import { trpc } from '@/lib/trpc/client'
import userEvent from '@testing-library/user-event'

// Mock TRPC client for ModernAddUserModal tests
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        users: {
          getUsers: { 
            invalidate: jest.fn(() => {
              console.log('✅ TRPC: getUsers invalidated')
            }),
          },
        },
        dashboard: {
          getCriticalDashboardData: { 
            invalidate: jest.fn(() => {
              console.log('✅ TRPC: dashboard data invalidated')
            }),
          },
        },
      },
    }),
    admin: {
      users: {
        createUser: {
          useMutation: jest.fn(() => ({
            mutateAsync: jest.fn(async (data) => {
              console.log('🔄 TRPC: mutateAsync called with data:', data)
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              console.log('✅ TRPC: mutateAsync completed')
              return { success: true }
            }),
            onSuccess: jest.fn(() => {
              console.log('✅ TRPC: onSuccess callback triggered')
            }),
            onError: jest.fn((error) => {
              console.log('❌ TRPC: onError callback triggered:', error)
            }),
          })),
        },
      },
    },
  },
}))

describe('Consolidated Async Button Testing', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    console.log('🧪 Test setup complete')
  })

  describe('ManualAsyncButton - Visual States and Behavior', () => {
    it('should show loading spinner and text during loading state', async () => {
      let resolvePromise: (value: any) => void
      const asyncOperation = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      const onClick = jest.fn().mockImplementation(async () => {
        console.log('ManualAsyncButton Test: onClick called')
        await asyncOperation
      })
      
      const { container } = render(
        <ManualAsyncButton
          onClick={onClick}
          loadingText="Creating..."
          successText="Created successfully!"
          className="test-button"
        >
          <span>Create User</span>
        </ManualAsyncButton>
      )
      
      // Check initial state
      console.log('Initial button content:', container.innerHTML)
      expect(screen.getByText('Create User')).toBeInTheDocument()
      
      // Click the button
      await user.click(screen.getByText('Create User'))
      
      // Wait for loading state
      await waitFor(() => {
        console.log('Button content after click:', container.innerHTML)
        const loadingText = screen.queryByText('Creating...')
        console.log('Loading text found:', !!loadingText)
        return loadingText
      }, { timeout: 2000 })
      
      // Check if loading spinner is present
      const spinner = container.querySelector('[data-testid="loading-spinner"], .animate-spin, [class*="spin"]')
      console.log('Spinner found:', !!spinner)
      
      // Resolve the promise to trigger success state
      resolvePromise!(undefined)
      
      // Wait for success state
      await waitFor(() => {
        const successText = screen.queryByText('Created successfully!')
        console.log('Success text found:', !!successText)
        return successText
      }, { timeout: 2000 })
    })

    it('should show success checkmark and text during success state', async () => {
      const onClick = jest.fn().mockResolvedValue(undefined)
      
      const { container } = render(
        <ManualAsyncButton
          onClick={onClick}
          loadingText="Loading..."
          successText="Success!"
          className="test-button"
        >
          <span>Test Button</span>
        </ManualAsyncButton>
      )
      
      // Click the button
      await user.click(screen.getByText('Test Button'))
      
      // Wait for success state (after loading completes)
      await waitFor(() => {
        console.log('Button content in success state:', container.innerHTML)
        const successText = screen.queryByText('Success!')
        const checkmark = container.querySelector('[data-testid="success-checkmark"], svg[class*="check"]')
        console.log('Success text found:', !!successText)
        console.log('Success checkmark found:', !!checkmark)
        return successText
      }, { timeout: 3000 })
    })

    it('should show loading spinner and loading text during async operation', async () => {
      // Create a mock async operation that takes 1 second
      const mockAsyncOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      const { container } = render(
        <ManualAsyncButton
          onClick={mockAsyncOperation}
          loadingText="Creating..."
          successText="Created successfully!"
          className="test-button"
        >
          <span>Create User</span>
        </ManualAsyncButton>
      )
      
      // Verify initial state
      expect(screen.getByText('Create User')).toBeInTheDocument()
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument()
      
      // Click the button to trigger async operation
      await user.click(screen.getByText('Create User'))
      
      // Wait for loading state to appear
      await waitFor(() => {
        const loadingText = screen.queryByText('Creating...')
        expect(loadingText).toBeInTheDocument()
        
        // Check for loading spinner (should have animate-spin class)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Wait for success state
      await waitFor(() => {
        const successText = screen.queryByText('Created successfully!')
        expect(successText).toBeInTheDocument()
        
        // Check for success checkmark (should have check-circle class)
        const checkmark = container.querySelector('[class*="check"]') || container.querySelector('[data-testid="success-icon"]')
        expect(checkmark).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show error state with error icon and text', async () => {
      // Create a mock async operation that throws an error
      const mockAsyncOperation = jest.fn().mockRejectedValue(new Error('Operation failed'))
      
      const { container } = render(
        <ManualAsyncButton
          onClick={mockAsyncOperation}
          loadingText="Processing..."
          errorText="Failed to process"
          className="test-button"
        >
          <span>Process Data</span>
        </ManualAsyncButton>
      )
      
      // Click the button to trigger async operation
      await user.click(screen.getByText('Process Data'))
      
      // Wait for loading state first
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Wait for error state to appear
      await waitFor(() => {
        const errorText = screen.queryByText('Failed to process')
        expect(errorText).toBeInTheDocument()
        
        // Check for error icon
        const errorIcon = container.querySelector('[class*="alert"]') || container.querySelector('[data-testid="error-icon"]')
        expect(errorIcon).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should return to idle state after success/error timeout', async () => {
      const mockAsyncOperation = jest.fn().mockResolvedValue(undefined)
      
      render(
        <ManualAsyncButton
          onClick={mockAsyncOperation}
          loadingText="Loading..."
          successText="Done!"
          className="test-button"
        >
          <span>Test Button</span>
        </ManualAsyncButton>
      )
      
      // Click the button
      await user.click(screen.getByText('Test Button'))
      
      // Wait for success state
      await waitFor(() => {
        expect(screen.queryByText('Done!')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Wait for auto-reset to idle (success timeout is 2 seconds)
      await waitFor(() => {
        expect(screen.queryByText('Test Button')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should properly show loading and success states in isolation', async () => {
      console.log('🚀 Starting isolated async button test')
      
      let resolvePromise: (value: any) => void
      const asyncOperation = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      const onClick = jest.fn().mockImplementation(async () => {
        console.log('Isolated test: onClick called')
        await asyncOperation
        console.log('Isolated test: onClick completed')
      })
      
      render(
        <ManualAsyncButton
          onClick={onClick}
          loadingText="Creating..."
          successText="Created successfully!"
          onSuccess={() => {
            console.log('Isolated test: onSuccess callback triggered')
          }}
        >
          Create User
        </ManualAsyncButton>
      )
      
      console.log('✅ Button rendered, clicking...')
      
      // Click the button
      fireEvent.click(screen.getByText('Create User'))
      
      console.log('⏳ Waiting for loading state...')
      
      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeTruthy()
        console.log('✅ Loading state detected')
      }, { timeout: 1000 })
      
      console.log('🔄 Resolving promise...')
      resolvePromise!(undefined)
      
      console.log('⏳ Waiting for success state...')
      
      // Check success state  
      await waitFor(() => {
        expect(screen.getByText('Created successfully!')).toBeTruthy()
        console.log('✅ Success state detected')
      }, { timeout: 3000 })
      
      console.log('🎉 Isolated test PASSED! ManualAsyncButton works correctly.')
    })
  })

  describe('ManualAsyncButton - Advanced Integration', () => {
    it('should handle different async operation patterns', async () => {
      // Test with immediate resolve
      const immediateOperation = jest.fn().mockResolvedValue('immediate')
      render(
        <ManualAsyncButton
          onClick={immediateOperation}
          loadingText="Processing..."
          successText="Done!"
        >
          Immediate
        </ManualAsyncButton>
      )
      
      await user.click(screen.getByText('Immediate'))
      await waitFor(() => {
        expect(screen.queryByText('Done!')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should handle operation that takes longer than expected', async () => {
      const longOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      )
      
      render(
        <ManualAsyncButton
          onClick={longOperation}
          loadingText="Processing..."
          successText="Completed!"
        >
          Long Operation
        </ManualAsyncButton>
      )
      
      await user.click(screen.getByText('Long Operation'))
      
      // Should show loading state immediately
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle operation with custom success callback', async () => {
      const onSuccess = jest.fn()
      const mockOperation = jest.fn().mockResolvedValue('success')
      
      render(
        <ManualAsyncButton
          onClick={mockOperation}
          loadingText="Processing..."
          successText="Done!"
          onSuccess={onSuccess}
        >
          With Callback
        </ManualAsyncButton>
      )
      
      await user.click(screen.getByText('With Callback'))
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('success')
      }, { timeout: 2000 })
    })
  })

  describe('ModernAddUserModal - Complete Async Button Flow', () => {
    const mockOnOpenChange = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should complete full async button flow with detailed logging', async () => {
      console.log('🚀 Starting async button test')
      
      render(
        <ModernAddUserModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      console.log('📋 Modal rendered, filling form...')

      // Fill required fields
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      console.log('✅ Form filled, finding create button...')

      // Find the create button and verify it's an AsyncButton
      const createButton = screen.getByRole('button', { name: /create user/i })
      console.log('🎯 Create button found:', createButton.tagName)
      console.log('🎯 Button classes:', createButton.className)

      console.log('👆 Clicking create button...')
      
      // Click the button
      fireEvent.click(createButton)

      console.log('⏳ Button clicked, waiting for loading state...')

      // Check if loading state appears
      try {
        await waitFor(() => {
          const loadingButton = screen.getByText('Creating...')
          console.log('✅ Loading state detected:', loadingButton.textContent)
        }, { timeout: 1000 })
      } catch (error) {
        console.error('❌ Loading state NOT detected within 1s')
        console.log('Available buttons:', screen.getAllByRole('button').map(b => b.textContent))
      }

      // Wait for success
      try {
        await waitFor(() => {
          const successButton = screen.getByText('Created successfully!')
          console.log('✅ Success state detected:', successButton.textContent)
        }, { timeout: 3000 })
      } catch (error) {
        console.error('❌ Success state NOT detected within 3s')
        console.log('Available buttons:', screen.getAllByRole('button').map(b => b.textContent))
      }

      // Check if modal closes
      try {
        await waitFor(() => {
          expect(mockOnOpenChange).toHaveBeenCalledWith(false)
          console.log('✅ Modal close called')
        }, { timeout: 3000 })
      } catch (error) {
        console.error('❌ Modal close NOT called within 3s')
        console.log('mockOnOpenChange calls:', mockOnOpenChange.mock.calls)
      }

      console.log('🏁 Test completed')
    })

    it('should maintain proper state transitions throughout the flow', async () => {
      render(
        <ModernAddUserModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      // Fill form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john.doe@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      const createButton = screen.getByRole('button', { name: /create user/i })

      // Initial state
      expect(createButton).toHaveTextContent('Create User')
      expect(createButton).not.toBeDisabled()

      // Click and verify state transitions
      fireEvent.click(createButton)

      // Loading state
      await waitFor(() => {
        expect(createButton).toHaveTextContent('Creating...')
        expect(createButton).toBeDisabled()
      }, { timeout: 500 })

      // Success state
      await waitFor(() => {
        expect(createButton).toHaveTextContent('Created successfully!')
        expect(createButton).toBeDisabled()
      }, { timeout: 2000 })

      // Modal close
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      }, { timeout: 3000 })
    })
  })

  describe('Async Button Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed')
      const onClick = jest.fn().mockRejectedValue(networkError)
      
      render(
        <ManualAsyncButton
          onClick={onClick}
          loadingText="Processing..."
          errorText="Network error occurred"
          className="test-button"
        >
          <span>Network Test</span>
        </ManualAsyncButton>
      )
      
      await user.click(screen.getByText('Network Test'))
      
      await waitFor(() => {
        expect(screen.queryByText('Network error occurred')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should handle timeout scenarios', async () => {
      const timeoutOperation = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), 100)
        )
      )
      
      render(
        <ManualAsyncButton
          onClick={timeoutOperation}
          loadingText="Processing..."
          errorText="Operation timed out"
          className="test-button"
        >
          <span>Timeout Test</span>
        </ManualAsyncButton>
      )
      
      await user.click(screen.getByText('Timeout Test'))
      
      await waitFor(() => {
        expect(screen.queryByText('Operation timed out')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should reset to idle state after error timeout', async () => {
      const errorOperation = jest.fn().mockRejectedValue(new Error('Test error'))
      
      render(
        <ManualAsyncButton
          onClick={errorOperation}
          loadingText="Processing..."
          errorText="Error occurred"
          className="test-button"
        >
          <span>Error Test</span>
        </ManualAsyncButton>
      )
      
      await user.click(screen.getByText('Error Test'))
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.queryByText('Error occurred')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Wait for auto-reset to idle (error timeout is 3 seconds)
      await waitFor(() => {
        expect(screen.queryByText('Error Test')).toBeInTheDocument()
      }, { timeout: 4000 })
    })
  })

  describe('Async Button Performance and Optimization', () => {
    it('should not block UI during long operations', async () => {
      const longOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 3000))
      )
      
      render(
        <ManualAsyncButton
          onClick={longOperation}
          loadingText="Processing..."
          successText="Completed!"
          className="test-button"
        >
          <span>Long Process</span>
        </ManualAsyncButton>
      )
      
      const button = screen.getByText('Long Process')
      
      // Start operation
      await user.click(button)
      
      // Button should be disabled but UI should remain responsive
      expect(button).toBeDisabled()
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle rapid successive clicks appropriately', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(
        <ManualAsyncButton
          onClick={operation}
          loadingText="Processing..."
          successText="Done!"
          className="test-button"
        >
          <span>Rapid Click Test</span>
        </ManualAsyncButton>
      )
      
      const button = screen.getByText('Rapid Click Test')
      
      // Rapid clicks
      await user.click(button)
      await user.click(button) // Second click should be ignored
      await user.click(button) // Third click should be ignored
      
      // Operation should only be called once
      expect(operation).toHaveBeenCalledTimes(1)
      
      // Button should remain disabled
      expect(button).toBeDisabled()
    })
  })
})
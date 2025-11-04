"use client"

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManualAsyncButton } from '@/components/ui/manual-async-button'

// Test to verify async button visual states are working correctly
describe('ManualAsyncButton Visual States Fix', () => {
  it('should show loading spinner and loading text during async operation', async () => {
    const user = userEvent.setup()
    
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
    const user = userEvent.setup()
    
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
    const user = userEvent.setup()
    
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
})
"use client"

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ManualAsyncButton } from '@/components/ui/manual-async-button'
import userEvent from '@testing-library/user-event'

// Test to debug async button visual states
describe('ManualAsyncButton Visual States Debug', () => {
  it('should show loading spinner and text during loading state', async () => {
    const user = userEvent.setup()
    
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
    const user = userEvent.setup()
    
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
})
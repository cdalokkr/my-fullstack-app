// ============================================
// tests/new-login-form.test.tsx
// Unit tests for the new login form component
// ============================================
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewLoginForm } from '@/components/auth/new-login-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock TRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    auth: {
      login: {
        useMutation: jest.fn(),
      },
    },
  },
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('NewLoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the login form with all required elements', () => {
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Check form elements are present
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    
    // Check accessibility attributes
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-invalid', 'false')
  })

  it('displays validation errors for empty form submission', async () => {
    const user = userEvent.setup()
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Submit form without filling
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('displays email validation error for invalid email format', async () => {
    const user = userEvent.setup()
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Enter invalid email
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    
    // Trigger validation by blurring
    fireEvent.blur(emailInput)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('displays password validation error for weak password', async () => {
    const user = userEvent.setup()
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Enter weak password
    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'weak')
    
    // Trigger validation by blurring
    fireEvent.blur(passwordInput)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
    })
  })

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // First, submit empty form to show errors
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    // Wait for errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
    })
    
    // Then start typing in email field
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'test@example.com')
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/email address is required/i)).not.toBeInTheDocument()
    })
  })

  it('has proper accessibility attributes', () => {
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    // Check ARIA attributes
    expect(emailInput).toHaveAttribute('aria-invalid', 'false')
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
    
    // Check form attributes
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(emailInput).toHaveAttribute('autocomplete', 'email')
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    const mockMutateAsync = jest.fn()
    const mockUseMutation = require('@/lib/trpc/client').trpc.auth.login.useMutation
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: true,
      isError: false,
    })
    
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'ValidPassword123!')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    // Check loading state
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/signing in/i)
  })

  it('displays loading spinner during submission', async () => {
    const user = userEvent.setup()
    const mockMutateAsync = jest.fn()
    const mockUseMutation = require('@/lib/trpc/client').trpc.auth.login.useMutation
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: true,
      isError: false,
    })
    
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'ValidPassword123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    // Check for loading spinner
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  it('shows proper field icons', () => {
    render(<NewLoginForm />, { wrapper: TestWrapper })
    
    // Check for Mail and Lock icons
    const emailSection = screen.getByLabelText(/email address/i).closest('div')
    const passwordSection = screen.getByLabelText(/password/i).closest('div')
    
    expect(emailSection?.querySelector('svg[data-lucide="mail"]')).toBeInTheDocument()
    expect(passwordSection?.querySelector('svg[data-lucide="lock"]')).toBeInTheDocument()
  })
})

// ============================================
// Validation Schema Tests
// ============================================
describe('Login Form Validation Schema', () => {
  it('validates email correctly', () => {
    const { loginSchema } = require('@/components/auth/new-login-form')
    
    // Valid emails
    expect(() => loginSchema.parse({ email: 'test@example.com', password: 'ValidPassword123!' })).not.toThrow()
    expect(() => loginSchema.parse({ email: 'user.name@domain.co.uk', password: 'ValidPassword123!' })).not.toThrow()
    
    // Invalid emails
    expect(() => loginSchema.parse({ email: '', password: 'ValidPassword123!' })).toThrow()
    expect(() => loginSchema.parse({ email: 'invalid', password: 'ValidPassword123!' })).toThrow()
    expect(() => loginSchema.parse({ email: '@domain.com', password: 'ValidPassword123!' })).toThrow()
    expect(() => loginSchema.parse({ email: 'user@', password: 'ValidPassword123!' })).toThrow()
  })

  it('validates password correctly', () => {
    const { loginSchema } = require('@/components/auth/new-login-form')
    
    // Valid passwords
    expect(() => loginSchema.parse({ email: 'test@example.com', password: 'ValidPassword123!' })).not.toThrow()
    expect(() => loginSchema.parse({ email: 'test@example.com', password: 'Ab1!@#$%' })).not.toThrow()
    
    // Invalid passwords
    expect(() => loginSchema.parse({ email: 'test@example.com', password: '' })).toThrow()
    expect(() => loginSchema.parse({ email: 'test@example.com', password: 'weak' })).toThrow()
    expect(() => loginSchema.parse({ email: 'test@example.com', password: '12345678' })).toThrow()
    expect(() => loginSchema.parse({ email: 'test@example.com', password: 'lowercase' })).toThrow()
  })
})
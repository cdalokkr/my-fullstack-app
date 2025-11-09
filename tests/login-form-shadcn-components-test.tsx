// Test file to verify the updated login form with shadcn/ui Form components
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the tRPC client and other dependencies
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        dashboard: {
          getComprehensiveDashboardData: { prefetch: jest.fn() },
          getCriticalDashboardData: { prefetch: jest.fn() },
          getSecondaryDashboardData: { prefetch: jest.fn() },
          getDetailedDashboardData: { prefetch: jest.fn() },
          getStats: { prefetch: jest.fn() },
          getRecentActivities: { prefetch: jest.fn() },
        },
        analytics: {
          getAnalytics: { prefetch: jest.fn() },
        },
      },
    }),
    auth: {
      login: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          data: null,
        }),
      },
    },
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Test component wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('LoginForm with shadcn/ui Form Components', () => {
  it('renders the login form with all expected elements', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    // Check that the form elements are present
    expect(screen.getByText(/email address/i)).toBeInTheDocument()
    expect(screen.getByText(/password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByText(/only existing users can log in/i)).toBeInTheDocument()
  })

  it('has proper form structure with shadcn/ui components', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    // Check for form elements that should be present
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
  })

  it('handles form input changes', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Test input changes
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })
})

// This is a basic structural test to ensure the form compiles and renders
// without errors when using the shadcn/ui Form components pattern
console.log('Login form test file created successfully')
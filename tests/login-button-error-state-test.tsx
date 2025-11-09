// Test to verify login button error state on failed authentication
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'
import { trpc } from '@/lib/trpc/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock TRPC client
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: jest.fn(() => ({
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
    })),
    auth: {
      login: {
        useMutation: jest.fn(),
      },
    },
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockLoginMutation = {
  mutateAsync: jest.fn(),
  data: null,
  error: null,
  isLoading: false,
}

describe('Login Button Error State', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(trpc.auth.login.useMutation as jest.Mock).mockReturnValue(mockLoginMutation)
  })

  it('should show error state when authentication fails', async () => {
    // Simulate authentication failure
    const authError = {
      message: 'Invalid email or password',
      cause: { type: 'INVALID_CREDENTIALS', field: 'both' }
    }
    mockLoginMutation.mutateAsync.mockRejectedValue(authError)

    render(
      <LoginForm />,
      { wrapper: createWrapper() }
    )

    const emailInput = screen.getByLabelText('Email Address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Fill form with credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

    // Click submit button
    fireEvent.click(submitButton)

    // Should show loading state first
    await waitFor(() => {
      expect(screen.getByText('Authenticating...')).toBeInTheDocument()
    })

    // Should eventually show error state
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Should show error message in the form
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Both fields should be highlighted
    expect(emailInput.closest('div')).toHaveClass('border-red-500')
    expect(passwordInput.closest('div')).toHaveClass('border-red-500')
  })

  it('should show error state for email not found', async () => {
    const authError = {
      message: 'Email address is not registered',
      cause: { type: 'EMAIL_NOT_FOUND', field: 'email' }
    }
    mockLoginMutation.mutateAsync.mockRejectedValue(authError)

    render(
      <LoginForm />,
      { wrapper: createWrapper() }
    )

    const emailInput = screen.getByLabelText('Email Address')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'somepassword' } })
    fireEvent.click(submitButton)

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Should show specific error message
    await waitFor(() => {
      expect(screen.getByText('Email address is not registered')).toBeInTheDocument()
    })

    // Only email field should be highlighted
    expect(emailInput.closest('div')).toHaveClass('border-red-500')
  })

  it('should show error state for incorrect password', async () => {
    const authError = {
      message: 'Incorrect password',
      cause: { type: 'INCORRECT_PASSWORD', field: 'password' }
    }
    mockLoginMutation.mutateAsync.mockRejectedValue(authError)

    render(
      <LoginForm />,
      { wrapper: createWrapper() }
    )

    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Fill form with correct email but wrong password
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Should show specific error message
    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument()
    })

    // Only password field should be highlighted
    expect(passwordInput.closest('div')).toHaveClass('border-red-500')
  })

  it('should show success state when authentication succeeds', async () => {
    // Simulate successful authentication
    mockLoginMutation.mutateAsync.mockResolvedValue({
      success: true,
      profile: { id: '1', role: 'user' }
    })

    render(
      <LoginForm />,
      { wrapper: createWrapper() }
    )

    const emailInput = screen.getByLabelText('Email Address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Fill form with correct credentials
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } })
    fireEvent.click(submitButton)

    // Should show loading state first
    await waitFor(() => {
      expect(screen.getByText('Authenticating...')).toBeInTheDocument()
    })

    // Should eventually show success state
    await waitFor(() => {
      expect(screen.getByText('Success! Redirecting...')).toBeInTheDocument()
    }, { timeout: 8000 })
  })
})
// ============================================
// tests/enhanced-login-error-handling-comprehensive-test.tsx
// Comprehensive Test Suite for Enhanced Login Error Handling
// ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'
import { trpc } from '@/lib/trpc/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockLoginMutation = {
  mutateAsync: jest.fn(),
  data: null,
  error: null,
  isLoading: false,
}

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Enhanced Login Error Handling with Zod', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(trpc.auth.login.useMutation as jest.Mock).mockReturnValue(mockLoginMutation)
  })

  describe('Zod Client-Side Validation', () => {
    it('should show "Email is required" for empty email field', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Leave email empty, enter password
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })

      expect(emailInput).toHaveClass('border-red-500')
      expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
    })

    it('should show "Password is required" for empty password field', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Enter email, leave password empty
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })

      expect(passwordInput).toHaveClass('border-red-500')
      expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
    })

    it('should show "Invalid email address" for invalid email format', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Enter invalid email format
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      expect(emailInput).toHaveClass('border-red-500')
      expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('Enhanced Server Error Handling', () => {
    it('should show "Invalid email or password" with "Email id not found" for email field error', async () => {
      // Mock email not found error
      const mockError = {
        message: 'User not found',
        cause: { field: 'email' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form with nonexistent email
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'somepassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: 'nonexistent@example.com',
          password: 'somepassword',
        })
      })

      // Check base error message
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      // Check specific field error
      await waitFor(() => {
        expect(screen.getByText('Email id not found')).toBeInTheDocument()
      })

      // Check red border only on email field
      expect(emailInput).toHaveClass('border-red-500')
      expect(passwordInput).not.toHaveClass('border-red-500')

      // Check LoginButton error state (should be red)
      await waitFor(() => {
        expect(submitButton.closest('button')).toHaveClass('bg-red-600')
      })
    })

    it('should show "Invalid email or password" with "Password not matched" for password field error', async () => {
      // Mock password incorrect error
      const mockError = {
        message: 'Invalid password',
        cause: { field: 'password' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form with valid email but wrong password
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: 'existing@example.com',
          password: 'wrongpassword',
        })
      })

      // Check base error message
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      // Check specific field error
      await waitFor(() => {
        expect(screen.getByText('Password not matched')).toBeInTheDocument()
      })

      // Check red border only on password field
      expect(emailInput).not.toHaveClass('border-red-500')
      expect(passwordInput).toHaveClass('border-red-500')

      // Check LoginButton error state
      await waitFor(() => {
        expect(submitButton.closest('button')).toHaveClass('bg-red-600')
      })
    })

    it('should show "Invalid email or password" with both field errors for both fields wrong', async () => {
      // Mock both fields incorrect error
      const mockError = {
        message: 'Invalid credentials',
        cause: { field: 'both' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form with wrong credentials
      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      })

      // Check base error message
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      // Check both field errors
      await waitFor(() => {
        expect(screen.getByText('Email id not found')).toBeInTheDocument()
        expect(screen.getByText('Password not matched')).toBeInTheDocument()
      })

      // Check red border on both fields
      expect(emailInput).toHaveClass('border-red-500')
      expect(passwordInput).toHaveClass('border-red-500')

      // Check LoginButton error state
      await waitFor(() => {
        expect(submitButton.closest('button')).toHaveClass('bg-red-600')
      })
    })
  })

  describe('Error Clearing Behavior', () => {
    it('should clear email field error when user starts typing in email field', async () => {
      const mockError = {
        message: 'User not found',
        cause: { field: 'email' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Trigger initial error
      fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } })
      fireEvent.change(passwordInput, { target: { value: 'somepassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email id not found')).toBeInTheDocument()
      })

      // Clear and start typing in email field
      fireEvent.change(emailInput, { target: { value: 'new@email.com' } })

      // Email field error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Email id not found')).not.toBeInTheDocument()
      })

      // Base error should also be cleared since it was field-specific
      await waitFor(() => {
        expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
      })
    })

    it('should clear password field error when user starts typing in password field', async () => {
      const mockError = {
        message: 'Invalid password',
        cause: { field: 'password' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Trigger initial error
      fireEvent.change(emailInput, { target: { value: 'valid@email.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password not matched')).toBeInTheDocument()
      })

      // Clear and start typing in password field
      fireEvent.change(passwordInput, { target: { value: 'newpassword' } })

      // Password field error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Password not matched')).not.toBeInTheDocument()
      })

      // Base error should also be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
      })
    })
  })

  describe('LoginButton Error State Management', () => {
    it('should show error state on LoginButton during authentication failures', async () => {
      const mockError = {
        message: 'Authentication failed',
        cause: { field: 'email' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')

      // Submit form to trigger error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Check that button shows error state (red background)
      await waitFor(() => {
        const button = submitButton.closest('button')
        expect(button).toHaveClass('bg-red-600')
        expect(button).toHaveClass('hover:bg-red-700')
      }, { timeout: 2000 })

      // Button should show error text
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Authentication failed')
      })
    })
  })
})
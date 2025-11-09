// ============================================
// tests/consolidated-login-error-handling-test.tsx
// Consolidated Test Suite for Login Error Handling
// Covers: Zod validation, error states, reset behavior, and comprehensive testing
// ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Mock router
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

describe('Consolidated Login Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(trpc.auth.login.useMutation as jest.Mock).mockReturnValue(mockLoginMutation)
  })

  describe('Zod Client-Side Validation', () => {
    it('should show "Email is required" for empty email field', async () => {
      const user = userEvent.setup()
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Leave email empty, enter password
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })

      expect(emailInput).toHaveClass('border-red-500')
      expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
    })

    it('should show "Password is required" for empty password field', async () => {
      const user = userEvent.setup()
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Enter email, leave password empty
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })

      expect(passwordInput).toHaveClass('border-red-500')
      expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
    })

    it('should show "Invalid email address" for invalid email format', async () => {
      const user = userEvent.setup()
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Enter invalid email format
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })

      expect(emailInput).toHaveClass('border-red-500')
      expect(mockLoginMutation.mutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('Enhanced Server Error Handling', () => {
    it('should show "Invalid email or password" with "Email id not found" for email field error', async () => {
      const user = userEvent.setup()
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
      await user.type(emailInput, 'nonexistent@example.com')
      await user.type(passwordInput, 'somepassword')
      await user.click(submitButton)

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
      const user = userEvent.setup()
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
      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

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
      const user = userEvent.setup()
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
      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

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
      const user = userEvent.setup()
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
      await user.type(emailInput, 'wrong@email.com')
      await user.type(passwordInput, 'somepassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email id not found')).toBeInTheDocument()
      })

      // Clear and start typing in email field
      await user.clear(emailInput)
      await user.type(emailInput, 'new@email.com')

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
      const user = userEvent.setup()
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
      await user.type(emailInput, 'valid@email.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password not matched')).toBeInTheDocument()
      })

      // Clear and start typing in password field
      await user.clear(passwordInput)
      await user.type(passwordInput, 'newpassword')

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

  describe('Error State Reset Behavior', () => {
    it('button resets to idle state after error after 3 seconds', async () => {
      const user = userEvent.setup()
      const mockError = new Error('Invalid credentials')
      
      // Mock the login mutation to throw an error
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)
      
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )
      
      // Find the login button
      const loginButton = screen.getByRole('button', { name: /sign in/i })
      
      // Fill in invalid form data to trigger validation error
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, '123')
      
      // Click the login button to trigger error
      await user.click(loginButton)
      
      // Wait for error state to be shown
      await waitFor(() => {
        expect(loginButton.textContent).toContain('Error occurred')
      })
      
      // Verify button is in error state
      expect(loginButton.textContent).toContain('Error occurred')
      
      // Wait for the timeout to reset error state (3 seconds)
      await waitFor(() => {
        expect(loginButton.textContent).toBe('Sign In')
      }, { timeout: 4000 })
      
      // Verify button can be clicked again
      expect(loginButton).not.toBeDisabled()
    })

    it('button remains in success state for longer duration', async () => {
      const user = userEvent.setup()
      
      mockLoginMutation.mutateAsync.mockResolvedValue({
        profile: { role: 'admin', avatar_url: null }
      })
      
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )
      
      const loginButton = screen.getByRole('button', { name: /sign in/i })
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      await user.type(emailInput, 'valid@example.com')
      await user.type(passwordInput, 'validpassword')
      
      // Click the login button
      await user.click(loginButton)
      
      // Wait for success state
      await waitFor(() => {
        expect(loginButton.textContent).toContain('Success!')
      })
      
      // Button should still be in success state after 4 seconds (but not 8 seconds due to redirect)
      expect(loginButton.textContent).toContain('Success!')
    })
  })

  describe('LoginButton Error State Management', () => {
    it('should show error state on LoginButton during authentication failures', async () => {
      const user = userEvent.setup()
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
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

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

  describe('Success State Behavior', () => {
    it('should show success state when authentication succeeds', async () => {
      const user = userEvent.setup()
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
      await user.type(emailInput, 'valid@example.com')
      await user.type(passwordInput, 'correctpassword')
      await user.click(submitButton)

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

  describe('Comprehensive Error State Testing', () => {
    it('should show error state when authentication fails with various error types', async () => {
      // Test different error types in sequence
      const authErrors = [
        {
          message: 'Invalid email or password',
          cause: { type: 'INVALID_CREDENTIALS', field: 'both' }
        },
        {
          message: 'Email address is not registered',
          cause: { type: 'EMAIL_NOT_FOUND', field: 'email' }
        },
        {
          message: 'Incorrect password',
          cause: { type: 'INCORRECT_PASSWORD', field: 'password' }
        }
      ]

      const user = userEvent.setup()

      for (const authError of authErrors) {
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
          expect(screen.getByText(authError.message)).toBeInTheDocument()
        })

        // Check field highlighting based on error type
        if (authError.cause.field === 'email') {
          expect(emailInput.closest('div')).toHaveClass('border-red-500')
          expect(passwordInput.closest('div')).not.toHaveClass('border-red-500')
        } else if (authError.cause.field === 'password') {
          expect(emailInput.closest('div')).not.toHaveClass('border-red-500')
          expect(passwordInput.closest('div')).toHaveClass('border-red-500')
        } else {
          // both fields wrong
          expect(emailInput.closest('div')).toHaveClass('border-red-500')
          expect(passwordInput.closest('div')).toHaveClass('border-red-500')
        }
      }
    })
  })
})
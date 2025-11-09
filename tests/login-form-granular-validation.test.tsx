// ============================================
// tests/login-form-granular-validation.test.tsx
// Comprehensive Test Suite for Enhanced Login Form Validation
// ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
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

describe('Enhanced Login Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(trpc.auth.login.useMutation as jest.Mock).mockReturnValue(mockLoginMutation)
  })

  describe('Email Format Validation', () => {
    it('should allow invalid email formats to reach server for validation', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Test invalid email formats - should still proceed to server
      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@domain.com',
        'user@',
        'user.domain.com',
        'user@domain',
      ]

      for (const invalidEmail of invalidEmails) {
        fireEvent.change(emailInput, { target: { value: invalidEmail } })
        fireEvent.change(passwordInput, { target: { value: 'somepassword' } })
        fireEvent.click(submitButton)

        // Should still make API call to let server handle validation
        await waitFor(() => {
          expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
            email: invalidEmail,
            password: 'somepassword',
          })
        }, { timeout: 3000 })

        // Clear form for next iteration
        fireEvent.change(emailInput, { target: { value: '' } })
        fireEvent.change(passwordInput, { target: { value: '' } })
        mockLoginMutation.mutateAsync.mockClear()
      }
    })

    it('should clear email errors when user types valid email', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')

      // User starts typing - errors should clear on type
      fireEvent.change(emailInput, { target: { value: 'valid@email.com' } })

      // Should not show format errors since we allow server validation
      expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument()
      expect(emailInput).not.toHaveClass('border-red-500')
    })
  })

  describe('Backend Error Handling', () => {
    const createMockError = (message: string, cause?: { type: string; field: string }) => ({
      message,
      cause,
    })

    it('should make API call with valid credentials and handle EMAIL_NOT_FOUND error', async () => {
      const mockError = createMockError('Email address is not registered', {
        type: 'EMAIL_NOT_FOUND',
        field: 'email'
      })

      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form with valid credentials
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'somepassword' } })

      // Submit form - should proceed to API call
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: 'nonexistent@example.com',
          password: 'somepassword',
        })
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(screen.getByText('Email address is not registered')).toBeInTheDocument()
      })

      // Email field should be highlighted for this error type
      expect(emailInput).toHaveClass('border-red-500')
    })

    it('should make API call with valid credentials and handle INCORRECT_PASSWORD error', async () => {
      const mockError = createMockError('Incorrect password', {
        type: 'INCORRECT_PASSWORD',
        field: 'password'
      })

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

      // Submit form - should proceed to API call
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: 'existing@example.com',
          password: 'wrongpassword',
        })
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })

      // Password field should be highlighted for this error type
      expect(passwordInput).toHaveClass('border-red-500')
    })

    it('should make API call with valid credentials and handle INVALID_CREDENTIALS error', async () => {
      const mockError = createMockError('Invalid email or password', {
        type: 'INVALID_CREDENTIALS',
        field: 'both'
      })

      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      // Submit form - should proceed to API call
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      // Both fields should be highlighted for this error type
      expect(emailInput).toHaveClass('border-red-500')
      expect(passwordInput).toHaveClass('border-red-500')
    })

    it('should handle NETWORK_ERROR with general error message', async () => {
      const mockError = createMockError('Network error. Please check your connection and try again.', {
        type: 'NETWORK_ERROR',
        field: 'both'
      })

      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })

      // Submit form
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })

      // No field-specific highlighting for network errors
      expect(emailInput).not.toHaveClass('border-red-500')
      expect(passwordInput).not.toHaveClass('border-red-500')
    })
  })

  describe('Error Clearing Behavior', () => {
    it('should clear errors when user starts typing in respective fields', async () => {
      const mockError = {
        message: 'Email address is not registered',
        cause: { type: 'EMAIL_NOT_FOUND', field: 'email' }
      }
      mockLoginMutation.mutateAsync.mockRejectedValue(mockError)

      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Submit to trigger error
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email address is not registered')).toBeInTheDocument()
      })

      // Clear email error by typing
      fireEvent.change(emailInput, { target: { value: 'newemail@' } })

      await waitFor(() => {
        expect(screen.queryByText('Email address is not registered')).not.toBeInTheDocument()
      })
    })

    it('should clear field errors on successful login', async () => {
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

      // Fill form with valid credentials
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalled()
      })

      // Success state should be shown (no errors)
      expect(screen.queryByText('Email address is not registered')).not.toBeInTheDocument()
      expect(screen.queryByText('Incorrect password')).not.toBeInTheDocument()
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty email and password submission', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Submit empty form
      fireEvent.click(submitButton)

      // Should show basic required field errors
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('should handle long email address by allowing it to reach server validation', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Use a long but valid email format
      const longEmail = 'user@' + 'a'.repeat(100) + '.com'
      fireEvent.change(emailInput, { target: { value: longEmail } })
      fireEvent.change(passwordInput, { target: { value: 'somepassword' } })

      // Submit form - should proceed to server validation
      fireEvent.click(submitButton)

      // Should make API call with the long email (server will validate format)
      await waitFor(() => {
        expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith({
          email: longEmail,
          password: 'somepassword',
        })
      }, { timeout: 3000 })
    })

    it('should handle special characters in email', async () => {
      render(
        <LoginForm />,
        { wrapper: createWrapper() }
      )

      const emailInput = screen.getByLabelText('Email Address')
      
      // Valid special characters
      const specialEmails = [
        'user+tag@domain.com',
        'user.name@domain.com',
        'user_name@domain.com',
        'user-name@domain.com',
      ]

      for (const email of specialEmails) {
        fireEvent.change(emailInput, { target: { value: email } })
        fireEvent.blur(emailInput)
        
        await waitFor(() => {
          expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument()
        })
      }
    })
  })
})
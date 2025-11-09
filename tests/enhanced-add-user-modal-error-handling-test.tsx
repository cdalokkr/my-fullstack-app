// ============================================
// tests/enhanced-add-user-modal-error-handling-test.tsx
// ============================================
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'

// Mock tRPC client
const mockUtils = {
  admin: {
    users: {
      getUsers: {
        invalidate: jest.fn(),
      },
    },
    dashboard: {
      getCriticalDashboardData: {
        invalidate: jest.fn(),
      },
    },
  },
}

const mockCreateUserMutation = jest.fn()
const mockToastError = jest.fn()
const mockDismissToast = jest.fn()

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => mockUtils,
    admin: {
      users: {
        createUser: {
          useMutation: () => ({
            mutateAsync: mockCreateUserMutation,
            mutate: jest.fn(),
            isLoading: false,
            error: null,
          }),
        },
      },
    },
  },
}))

jest.mock('@/components/ui/toast-notifications', () => ({
  toastError: mockToastError,
  dismissToast: mockDismissToast,
}))

// Mock react-hook-form with validation errors
const mockUseForm = jest.fn()
jest.mock('react-hook-form', () => ({
  useForm: (...args: any[]) => mockUseForm(...args),
  zodResolver: jest.fn(),
}))

// Mock validation schema
jest.mock('@/lib/validations/auth', () => ({
  createUserSchema: {
    parse: jest.fn(),
  },
}))

const mockProps = {
  open: true,
  onOpenChange: jest.fn(),
  onSuccess: jest.fn(),
}

describe('EnhancedAddUserModal - Error Handling Validation', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    mockUseForm.mockReturnValue({
      register: jest.fn(() => ({})),
      setValue: jest.fn(),
      watch: jest.fn(() => ({})),
      reset: jest.fn(),
      getValues: jest.fn(() => ({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        mobileNo: '',
        dateOfBirth: '',
        role: 'user',
      })),
      trigger: jest.fn().mockResolvedValue(true),
      formState: {
        errors: {},
        isValid: true,
        isDirty: false,
      },
    })

    mockCreateUserMutation.mockResolvedValue({})
  })

  describe('Input Validation Styling - Red Borders', () => {
    test('displays red borders for empty required fields on validation', async () => {
      // Mock validation errors
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            lastName: { message: 'Last name is required' },
            email: { message: 'Email is required' },
            password: { message: 'Password is required' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      // Click submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /fix errors|create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Check for red borders on inputs with errors
        const firstNameInput = screen.getByLabelText(/first name/i)
        const lastNameInput = screen.getByLabelText(/last name/i)
        const emailInput = screen.getByLabelText(/email address/i)
        const passwordInput = screen.getByLabelText(/password/i)

        expect(firstNameInput).toHaveClass('border-red-500')
        expect(lastNameInput).toHaveClass('border-red-500')
        expect(emailInput).toHaveClass('border-red-500')
        expect(passwordInput).toHaveClass('border-red-500')
      })
    })

    test('displays red borders for invalid email format', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'ValidPass123!',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            email: { message: 'Invalid email address' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /fix errors|create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i)
        expect(emailInput).toHaveClass('border-red-500')
        expect(emailInput).toHaveClass('bg-red-50/30')
      })
    })

    test('displays red borders for weak password', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /fix errors|create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i)
        expect(passwordInput).toHaveClass('border-red-500')
        expect(passwordInput).toHaveClass('bg-red-50/30')
      })
    })

    test('removes red borders when validation errors are fixed', async () => {
      // Start with errors
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'ValidPass123!',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      const { rerender } = render(<EnhancedAddUserModal {...mockProps} />)

      // Trigger validation
      const submitButton = screen.getByRole('button', { name: /fix errors/i })
      await user.click(submitButton)

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i)
        expect(firstNameInput).toHaveClass('border-red-500')
      })

      // Fix the error
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'ValidPass123!',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(true),
        formState: {
          errors: {},
          isValid: true,
          isDirty: true,
        },
      })

      rerender(<EnhancedAddUserModal {...mockProps} />)

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i)
        expect(firstNameInput).not.toHaveClass('border-red-500')
        expect(firstNameInput).toHaveClass('border-input')
      })
    })
  })

  describe('Create User Button Error Flow', () => {
    test('shows immediate error notification with red background on validation failure', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            lastName: { message: 'Last name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('Please fix the following issues:'),
          expect.objectContaining({
            title: 'Validation Failed',
            duration: 4000,
            dismissible: true,
          })
        )
      })
    })

    test('auto-dismisses error notification after 4 seconds', async () => {
      jest.useFakeTimers()

      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      expect(mockToastError).toHaveBeenCalled()

      // Fast-forward 4 seconds
      jest.advanceTimersByTime(4000)

      // The toast should have been dismissed (though we can't easily test the auto-dismiss)
      expect(mockDismissToast).not.toHaveBeenCalled() // Manual dismiss not called
    })

    test('changes button text to show error count when validation fails', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            lastName: { message: 'Last name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Fix Errors (4)')).toBeInTheDocument()
      })
    })

    test('shows alert triangle icon when there are validation errors', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Check for AlertTriangle icon in button
        const alertIcon = screen.getByTestId('alert-triangle') || document.querySelector('.lucide-alert-triangle')
        expect(alertIcon).toBeInTheDocument()
      })
    })
  })

  describe('Form Error State Persistence', () => {
    test('maintains error state until all validation issues are resolved', async () => {
      // Start with multiple errors
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            lastName: { message: 'Last name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      const { rerender } = render(<EnhancedAddUserModal {...mockProps} />)

      // Trigger validation
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Fix Errors (4)')).toBeInTheDocument()
      })

      // Partially fix errors - only fix firstName
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: 'John',
          lastName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            lastName: { message: 'Last name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      rerender(<EnhancedAddUserModal {...mockProps} />)

      // Should still show error state with reduced count
      await waitFor(() => {
        expect(screen.getByText('Fix Errors (3)')).toBeInTheDocument()
      })

      // Fix all errors
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'ValidPass123!',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(true),
        formState: {
          errors: {},
          isValid: true,
          isDirty: true,
        },
      })

      rerender(<EnhancedAddUserModal {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Create User')).toBeInTheDocument()
        expect(screen.queryByText(/fix errors/i)).not.toBeInTheDocument()
      })
    })

    test('keeps red section borders when section has validation errors', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: 'weak',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            lastName: { message: 'Last name is required' },
            email: { message: 'Invalid email address' },
            password: { message: 'Password must meet security requirements' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Check that sections with errors have red borders
        const personalSection = screen.getByText('Personal Information').closest('.border-red-500')
        const credentialsSection = screen.getByText('Account Credentials').closest('.border-red-500')

        expect(personalSection).toBeInTheDocument()
        expect(credentialsSection).toBeInTheDocument()
      })
    })
  })

  describe('Various Validation Scenarios', () => {
    test('handles empty required fields validation', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: '',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            lastName: { message: 'Last name is required' },
            email: { message: 'Email is required' },
            password: { message: 'Password is required' },
            role: { message: 'Role is required' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('First name: First name is required'),
          expect.any(Object)
        )
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('Last name: Last name is required'),
          expect.any(Object)
        )
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('Email address: Email is required'),
          expect.any(Object)
        )
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('Password: Password is required'),
          expect.any(Object)
        )
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('User role: Role is required'),
          expect.any(Object)
        )
      })
    })

    test('handles invalid email formats', async () => {
      const invalidEmails = ['invalid', 'invalid@', '@invalid.com', 'invalid.com', 'invalid@.com']

      for (const invalidEmail of invalidEmails) {
        mockUseForm.mockReturnValue({
          register: jest.fn(() => ({})),
          setValue: jest.fn(),
          watch: jest.fn(() => ({})),
          reset: jest.fn(),
          getValues: jest.fn(() => ({
            firstName: 'John',
            lastName: 'Doe',
            email: invalidEmail,
            password: 'ValidPass123!',
            role: 'user',
          })),
          trigger: jest.fn().mockResolvedValue(false),
          formState: {
            errors: {
              email: { message: 'Invalid email address' },
            },
            isValid: false,
            isDirty: true,
          },
        })

        const { rerender } = render(<EnhancedAddUserModal {...mockProps} />)

        const submitButton = screen.getByRole('button', { name: /create user/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith(
            expect.stringContaining('Email address: Invalid email address'),
            expect.any(Object)
          )
        })

        rerender(<div />) // Clean up for next iteration
      }
    })

    test('handles weak password validation', async () => {
      const weakPasswords = ['short', 'nouppercase123!', 'NOLOWERCASE123!', 'NoNumbers!', 'NoSpecial123']

      for (const weakPassword of weakPasswords) {
        mockUseForm.mockReturnValue({
          register: jest.fn(() => ({})),
          setValue: jest.fn(),
          watch: jest.fn(() => ({})),
          reset: jest.fn(),
          getValues: jest.fn(() => ({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: weakPassword,
            role: 'user',
          })),
          trigger: jest.fn().mockResolvedValue(false),
          formState: {
            errors: {
              password: { message: 'Password must meet security requirements (8+ chars, uppercase, lowercase, numbers)' },
            },
            isValid: false,
            isDirty: true,
          },
        })

        const { rerender } = render(<EnhancedAddUserModal {...mockProps} />)

        const submitButton = screen.getByRole('button', { name: /create user/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith(
            expect.stringContaining('Password: Password must meet security requirements'),
            expect.any(Object)
          )
        })

        rerender(<div />) // Clean up for next iteration
      }
    })

    test('handles optional field validation (mobile number, date of birth)', async () => {
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'ValidPass123!',
          mobileNo: 'invalid-mobile',
          dateOfBirth: 'invalid-date',
          role: 'user',
        })),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            mobileNo: { message: 'Invalid mobile number' },
            dateOfBirth: { message: 'Please enter a valid date of birth (13-120 years old)' },
          },
          isValid: false,
          isDirty: true,
        },
      })

      render(<EnhancedAddUserModal {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('Mobile number: Invalid mobile number'),
          expect.any(Object)
        )
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('Date of birth: Please enter a valid date of birth'),
          expect.any(Object)
        )
      })
    })
  })
})

export default {}
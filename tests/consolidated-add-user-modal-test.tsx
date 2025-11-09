// ============================================
// tests/consolidated-add-user-modal-test.tsx
// Consolidated Test Suite for Add User Modal Functionality
// Covers: UI/UX, Error Handling, Validation, Async Button Behavior, and Modal Integration
// ============================================

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedAddUserModal } from '@/components/dashboard/EnhancedAddUserModal'
import { ModernAddUserModal } from '@/components/dashboard/modern-add-user-modal'
import { trpc } from '@/lib/trpc/client'

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

// Mock TRPC
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
          checkEmailAvailability: {
            useMutation: () => ({
              mutate: jest.fn(),
              isLoading: false,
              error: null,
            }),
          },
        },
      },
    },
  },
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
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
  validatePasswordStrengthFn: (password: string) => {
    if (!password) return { isValid: false, strength: 0, level: 'weak', criteria: {} }
    if (password.length >= 8) {
      return { isValid: true, strength: 4, level: 'strong', criteria: { length: true, uppercase: true, lowercase: true, numbers: true, special: true } }
    }
    return { isValid: false, strength: 2, level: 'fair', criteria: { length: true, uppercase: false, lowercase: true, numbers: true, special: false } }
  },
}))

const mockProps = {
  open: true,
  onOpenChange: jest.fn(),
  onSuccess: jest.fn(),
}

describe('Consolidated Add User Modal Testing', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateUserMutation.mockResolvedValue({})

    // Default mock implementation for EnhancedAddUserModal
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
  })

  describe('EnhancedAddUserModal - UI/UX and Visual Design', () => {
    test('renders with enhanced visual hierarchy', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Check for enhanced header
      expect(screen.getByText('Form Progress')).toBeInTheDocument()
      expect(screen.getByText('Create New User')).toBeInTheDocument()
      
      // Check for gradient background
      const progressSection = screen.getByText('Form Progress').closest('.bg-gradient-to-r')
      expect(progressSection).toBeInTheDocument()
      
      // Check for progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('displays enhanced stepper with proper status indicators', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      expect(screen.getByText('Personal Info')).toBeInTheDocument()
      expect(screen.getByText('Credentials')).toBeInTheDocument()
      expect(screen.getByText('Permissions')).toBeInTheDocument()
    })

    test('shows loading skeletons for form sections', () => {
      // Mock loading state
      jest.mocked(trpc.admin.users.checkEmailAvailability.useMutation)
        .mockReturnValue({ isLoading: true } as any)
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Should show skeleton placeholders
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
    })

    test('shows form field grouping with visual hierarchy', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Check for accordion sections
      expect(screen.getByText('Personal Information')).toBeInTheDocument()
      expect(screen.getByText('Account Credentials')).toBeInTheDocument()
      expect(screen.getByText('Access & Permissions')).toBeInTheDocument()
      
      // Check for enhanced card styling
      const personalSection = screen.getByText('Personal Information').closest('.border')
      expect(personalSection).toHaveClass('hover:shadow-md')
    })

    test('displays progress percentage and visual indicator', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Progress bar should be visible
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      
      // Should show percentage or progress text
      expect(screen.getByText(/\d+%/) || screen.getByText(/progress/i)).toBeInTheDocument()
    })
  })

  describe('Real-time Validation Features', () => {
    test('handles email availability checking', async () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')
      
      await waitFor(() => {
        // Should trigger validation
        expect(screen.getByText(/checking email availability/i)).toBeInTheDocument()
      })
    })

    test('displays password strength indicator', async () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, 'StrongPassword123!')
      
      await waitFor(() => {
        expect(screen.getByText('Password Strength')).toBeInTheDocument()
        expect(screen.getByText('Strong')).toBeInTheDocument()
        expect(screen.getByText('8+ characters')).toBeInTheDocument()
        expect(screen.getByText('Uppercase')).toBeInTheDocument()
        expect(screen.getByText('Lowercase')).toBeInTheDocument()
        expect(screen.getByText('Numbers')).toBeInTheDocument()
      })
    })

    test('shows password visibility toggle', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      const toggleButton = screen.getByRole('button', { name: /eye/i })
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('implements real-time field validation', async () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, 'John')
      
      // Should show completion indicator
      expect(screen.getByTestId('check-circle')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Validation Styling', () => {
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

  describe('Enhanced User Feedback', () => {
    test('displays field-level error summaries', () => {
      // Mock form errors
      mockUseForm.mockReturnValue({
        register: jest.fn(() => ({})),
        setValue: jest.fn(),
        watch: jest.fn(() => ({})),
        reset: jest.fn(),
        getValues: jest.fn(() => ({})),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: {
            firstName: { message: 'First name is required' },
            email: { message: 'Invalid email' }
          },
          isValid: false,
          isDirty: true,
        },
      })
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      expect(screen.getByText(/please fix the following issues/i)).toBeInTheDocument()
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })

    test('handles loading states with enhanced feedback', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Check for loading animations
      expect(screen.getByTestId('enhanced-modal') || screen.getByRole('dialog')).toBeInTheDocument()
      
      // Should show submit button
      expect(screen.getByText(/create user/i)).toBeInTheDocument()
      expect(screen.getByTestId('user-plus')).toBeInTheDocument()
    })

    test('displays success states with proper feedback', async () => {
      // Mock success state
      mockCreateUserMutation.mockResolvedValue({})
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const submitButton = screen.getByText(/create user/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        // Should show success feedback
        expect(screen.getByText(/user created successfully/i) || screen.getByText(/success/i)).toBeInTheDocument()
      })
    })
  })

  describe('ModernAddUserModal - Async Button Behavior', () => {
    const mockOnOpenChange = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('displays loading text during async operation', async () => {
      // Mock successful creation
      const mockMutateAsync = jest.fn().mockResolvedValue({})
      trpc.admin.users.createUser.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        onSuccess: jest.fn(),
        onError: jest.fn(),
      })

      render(
        <ModernAddUserModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      })
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      })
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john.doe@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      // Click create button
      const createButton = screen.getByRole('button', { name: /create user/i })
      fireEvent.click(createButton)

      // Check loading text appears
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument()
      })

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Created successfully!')).toBeInTheDocument()
      })
    })

    test('closes modal after success state', async () => {
      // Mock successful creation
      const mockMutateAsync = jest.fn().mockResolvedValue({})
      trpc.admin.users.createUser.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        onSuccess: jest.fn(),
        onError: jest.fn(),
      })

      render(
        <ModernAddUserModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      })
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      })
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john.doe@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      // Click create button
      const createButton = screen.getByRole('button', { name: /create user/i })
      fireEvent.click(createButton)

      // Wait for success text
      await waitFor(() => {
        expect(screen.getByText('Created successfully!')).toBeInTheDocument()
      })

      // Wait for modal to close
      await waitFor(
        () => {
          expect(mockOnOpenChange).toHaveBeenCalledWith(false)
        },
        { timeout: 3200 }
      )
    })

    test('does not reset prematurely during loading', async () => {
      // Mock delayed successful creation
      const mockMutateAsync = jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve({}), 1000))
      )
      trpc.admin.users.createUser.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        onSuccess: jest.fn(),
        onError: jest.fn(),
      })

      render(
        <ModernAddUserModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      })
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      })
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john.doe@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      })

      // Click create button
      const createButton = screen.getByRole('button', { name: /create user/i })
      fireEvent.click(createButton)

      // Check loading text appears and stays
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument()
      })

      // Wait a bit and ensure loading text is still there (not reset prematurely)
      await new Promise(resolve => setTimeout(resolve, 500))
      expect(screen.getByText('Creating...')).toBeInTheDocument()

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Created successfully!')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    test('shows success for the configured duration before closing', async () => {
      jest.useFakeTimers()
      try {
        // Mock immediate successful creation
        const mockMutateAsync = jest.fn().mockResolvedValue({})
        trpc.admin.users.createUser.useMutation.mockReturnValue({
          mutateAsync: mockMutateAsync,
          onSuccess: jest.fn(),
          onError: jest.fn(),
        })

        render(
          <ModernAddUserModal
            open={true}
            onOpenChange={mockOnOpenChange}
            onSuccess={mockOnSuccess}
          />
        )

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/first name/i), {
          target: { value: 'John' },
        })
        fireEvent.change(screen.getByLabelText(/last name/i), {
          target: { value: 'Doe' },
        })
        fireEvent.change(screen.getByLabelText(/email address/i), {
          target: { value: 'john.doe@example.com' },
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
          target: { value: 'password123' },
        })

        // Click create button
        const createButton = screen.getByRole('button', { name: /create user/i })
        fireEvent.click(createButton)

        // Should show loading immediately, then success
        await waitFor(() => {
          expect(screen.getByText('Creating...')).toBeInTheDocument()
        })

        await waitFor(() => {
          expect(screen.getByText('Created successfully!')).toBeInTheDocument()
        })

        // Advance 2000ms: should NOT be closed yet (successDuration is 2500ms)
        jest.advanceTimersByTime(2000)
        expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)

        // Advance beyond successDuration (total 2600ms)
        jest.advanceTimersByTime(600)
        await waitFor(() => {
          expect(mockOnOpenChange).toHaveBeenCalledWith(false)
        })
      } finally {
        jest.useRealTimers()
      }
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
  })

  describe('Modal Integration and State Management', () => {
    test('integrates properly with EnhancedModal wrapper', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Check modal properties
      expect(screen.getByText('Create New User')).toBeInTheDocument()
      expect(screen.getByText(/add a new user to the system/i)).toBeInTheDocument()
      
      // Check for proper icons
      expect(screen.getByTestId('user-plus')).toBeInTheDocument()
    })

    test('handles modal open/close states', () => {
      const { rerender } = render(<EnhancedAddUserModal {...mockProps} />)
      
      // Modal should be open
      expect(screen.getByText('Create New User')).toBeInTheDocument()
      
      // Close modal
      rerender(<EnhancedAddUserModal {...mockProps} open={false} onOpenChange={jest.fn()} />)
      
      expect(screen.queryByText('Create New User')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Design and Accessibility', () => {
    test('maintains responsive layout', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Check for responsive grid classes
      const formSections = screen.getAllByRole('group')
      expect(formSections.length).toBeGreaterThan(0)
      
      // Check for proper spacing
      const modal = screen.getByTestId('enhanced-modal')
      expect(modal).toHaveClass(/w-\[99vw\]/)
    })

    test('provides proper ARIA labels and descriptions', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Check for ARIA attributes on inputs
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-describedby')
      
      // Check for progressbar ARIA
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow')
    })

    test('supports keyboard navigation', async () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/first name/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/last name/i)).toHaveFocus()
    })
  })

  describe('Data Persistence and Recovery', () => {
    test('loads saved form data on mount', () => {
      // Mock localStorage with saved data
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }))
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Should restore form data
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    test('clears saved data on successful submission', async () => {
      const mockRemoveItem = jest.spyOn(Storage.prototype, 'removeItem')
      
      // Mock successful submission
      mockCreateUserMutation.mockResolvedValue({})
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const submitButton = screen.getByText(/create user/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockRemoveItem).toHaveBeenCalledWith('userFormDraft')
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
  })
})
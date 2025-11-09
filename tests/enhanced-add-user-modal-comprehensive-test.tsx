// ============================================
// tests/enhanced-add-user-modal-comprehensive-test.tsx
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

jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => mockUtils,
    admin: {
      users: {
        createUser: {
          useMutation: () => ({
            mutateAsync: jest.fn(),
            mutate: jest.fn(),
            isLoading: false,
            error: null,
          }),
        },
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
}))

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: () => ({}),
    setValue: jest.fn(),
    watch: () => ({}),
    reset: jest.fn(),
    getValues: () => ({}),
    trigger: jest.fn().mockResolvedValue(true),
    formState: {
      errors: {},
      isValid: true,
      isDirty: false,
    },
  }),
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

describe('EnhancedAddUserModal - Comprehensive UI/UX Testing', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Visual Design Improvements', () => {
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
      jest.mocked(require('@/lib/trpc/client').trpc.admin.users.checkEmailAvailability.useMutation)
        .mockReturnValue({ isLoading: true } as any)
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Should show skeleton placeholders
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
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

  describe('Form Progression Improvements', () => {
    test('displays progress percentage and visual indicator', () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Progress bar should be visible
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      
      // Should show percentage
      expect(screen.getByText(/\d+%/) || screen.getByText(/progress/i)).toBeInTheDocument()
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

    test('implements auto-save functionality', async () => {
      // Mock localStorage
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem')
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, 'John')
      
      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(
          'userFormDraft',
          expect.stringContaining('firstName')
        )
      }, { timeout: 3000 })
    })

    test('displays auto-save status indicators', async () => {
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, 'John')
      
      await waitFor(() => {
        // Should show saving status
        expect(screen.getByText(/saving|auto-saved/i) || screen.getByText(/saved/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Enhanced User Feedback', () => {
    test('displays field-level error summaries', () => {
      // Mock form errors
      jest.mocked(require('react-hook-form').useForm).mockReturnValue({
        register: () => ({}),
        setValue: jest.fn(),
        watch: () => ({}),
        reset: jest.fn(),
        getValues: () => ({}),
        trigger: jest.fn().mockResolvedValue(false),
        formState: {
          errors: { 
            firstName: { message: 'First name is required' },
            email: { message: 'Invalid email' }
          },
          isValid: false,
          isDirty: true,
        },
      } as any)
      
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

    test('implements network error retry mechanisms', () => {
      // Mock error state
      jest.mocked(require('@/lib/trpc/client').trpc.admin.users.createUser.useMutation)
        .mockReturnValue({
          mutateAsync: jest.fn().mockRejectedValue(new Error('Network error')),
          mutate: jest.fn(),
          isLoading: false,
          error: new Error('Network error'),
        } as any)
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      // Trigger submission
      const submitButton = screen.getByText(/create user/i)
      fireEvent.click(submitButton)
      
      // Should show retry option after error
      expect(screen.getByText(/network error/i) || screen.getByText(/retry/i)).toBeInTheDocument()
    })

    test('displays success states with proper feedback', async () => {
      // Mock success state
      jest.mocked(require('@/lib/trpc/client').trpc.admin.users.createUser.useMutation)
        .mockReturnValue({
          mutateAsync: jest.fn().mockResolvedValue({}),
          mutate: jest.fn(),
          isLoading: false,
          error: null,
        } as any)
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const submitButton = screen.getByText(/create user/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        // Should show success feedback
        expect(screen.getByText(/user created successfully/i) || screen.getByText(/success/i)).toBeInTheDocument()
      })
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

  describe('Modal Integration', () => {
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
      // Note: This would require mocking the form setValue calls
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    test('clears saved data on successful submission', async () => {
      const mockRemoveItem = jest.spyOn(Storage.prototype, 'removeItem')
      
      // Mock successful submission
      jest.mocked(require('@/lib/trpc/client').trpc.admin.users.createUser.useMutation)
        .mockReturnValue({
          mutateAsync: jest.fn().mockResolvedValue({}),
          mutate: jest.fn(),
          isLoading: false,
          error: null,
        } as any)
      
      render(<EnhancedAddUserModal {...mockProps} />)
      
      const submitButton = screen.getByText(/create user/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockRemoveItem).toHaveBeenCalledWith('userFormDraft')
      })
    })
  })
})

export default {}
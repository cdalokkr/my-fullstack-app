import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminOverview } from './admin-overview'
import { useProgressiveDashboardData } from '@/hooks/use-progressive-dashboard-data'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'

// Mock the hooks and dependencies
jest.mock('@/hooks/use-progressive-dashboard-data')
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: jest.fn(),
    admin: {
      createUser: {
        useMutation: jest.fn(),
      },
    },
  },
}))
jest.mock('react-hot-toast')

const mockUseProgressiveDashboardData = useProgressiveDashboardData as jest.MockedFunction<typeof useProgressiveDashboardData>
const mockTrpc = trpc
const mockToast = toast as jest.Mocked<typeof toast>

describe('AdminOverview', () => {
  const mockOnLoadingChange = jest.fn()
  const mockRefetch = {
    critical: jest.fn(),
    secondary: jest.fn(),
    detailed: jest.fn(),
    all: jest.fn(),
  }

  const mockData = {
    criticalData: {
      totalUsers: 100,
      activeUsers: 50,
    },
    secondaryData: {
      analytics: [
        { metric_name: 'active_users', metric_value: 25 },
        { metric_name: 'other', metric_value: 10 },
      ],
      totalActivities: 200,
      todayActivities: 20,
    },
    detailedData: {
      recentActivities: [
        { id: 1, description: 'User logged in', created_at: '2023-01-01T00:00:00Z' },
        { id: 2, description: 'User created post', created_at: '2023-01-02T00:00:00Z' },
      ],
    },
    isLoading: {
      critical: false,
      secondary: false,
      detailed: false,
    },
    isError: {
      critical: false,
      secondary: false,
      detailed: false,
    },
    errors: {
      critical: null,
      secondary: null,
      detailed: null,
    },
    refetch: mockRefetch,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseProgressiveDashboardData.mockReturnValue(mockData)
    mockTrpc.useUtils.mockReturnValue({
      admin: {
        getUsers: { invalidate: jest.fn() },
        getCriticalDashboardData: { invalidate: jest.fn() },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  describe('Create User Button', () => {
    it('renders the Add User button', () => {
      render(<AdminOverview onLoadingChange={mockOnLoadingChange} />)

      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
    })

    it('shows create user form when Add User button is clicked', async () => {
      const user = userEvent.setup()
      render(<AdminOverview onLoadingChange={mockOnLoadingChange} />)

      const addUserButton = screen.getByRole('button', { name: /add user/i })
      await user.click(addUserButton)

      expect(screen.getByText('Create New User')).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })

    it('submits create user form successfully', async () => {
      const user = userEvent.setup()
      const mockCreateUserMutation: { mutateAsync: jest.Mock, onSuccess: jest.Mock, onError: jest.Mock } = {
        mutateAsync: jest.fn().mockResolvedValue({}),
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockTrpc.admin.createUser.useMutation as jest.Mock).mockReturnValue(mockCreateUserMutation as any)

      render(<AdminOverview onLoadingChange={mockOnLoadingChange} />)

      // Open form
      const addUserButton = screen.getByRole('button', { name: /add user/i })
      await user.click(addUserButton)

      // Fill form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      // Submit
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateUserMutation.mutateAsync).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
          dateOfBirth: '',
          mobileNo: '',
        })
        expect(mockToast.success).toHaveBeenCalledWith('User created successfully!')
      })
    })

    it('shows error toast on create user failure', async () => {
      const user = userEvent.setup()
      const mockCreateUserMutation: { mutateAsync: jest.Mock, onSuccess: jest.Mock, onError: jest.Mock } = {
        mutateAsync: jest.fn().mockRejectedValue(new Error('API Error')),
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockTrpc.admin.createUser.useMutation as jest.Mock).mockReturnValue(mockCreateUserMutation as any)

      render(<AdminOverview onLoadingChange={mockOnLoadingChange} />)

      // Open form
      const addUserButton = screen.getByRole('button', { name: /add user/i })
      await user.click(addUserButton)

      // Fill minimal form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

      // Submit
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('API Error')
      })
    })
  })

})
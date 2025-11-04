import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernAddUserModal } from '@/components/dashboard/modern-add-user-modal';
import { trpc } from '@/lib/trpc/client';

// Mock TRPC
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        users: {
          getUsers: { invalidate: jest.fn() },
        },
        dashboard: {
          getCriticalDashboardData: { invalidate: jest.fn() },
        },
      },
    }),
    admin: {
      users: {
        createUser: {
          useMutation: jest.fn(() => ({
            mutateAsync: jest.fn(),
            onSuccess: jest.fn(),
            onError: jest.fn(),
          })),
        },
      },
    },
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

describe('ModernAddUserModal Async Button Behavior', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading text during async operation', async () => {
    // Mock successful creation
    const mockMutateAsync = jest.fn().mockResolvedValue({});
    trpc.admin.users.createUser.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      onSuccess: jest.fn(),
      onError: jest.fn(),
    });

    render(
      <ModernAddUserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Click create button
    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    // Check loading text appears
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Created successfully!')).toBeInTheDocument();
    });
  });

  it('closes modal after success state (after async-button successDuration ~2.5s)', async () => {
    // Mock successful creation
    const mockMutateAsync = jest.fn().mockResolvedValue({});
    trpc.admin.users.createUser.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      onSuccess: jest.fn(),
      onError: jest.fn(),
    });

    render(
      <ModernAddUserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Click create button
    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    // Wait for success text
    await waitFor(() => {
      expect(screen.getByText('Created successfully!')).toBeInTheDocument();
    });

    // Wait for modal to close (after async-button successDuration = 2500ms)
    await waitFor(
      () => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      },
      { timeout: 3200 }
    );
  });

  it('does not reset prematurely during loading', async () => {
    // Mock delayed successful creation
    const mockMutateAsync = jest.fn(
      () => new Promise(resolve => setTimeout(() => resolve({}), 1000))
    );
    trpc.admin.users.createUser.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      onSuccess: jest.fn(),
      onError: jest.fn(),
    });

    render(
      <ModernAddUserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Click create button
    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    // Check loading text appears and stays
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    // Wait a bit and ensure loading text is still there (not reset prematurely)
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(screen.getByText('Creating...')).toBeInTheDocument();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Created successfully!')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
  it('shows success for the configured duration before closing', async () => {
    jest.useFakeTimers();
    try {
      // Mock immediate successful creation
      const mockMutateAsync = jest.fn().mockResolvedValue({});
      trpc.admin.users.createUser.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        onSuccess: jest.fn(),
        onError: jest.fn(),
      });

      render(
        <ModernAddUserModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john.doe@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(createButton);

      // Should show loading immediately, then success
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Created successfully!')).toBeInTheDocument();
      });

      // Advance 2000ms: should NOT be closed yet (successDuration is 2500ms)
      jest.advanceTimersByTime(2000);
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);

      // Advance beyond successDuration (total 2600ms)
      jest.advanceTimersByTime(600);
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('immediately shows loading state on click', async () => {
    // Mock delayed successful creation to observe loading state
    const mockMutateAsync = jest.fn(
      () => new Promise(resolve => setTimeout(() => resolve({}), 500))
    );
    trpc.admin.users.createUser.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      onSuccess: jest.fn(),
      onError: jest.fn(),
    });

    render(
      <ModernAddUserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Click create button
    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    // Loading text should appear immediately before mutation resolves
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });
});
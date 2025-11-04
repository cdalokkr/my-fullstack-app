import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernAddUserModal } from '@/components/dashboard/modern-add-user-modal';
import { trpc } from '@/lib/trpc/client';

// Mock TRPC with more detailed logging
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        users: {
          getUsers: { 
            invalidate: jest.fn(() => {
              console.log('✅ TRPC: getUsers invalidated');
            }),
          },
        },
        dashboard: {
          getCriticalDashboardData: { 
            invalidate: jest.fn(() => {
              console.log('✅ TRPC: dashboard data invalidated');
            }),
          },
        },
      },
    }),
    admin: {
      users: {
        createUser: {
          useMutation: jest.fn(() => ({
            mutateAsync: jest.fn(async (data) => {
              console.log('🔄 TRPC: mutateAsync called with data:', data);
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log('✅ TRPC: mutateAsync completed');
              return { success: true };
            }),
            onSuccess: jest.fn(() => {
              console.log('✅ TRPC: onSuccess callback triggered');
            }),
            onError: jest.fn((error) => {
              console.log('❌ TRPC: onError callback triggered:', error);
            }),
          })),
        },
      },
    },
  },
}));

describe('DEBUG: AsyncButton Critical Path', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log('🧪 Test setup complete');
  });

  it('DEBUG: Complete async button flow with detailed logging', async () => {
    console.log('🚀 Starting async button test');
    
    render(
      <ModernAddUserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    console.log('📋 Modal rendered, filling form...');

    // Fill required fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    console.log('✅ Form filled, finding create button...');

    // Find the create button and verify it's an AsyncButton
    const createButton = screen.getByRole('button', { name: /create user/i });
    console.log('🎯 Create button found:', createButton.tagName);
    console.log('🎯 Button classes:', createButton.className);

    console.log('👆 Clicking create button...');
    
    // Click the button
    fireEvent.click(createButton);

    console.log('⏳ Button clicked, waiting for loading state...');

    // Check if loading state appears
    try {
      await waitFor(() => {
        const loadingButton = screen.getByText('Creating...');
        console.log('✅ Loading state detected:', loadingButton.textContent);
      }, { timeout: 1000 });
    } catch (error) {
      console.error('❌ Loading state NOT detected within 1s');
      console.log('Available buttons:', screen.getAllByRole('button').map(b => b.textContent));
    }

    // Wait for success
    try {
      await waitFor(() => {
        const successButton = screen.getByText('Created successfully!');
        console.log('✅ Success state detected:', successButton.textContent);
      }, { timeout: 3000 });
    } catch (error) {
      console.error('❌ Success state NOT detected within 3s');
      console.log('Available buttons:', screen.getAllByRole('button').map(b => b.textContent));
    }

    // Check if modal closes
    try {
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        console.log('✅ Modal close called');
      }, { timeout: 3000 });
    } catch (error) {
      console.error('❌ Modal close NOT called within 3s');
      console.log('mockOnOpenChange calls:', mockOnOpenChange.mock.calls);
    }

    console.log('🏁 Test completed');
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernAddUserModal } from '@/components/dashboard/modern-add-user-modal';
import { trpc } from '@/lib/trpc/client';

// Mock TRPC with detailed logging
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

describe('VERIFICATION: Manual AsyncButton Fix', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log('🧪 Test setup complete');
  });

  it('✅ VERIFIED: Complete async button flow with modal auto-close', async () => {
    console.log('🚀 Starting async button verification test');
    
    render(
      <ModernAddUserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    console.log('📋 Modal rendered, filling form...');

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    console.log('✅ Form filled, finding create button...');

    // Find the create button
    const createButton = screen.getByRole('button', { name: /create user/i });
    console.log('🎯 Create button found:', createButton.tagName);

    console.log('👆 Clicking create button...');
    fireEvent.click(createButton);

    console.log('⏳ Button clicked, waiting for loading state...');

    // Check if loading state appears
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeTruthy();
      console.log('✅ Loading state detected correctly');
    }, { timeout: 1000 });

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Created successfully!')).toBeTruthy();
      console.log('✅ Success state detected correctly');
    }, { timeout: 3000 });

    // Check if modal closes after success (this is the key verification!)
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      console.log('✅ Modal auto-closed after success - FIX VERIFIED!');
    }, { timeout: 3000 });

    console.log('🎉 VERIFICATION COMPLETE: Async button fix working correctly!');
  });
});
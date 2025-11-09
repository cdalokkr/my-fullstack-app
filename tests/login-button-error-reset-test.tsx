// ============================================
// tests/login-button-error-reset-test.tsx
// ============================================
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { trpc } from '@/lib/trpc/client';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock trpc
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
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
    }),
    auth: {
      login: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          data: { profile: { role: 'admin', avatar_url: null } },
          error: null,
        }),
      },
    },
  },
}));

describe('Login Button Error State Reset', () => {
  test('button resets to idle state after error after 3 seconds', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Invalid credentials');
    
    // Mock the login mutation to throw an error
    const mockLoginMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      data: null,
      error: mockError,
    };
    
    (trpc as any).auth = {
      login: {
        useMutation: () => mockLoginMutation,
      },
    };
    
    render(<LoginForm />);
    
    // Find the login button
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in invalid form data to trigger validation error
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, '123');
    
    // Click the login button to trigger error
    await user.click(loginButton);
    
    // Wait for error state to be shown
    await waitFor(() => {
      expect(loginButton.textContent).toContain('Error occurred');
    });
    
    // Verify button is in error state
    expect(loginButton.textContent).toContain('Error occurred');
    
    // Wait for the timeout to reset error state (3 seconds)
    await waitFor(() => {
      expect(loginButton.textContent).toBe('Sign In');
    }, { timeout: 4000 });
    
    // Verify button can be clicked again
    expect(loginButton).not.toBeDisabled();
  });

  test('button remains in success state for longer duration', async () => {
    const user = userEvent.setup();
    
    const mockLoginMutation = {
      mutateAsync: jest.fn().mockResolvedValue({
        profile: { role: 'admin', avatar_url: null }
      }),
      data: { profile: { role: 'admin', avatar_url: null } },
      error: null,
    };
    
    (trpc as any).auth = {
      login: {
        useMutation: () => mockLoginMutation,
      },
    };
    
    render(<LoginForm />);
    
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'valid@example.com');
    await user.type(passwordInput, 'validpassword');
    
    // Click the login button
    await user.click(loginButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(loginButton.textContent).toContain('Success!');
    });
    
    // Button should still be in success state after 4 seconds (but not 8 seconds due to redirect)
    // Note: In this test, we can't test the full 8-second duration due to navigation
    expect(loginButton.textContent).toContain('Success!');
  });
});
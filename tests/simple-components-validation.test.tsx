// SimpleAsyncButton and SimpleModal Component Validation Tests
// This test validates all the key functionality for the components

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SimpleAsyncButton } from '@/components/ui/SimpleAsyncButton';
import { SimpleModal } from '@/components/ui/SimpleModal';

// Mock functions
const mockOnClick = jest.fn();
const mockOnOpenChange = jest.fn();
const mockOnSubmit = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SimpleAsyncButton Validation Tests', () => {
  test('renders with default idle state', () => {
    render(
      <SimpleAsyncButton onClick={mockOnClick}>
        Click Me
      </SimpleAsyncButton>
    );
    
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button.textContent).toBe('Click Me');
  });

  test('shows loading state during async operation', async () => {
    const user = userEvent.setup();
    const slowOperation = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <SimpleAsyncButton 
        onClick={slowOperation}
        loadingText="Processing..."
      >
        Click Me
      </SimpleAsyncButton>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Should show loading state immediately
    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button.textContent).toContain('Processing...');
    });
  });

  test('shows success state after successful operation', async () => {
    const user = userEvent.setup();
    const successfulOperation = jest.fn().mockResolvedValue(undefined);

    render(
      <SimpleAsyncButton 
        onClick={successfulOperation}
        successText="Success!"
      >
        Click Me
      </SimpleAsyncButton>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Wait for success state
    await waitFor(() => {
      expect(button.textContent).toContain('Success!');
    });
  });

  test('auto-resets to idle state after success duration', async () => {
    const user = userEvent.setup();
    const successfulOperation = jest.fn().mockResolvedValue(undefined);

    render(
      <SimpleAsyncButton 
        onClick={successfulOperation}
        successText="Success!"
        successDuration={500}
      >
        Click Me
      </SimpleAsyncButton>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Should show success
    await waitFor(() => {
      expect(button.textContent).toContain('Success!');
    });

    // Should reset to idle after duration
    await waitFor(() => {
      expect(button.textContent).toBe('Click Me');
    }, { timeout: 1000 });
  });

  test('handles operation failures gracefully', async () => {
    const user = userEvent.setup();
    const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    render(
      <SimpleAsyncButton 
        onClick={failingOperation}
        loadingText="Loading..."
        successText="Success!"
      >
        Click Me
      </SimpleAsyncButton>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(button.textContent).toContain('Loading...');
    });

    // Should reset to idle after failure
    await waitFor(() => {
      expect(button.textContent).toBe('Click Me');
    });
  });
});

describe('SimpleModal Validation Tests', () => {
  test('renders when open prop is true', () => {
    render(
      <SimpleModal 
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        title="Test Modal"
      >
        <p>Modal Content</p>
      </SimpleModal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('handles form submission through SimpleAsyncButton', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SimpleModal 
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockSubmit}
        title="Test Modal"
        submitText="Submit"
      >
        <div>
          <input placeholder="Test input" />
        </div>
      </SimpleModal>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Should call submit function
    expect(mockSubmit).toHaveBeenCalled();

    // Should show success state
    await waitFor(() => {
      expect(submitButton.textContent).toContain('Submitted!');
    });
  });

  test('auto-closes after successful submission', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SimpleModal 
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockSubmit}
        title="Test Modal"
        autoCloseDuration={500}
      >
        <div>
          <input placeholder="Test input" />
        </div>
      </SimpleModal>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    // Wait for submission and success state
    await waitFor(() => {
      expect(submitButton.textContent).toContain('Submitted!');
    });

    // Should auto-close after duration
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    }, { timeout: 1000 });
  });

  test('prevents backdrop click during submission', async () => {
    const user = userEvent.setup();
    const slowSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <SimpleModal 
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={slowSubmit}
        title="Test Modal"
      >
        <div>
          <input placeholder="Test input" />
        </div>
      </SimpleModal>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Click submit to start submission
    fireEvent.click(submitButton);

    // Try to click backdrop during submission
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    // Modal should still be open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Should not call onOpenChange with false
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe('Integration Validation Tests', () => {
  test('components work together seamlessly', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <SimpleModal 
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockSubmit}
        title="Integration Test"
        submitText="Create User"
        submitLoadingText="Creating user..."
        submitSuccessText="User created!"
        autoCloseDuration={500}
      >
        <div>
          <input placeholder="Name" />
          <input placeholder="Email" />
        </div>
      </SimpleModal>
    );

    // Fill basic form
    const inputs = screen.getAllByPlaceholderText(/name|email/i);
    fireEvent.change(inputs[0], { target: { value: 'John Doe' } });
    fireEvent.change(inputs[1], { target: { value: 'john@example.com' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Create User' });
    await user.click(submitButton);

    // Verify loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton.textContent).toContain('Creating user...');
    });

    // Verify success state
    await waitFor(() => {
      expect(submitButton.textContent).toContain('User created!');
    });

    // Verify auto-close
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    }, { timeout: 1000 });

    // Verify submission was called
    expect(mockSubmit).toHaveBeenCalled();
  });
});
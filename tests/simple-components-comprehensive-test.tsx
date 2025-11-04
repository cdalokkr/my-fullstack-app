import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleAsyncButton } from '@/components/ui/SimpleAsyncButton';
import { SimpleModal } from '@/components/ui/SimpleModal';

// Mock implementations for testing
const mockOnClick = jest.fn();
const mockOnOpenChange = jest.fn();
const mockOnSubmit = jest.fn();

describe('SimpleAsyncButton Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic State Management', () => {
    it('should render with default idle state', () => {
      render(
        <SimpleAsyncButton onClick={mockOnClick}>
          Click Me
        </SimpleAsyncButton>
      );
      
      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Click Me');
    });

    it('should show loading state during async operation', async () => {
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
        expect(button).toHaveTextContent('Processing...');
      });
    });

    it('should show success state after successful operation', async () => {
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
        expect(button).toHaveTextContent('Success!');
      });
    });

    it('should auto-reset to idle state after success duration', async () => {
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
        expect(button).toHaveTextContent('Success!');
      });

      // Should reset to idle after duration
      await waitFor(() => {
        expect(button).toHaveTextContent('Click Me');
      }, { timeout: 1000 });
    });

    it('should handle operation failures gracefully', async () => {
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
        expect(button).toHaveTextContent('Loading...');
      });

      // Should reset to idle after failure
      await waitFor(() => {
        expect(button).toHaveTextContent('Click Me');
      });
    });
  });

  describe('Visual Styling', () => {
    it('should apply success state styling', async () => {
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

      // Should have success styling
      await waitFor(() => {
        expect(button).toHaveStyle({
          backgroundColor: '#16a34a',
          color: 'white'
        });
      });
    });

    it('should support different button variants', () => {
      const { rerender } = render(
        <SimpleAsyncButton onClick={mockOnClick} variant="outline">
          Outline Button
        </SimpleAsyncButton>
      );

      expect(screen.getByRole('button')).toHaveClass('border');

      rerender(
        <SimpleAsyncButton onClick={mockOnClick} variant="destructive">
          Destructive Button
        </SimpleAsyncButton>
      );

      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      const successfulOperation = jest.fn().mockResolvedValue(undefined);

      render(
        <SimpleAsyncButton 
          onClick={successfulOperation}
          loadingText="Loading..."
          successText="Success!"
        >
          Click Me
        </SimpleAsyncButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-live', 'off');

      await user.click(button);

      // During loading, should have aria-live="polite" and aria-busy="true"
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-live', 'polite');
        expect(button).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should include screen reader only status text', async () => {
      const user = userEvent.setup();
      const successfulOperation = jest.fn().mockResolvedValue(undefined);

      render(
        <SimpleAsyncButton 
          onClick={successfulOperation}
          loadingText="Loading..."
          successText="Success!"
        >
          Click Me
        </SimpleAsyncButton>
      );

      const button = screen.getByRole('button');
      
      // Should have screen reader only text
      const screenReaderText = screen.getByText('Idle', { selector: '.sr-only' });
      expect(screenReaderText).toBeInTheDocument();
    });
  });
});

describe('SimpleModal Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal State Management', () => {
    it('should render when open prop is true', () => {
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

    it('should not render when open prop is false', () => {
      render(
        <SimpleModal 
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          title="Test Modal"
        >
          <p>Modal Content</p>
        </SimpleModal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onOpenChange when closed', async () => {
      const user = userEvent.setup();

      render(
        <SimpleModal 
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          title="Test Modal"
        >
          <p>Modal Content</p>
        </SimpleModal>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Form Integration', () => {
    it('should handle form submission through SimpleAsyncButton', async () => {
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
        expect(submitButton).toHaveTextContent('Submitted!');
      });
    });

    it('should auto-close after successful submission', async () => {
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
        expect(submitButton).toHaveTextContent('Submitted!');
      });

      // Should auto-close after duration
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      }, { timeout: 1000 });
    });

    it('should reset form state when modal reopens', async () => {
      const user = userEvent.setup();

      const TestFormComponent = () => {
        const [formData, setFormData] = React.useState({ name: '', email: '' });

        return (
          <SimpleModal 
            isOpen={true}
            onOpenChange={mockOnOpenChange}
            title="Test Modal"
          >
            <div>
              <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Name"
              />
              <input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Email"
              />
            </div>
          </SimpleModal>
        );
      };

      const { rerender } = render(<TestFormComponent />);

      // Fill form
      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');

      // Close modal
      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      // Re-open modal - form should be reset
      rerender(<TestFormComponent />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toHaveValue('');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('');
      });
    });
  });

  describe('Backdrop Protection', () => {
    it('should prevent backdrop click during submission', async () => {
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
      fireEvent.mouseDown(dialog, { bubbles: true });
      fireEvent.click(dialog, { bubbles: true });

      // Modal should still be open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should not call onOpenChange with false
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle submission failures gracefully', async () => {
      const user = userEvent.setup();
      const failingSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));

      render(
        SimpleModal({
        isOpen: true,
        onOpenChange: mockOnOpenChange,
        onSubmit: failingSubmit,
        title: "Test Modal",
        submitText: "Submit"
      }));

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Should reset to original state after error
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Submit');
        expect(submitButton).not.toBeDisabled();
      });

      // Should not close modal on error
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <SimpleModal 
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          title="Accessible Modal"
          description="This is a test modal"
        >
          <p>Modal content</p>
        </SimpleModal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      const title = screen.getByText('Accessible Modal');
      expect(title.closest('[role="dialog"]')).toBeInTheDocument();
      
      const description = screen.getByText('This is a test modal');
      expect(description).toHaveAttribute('aria-describedby');
    });
  });
});

describe('Integration Tests', () => {
  it('should work together seamlessly', async () => {
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
      expect(submitButton).toHaveTextContent('Creating user...');
    });

    // Verify success state
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('User created!');
    });

    // Verify auto-close
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    }, { timeout: 1000 });

    // Verify submission was called
    expect(mockSubmit).toHaveBeenCalled();
  });
});
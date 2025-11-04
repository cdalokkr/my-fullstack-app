"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ManualAsyncState = 'idle' | 'loading' | 'success' | 'error';

export interface ManualAsyncButtonProps extends Omit<React.ComponentProps<'button'>, 'onError'> {
  /** The async operation to perform when clicked */
  onClick: () => Promise<any>;
  /** Loading text to display */
  loadingText?: string;
  /** Success text to display */
  successText?: string;
  /** Error text to display */
  errorText?: string;
  /** Callback when operation succeeds */
  onSuccess?: () => void;
  /** Callback when operation fails */
  onAsyncError?: (error: Error) => void;
  /** Custom icons for different states */
  icons?: {
    loading?: React.ReactNode;
    success?: React.ReactNode;
    error?: React.ReactNode;
  };
  /** Children to render when idle */
  children?: React.ReactNode;
}

export function ManualAsyncButton({
  onClick,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error occurred',
  onSuccess,
  onAsyncError,
  icons,
  children,
  className,
  disabled,
  ...props
}: ManualAsyncButtonProps) {
  const [state, setState] = useState<ManualAsyncState>('idle');

  const defaultIcons = {
    loading: <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />,
    success: <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />,
    error: <AlertCircle className="mr-2 h-4 w-4" aria-hidden="true" />,
  };

  const currentIcons = { ...defaultIcons, ...icons };

  const handleClick = async () => {
    if (disabled || state === 'loading') return;

    console.log('ManualAsyncButton: Starting async operation, setting state to loading');
    setState('loading');

    try {
      console.log('ManualAsyncButton: Executing onClick function');
      await onClick();
      console.log('ManualAsyncButton: Operation successful, setting state to success');
      setState('success');
      onSuccess?.();
      
      // Auto-reset to idle after success (but keep success visible briefly)
      setTimeout(() => {
        setState('idle');
      }, 2000);
    } catch (error) {
      console.error('ManualAsyncButton: Operation failed, setting state to error:', error);
      setState('error');
      onAsyncError?.(error as Error);
      
      // Auto-reset to idle after error
      setTimeout(() => {
        setState('idle');
      }, 3000);
    }
  };

  const getButtonContent = () => {
    console.log('ManualAsyncButton: getButtonContent called with state:', state);
    
    switch (state) {
      case 'loading':
        console.log('ManualAsyncButton: Rendering loading state with text:', loadingText);
        return (
          <>
            {currentIcons.loading}
            {loadingText}
          </>
        );
      case 'success':
        console.log('ManualAsyncButton: Rendering success state with text:', successText);
        return (
          <>
            {currentIcons.success}
            {successText}
          </>
        );
      case 'error':
        console.log('ManualAsyncButton: Rendering error state with text:', errorText);
        return (
          <>
            {currentIcons.error}
            {errorText}
          </>
        );
      default:
        console.log('ManualAsyncButton: Rendering idle state with children:', children);
        return children;
    }
  };

  const isDisabled = disabled || state === 'loading';

  return (
    <Button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 transition-all duration-200",
        state === 'loading' && "cursor-wait opacity-80",
        state === 'success' && "bg-green-600 hover:bg-green-700 text-white",
        state === 'error' && "bg-red-600 hover:bg-red-700 text-white",
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {getButtonContent()}
      
      {/* Screen reader only status for accessibility */}
      <span className="sr-only">
        {state === 'loading' && 'Loading'}
        {state === 'success' && 'Success'}
        {state === 'error' && 'Error'}
        {state === 'idle' && 'Idle'}
      </span>
    </Button>
  );
}
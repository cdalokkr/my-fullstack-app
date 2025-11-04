'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncButtonProps extends React.ComponentProps<'button'> {
  /** The async operation to perform when clicked */
  onClick?: () => Promise<void> | void;
  /** Loading text to display */
  loadingText?: string;
  /** Success text to display */
  successText?: string;
  /** Error text to display */
  errorText?: string;
  /** Duration to show success state before resetting (ms) */
  successDuration?: number;
  /** Duration to show error state before resetting (ms) */
  errorDuration?: number;
  /** Whether to reset to idle state automatically */
  autoReset?: boolean;
  /** Custom icons for different states */
  icons?: {
    loading?: React.ReactNode;
    success?: React.ReactNode;
    error?: React.ReactNode;
  };
  /** Callback when state changes */
  onStateChange?: (state: AsyncState) => void;
  /** Button content when idle */
  children?: React.ReactNode;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AsyncButton({
  onClick,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error occurred',
  successDuration = 2000,
  errorDuration = 3000,
  autoReset = true,
  icons = {},
  onStateChange,
  className,
  variant,
  size,
  disabled,
  children,
  ...props
}: AsyncButtonProps) {
  const [state, setState] = useState<AsyncState>('idle');

  const defaultIcons = {
    loading: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
    success: <CheckCircle className="mr-2 h-4 w-4" />,
    error: <AlertCircle className="mr-2 h-4 w-4" />,
  };

  const currentIcons = { ...defaultIcons, ...icons };

  useEffect(() => {
    console.log('AsyncButton: State changed to:', state);
    onStateChange?.(state);

    if (autoReset && (state === 'success' || state === 'error')) {
      const duration = state === 'success' ? successDuration : errorDuration;
      console.log(`AsyncButton: Auto-reset enabled, will reset from ${state} in ${duration}ms`);
      const timer = setTimeout(() => {
        setState('idle');
        // Announce state change to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = 'Operation completed, button ready for next action';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [state, autoReset, successDuration, errorDuration]);


  const handleClick = async () => {
    if (state === 'loading' || !onClick) return;

    console.log('AsyncButton: Starting async operation, setting state to loading');
    setState('loading');

    try {
      console.log('AsyncButton: Executing onClick function');
      await onClick();
      console.log('AsyncButton: Operation successful, setting state to success');
      setState('success');
    } catch (error) {
      console.error('AsyncButton: Operation failed, setting state to error:', error);
      setState('error');
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            {currentIcons.loading}
            {loadingText}
          </>
        );
      case 'success':
        return (
          <>
            {currentIcons.success}
            {successText}
          </>
        );
      case 'error':
        return (
          <>
            {currentIcons.error}
            {errorText}
          </>
        );
      default:
        return children;
    }
  };

  const getButtonVariant = () => {
    if (state === 'success' || state === 'error') return undefined;
    return variant;
  };

  const getButtonStyle = () => {
    if (state === 'success') {
      return {
        backgroundColor: '#16a34a', // green-600
        color: 'white',
        borderColor: '#16a34a',
        '--hover-bg': '#15803d' // green-700
      } as React.CSSProperties;
    }
    if (state === 'error') {
      return {
        backgroundColor: '#dc2626', // red-600
        color: 'white',
        borderColor: '#dc2626',
        '--hover-bg': '#b91c1c' // red-700
      } as React.CSSProperties;
    }
    return undefined;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={state === 'loading' || disabled}
      variant={getButtonVariant()}
      size={size}
      style={getButtonStyle()}
      className={cn(
        // Add transition classes for smooth state changes
        'transition-all duration-200',
        state === 'success' && 'hover:bg-green-700',
        state === 'error' && 'hover:bg-red-700',
        className
      )}
      aria-live={state === 'loading' ? 'polite' : 'off'}
      aria-busy={state === 'loading'}
    >
      {getButtonContent()}
    </Button>
  );
}

// Pre-configured variants for common use cases
export function LoginButton({ successDuration = 4000, ...props }: Omit<AsyncButtonProps, 'loadingText' | 'successText'>) {
  return (
    <AsyncButton
      loadingText="Authenticating..."
      successText="Success! Redirecting..."
      successDuration={successDuration}
      {...props}
    />
  );
}

export function SaveButton({ successDuration = 2000, ...props }: Omit<AsyncButtonProps, 'loadingText' | 'successText'>) {
  return (
    <AsyncButton
      loadingText="Saving..."
      successText="Saved successfully!"
      successDuration={successDuration}
      {...props}
    />
  );
}

export function DeleteButton({ successDuration = 2000, ...props }: Omit<AsyncButtonProps, 'loadingText' | 'successText' | 'errorText'>) {
  return (
    <AsyncButton
      loadingText="Deleting..."
      successText="Deleted successfully!"
      errorText="Failed to delete"
      successDuration={successDuration}
      {...props}
    />
  );
}

export function SubmitButton({ successDuration = 2000, ...props }: Omit<AsyncButtonProps, 'loadingText' | 'successText'>) {
  return (
    <AsyncButton
      loadingText="Submitting..."
      successText="Submitted successfully!"
      successDuration={successDuration}
      {...props}
    />
  );
}
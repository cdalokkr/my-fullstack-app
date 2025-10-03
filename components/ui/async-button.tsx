'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';


export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

interface AsyncButtonProps {
  /** The async operation to perform when clicked */
  onClick?: () => Promise<void> | void;
  /** Loading text to display */
  loadingText?: string;
  /** Success text to display */
  successText?: string;
  /** Error text to display */
  errorText?: string;
  /** Progressive loading phases with text and duration */
  loadingPhases?: Array<{ text: string; duration: number }>;
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
  /** Additional button props */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function AsyncButton({
  onClick,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error occurred',
  loadingPhases,
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
}: AsyncButtonProps) {
  const [state, setState] = useState<AsyncState>('idle');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [operationComplete, setOperationComplete] = useState(false);

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
        console.log(`AsyncButton: Auto-reset timer fired, resetting from ${state} to idle`);
        setState('idle');
        setCurrentPhaseIndex(0);
        setOperationComplete(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [state, autoReset, successDuration, errorDuration, onStateChange]);

  // Handle progressive loading phases
  useEffect(() => {
    if (state !== 'loading' || !loadingPhases || loadingPhases.length === 0) return;

    if (currentPhaseIndex >= loadingPhases.length) {
      if (operationComplete) {
        console.log('AsyncButton: All phases completed and operation done, setting success');
        setState('success');
      }
      return;
    }

    const phase = loadingPhases[currentPhaseIndex];
    console.log(`AsyncButton: Starting phase ${currentPhaseIndex}: "${phase.text}" for ${phase.duration}ms`);
    const timer = setTimeout(() => {
      console.log(`AsyncButton: Phase ${currentPhaseIndex} completed, moving to next`);
      setCurrentPhaseIndex(prev => prev + 1);
    }, phase.duration);

    return () => clearTimeout(timer);
  }, [state, currentPhaseIndex, loadingPhases, operationComplete]);

  const handleClick = async () => {
    if (state === 'loading' || !onClick) return;

    console.log('AsyncButton: Starting async operation, setting state to loading');
    setState('loading');
    setCurrentPhaseIndex(0);
    setOperationComplete(false);

    try {
      console.log('AsyncButton: Executing onClick function');
      await onClick();
      console.log('AsyncButton: Operation successful, marking complete');
      setOperationComplete(true);
      // If no phases or phases already done, set success immediately
      if (!loadingPhases || loadingPhases.length === 0 || currentPhaseIndex >= loadingPhases.length) {
        setState('success');
      }
    } catch (error) {
      console.error('AsyncButton: Operation failed, setting state to error:', error);
      setState('error');
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        if (loadingPhases && loadingPhases.length > 0 && currentPhaseIndex < loadingPhases.length) {
          return (
            <>
              {currentIcons.loading}
              {loadingPhases[currentPhaseIndex].text}
            </>
          );
        }
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
    >
      {getButtonContent()}
    </Button>
  );
}

// Pre-configured variants for common use cases
export function LoginButton({ successDuration = 4000, ...props }: Omit<AsyncButtonProps, 'loadingText' | 'successText' | 'loadingPhases'>) {
  const loadingPhases = [
    { text: "Validating..", duration: 2000 },
    { text: "Authenticating..", duration: 3000 },
  ];

  return (
    <AsyncButton
      loadingPhases={loadingPhases}
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
"use client";

import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

// Size configurations matching the ActionButton component
const sizeConfigs = {
  sm: {
    button: 'h-8 text-xs px-3',
    icon: 'w-3 h-3'
  },
  md: {
    button: 'h-9 text-sm px-4',
    icon: 'w-4 h-4'
  },
  lg: {
    button: 'h-10 text-sm px-6',
    icon: 'w-5 h-5'
  }
};

interface CreateUserButtonProps extends Omit<React.ComponentProps<'button'>, 'onClick'> {
  /** The async operation to perform when clicked */
  onClick?: () => Promise<void> | void;
  /** Loading text to display */
  loadingText?: string;
  /** Success text to display */
  successText?: string;
  /** Error text to display */
  errorText?: string;
  /** Current async state */
  asyncState?: AsyncState;
  /** Button content when idle */
  children?: React.ReactNode;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
}

export default function CreateUserButton({
  onClick,
  loadingText = "Creating User...",
  successText = "User Created Successfully!",
  errorText = "Failed to create user",
  asyncState = 'idle',
  disabled,
  children,
  className,
  size = 'lg', // Default to 'lg' for consistency with CancelButton
  ...props
}: CreateUserButtonProps) {
  const handleClick = async () => {
    if (asyncState === 'loading' || asyncState === 'success' || !onClick) return;
    await onClick();
  };

  const sizeConfig = sizeConfigs[size];

  const getButtonContent = () => {
    switch (asyncState) {
      case 'loading':
        return {
          text: loadingText,
          icon: <Loader2 className={cn(sizeConfig.icon, "animate-spin mr-2")} />,
          className: "bg-gray-600 cursor-wait"
        };
      case 'success':
        return {
          text: successText,
          icon: <CheckCircle className={cn(sizeConfig.icon, "mr-2")} />,
          className: "bg-green-600 cursor-not-allowed opacity-90"
        };
      case 'error':
        return {
          text: errorText,
          icon: <AlertCircle className={cn(sizeConfig.icon, "mr-2")} />,
          className: "bg-red-600 hover:bg-red-700"
        };
      default:
        return {
          text: children,
          icon: <div className={cn(sizeConfig.icon, "mr-2")} />, // Placeholder for consistent spacing
          className: "bg-blue-600 hover:bg-blue-700"
        };
    }
  };

  const isDisabled = disabled || asyncState === 'loading' || asyncState === 'success';
  const buttonContent = getButtonContent();

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center font-medium text-white transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm disabled:opacity-80 disabled:cursor-not-allowed",
        "rounded-md w-full",
        sizeConfig.button,
        buttonContent.className,
        className
      )}
      {...props}
    >
      {buttonContent.icon}
      <span className="whitespace-nowrap">{buttonContent.text}</span>
    </button>
  );
}
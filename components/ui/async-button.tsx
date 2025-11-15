"use client";

import { useState, useRef, useLayoutEffect, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  /** Whether form has errors that should prevent success state */
  hasFormErrors?: boolean;
  /** Duration to show states before resetting (ms) - new API */
  duration?: number;
  /** Duration to show success state before resetting (ms) - backward compatibility */
  successDuration?: number;
  /** Duration to show error state before resetting (ms) - backward compatibility */
  errorDuration?: number;
  /** Whether to reset to idle state automatically */
  autoReset?: boolean;
  /** Custom icons for different states */
  icons?: {
    idle?: React.ReactNode;
    loading?: React.ReactNode;
    success?: React.ReactNode;
    error?: React.ReactNode;
  };
  /** Callback when state changes */
  onStateChange?: (state: AsyncState) => void;
  /** Button content when idle */
  children?: React.ReactNode;
  /** Button variant - modern system with backward compatibility */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon';
  /** Whether to use adaptive width calculation to prevent visual shifting */
  customWidth?: boolean;
  
}

export default function AsyncButton({
  onClick,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error occurred',
  hasFormErrors = false,
  duration = 2000,
  successDuration,
  errorDuration,
  autoReset = true,
  icons = {},
  onStateChange,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  customWidth = false,
  ...props
}: AsyncButtonProps) {
  const [state, setState] = useState<AsyncState>('idle');
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize text set for measurement (modern optimization)
  const allTexts = useMemo(
    () => [children?.toString() || 'Button', loadingText, successText, errorText],
    [children, loadingText, successText, errorText]
  );

  // Pre-measure max width before first paint (only when customWidth is true)
  useLayoutEffect(() => {
    if (!customWidth) {
      setContainerWidth(undefined);
      return;
    }

    const temp = document.createElement("span");
    temp.style.visibility = "hidden";
    temp.style.position = "absolute";
    temp.style.whiteSpace = "nowrap";
    temp.style.font = getComputedStyle(document.body).font;
    temp.className = "inline-flex items-center justify-center font-medium text-sm"; // approximate style

    document.body.appendChild(temp);

    let maxWidth = 0;
    for (const text of allTexts) {
      temp.textContent = text;
      maxWidth = Math.max(maxWidth, temp.offsetWidth);
    }

    document.body.removeChild(temp);
    setContainerWidth(maxWidth + 48); // padding buffer for icons
  }, [allTexts, customWidth]);

  const defaultIcons = {
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  };

  const currentIcons = {
    idle: <UserPlus className="w-4 h-4" />,
    ...defaultIcons,
    ...icons
  };

  useEffect(() => {
    onStateChange?.(state);
    
    // Announce state change to screen readers for accessibility
    if (state === 'success' || state === 'error') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      announcement.textContent = state === 'success' ? 'Operation completed successfully' : 'Operation failed';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  }, [state, onStateChange]);

  const handleClick = async () => {
    if (state === 'loading' || state === 'success' || !onClick) return;

    setState('loading');

    try {
      await onClick();
      
      // If there are form errors, show error state instead of success
      if (hasFormErrors) {
        setState('error');
        
        // Reset to idle state using the appropriate duration
        const errorDur = errorDuration || duration;
        if (autoReset) {
          setTimeout(() => setState('idle'), errorDur);
        }
      } else {
        setState('success');
        
        // Success state persists - no auto-reset to allow for redirection
        // Users can click again once the state naturally clears (e.g., after redirection)
        const successDur = successDuration || duration;
        if (autoReset) {
          // setTimeout(() => setInternalState('idle'), successDur); // Commented out to prevent reset on success
        }
      }
    } catch (error) {
      setState('error');
      
      // Reset to idle state using the appropriate duration
      const errorDur = errorDuration || duration;
      if (autoReset) {
        setTimeout(() => setState('idle'), errorDur);
      }
    }
  };

  // 🎨 Enhanced color system supporting both new and old variants
  const variantColorMap = {
    primary: { base: "bg-blue-600", hover: "hover:bg-blue-700" },
    secondary: { base: "bg-gray-600", hover: "hover:bg-gray-700" },
    success: { base: "bg-green-600", hover: "hover:bg-green-700" },
    danger: { base: "bg-red-600", hover: "hover:bg-red-700" },
    // Legacy variants
    default: { base: "bg-blue-600", hover: "hover:bg-blue-700" },
    destructive: { base: "bg-red-600", hover: "hover:bg-red-700" },
    outline: { base: "border-2 border-gray-300 bg-transparent", hover: "hover:bg-gray-100" },
    ghost: { base: "bg-transparent", hover: "hover:bg-gray-100" },
    link: { base: "bg-transparent underline-offset-4", hover: "hover:underline hover:bg-gray-100" },
  } as const;

  const { base, hover } = variantColorMap[variant as keyof typeof variantColorMap] || variantColorMap.primary;
  
  const colorMap: Record<AsyncState, string> = {
    idle: `${base} ${hover}`,
    loading: "bg-gray-600 hover:bg-gray-700 cursor-wait",
    success: "bg-green-600 cursor-not-allowed opacity-90", // Prevent hover and set disabled cursor
    error: "bg-red-600 hover:bg-red-700",
  };

  // 📏 Size map with backward compatibility
  const sizeMap = {
    sm: "px-3 py-1.5 text-xs gap-1 rounded-md",
    md: "px-4 py-2 text-sm gap-2 rounded-md",
    lg: "px-6 py-3 text-base gap-3 rounded-md",
    default: "px-4 py-2 text-sm gap-2 rounded-md",
    icon: "h-10 w-10 gap-0 rounded-md",
  };

  const renderIcon = () => {
    if (state === 'idle' && currentIcons.idle) return currentIcons.idle;
    if (state === 'loading' && currentIcons.loading) return currentIcons.loading;
    if (state === 'success' && currentIcons.success) return currentIcons.success;
    if (state === 'error' && currentIcons.error) return currentIcons.error;
    return null;
  };

  const renderText = () => {
    switch (state) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText;
      case 'error':
        return errorText;
      default:
        return children;
    }
  };

  // Separate width classes from className to prevent initial flash
  const getWidthClasses = () => {
    if (customWidth) {
      return ""; // No width classes when using custom width
    }
    return "w-full"; // Use full width when customWidth is false
  };

  // Filter out width-related classes from className to prevent conflicts
  const filteredClassName = useMemo(() => {
    if (!className) return "";
    return className
      .split(' ')
      .filter(cls => !cls.startsWith('w-') && !cls.includes('width'))
      .join(' ');
  }, [className]);

  // When using custom width, render with container approach
  if (customWidth && containerWidth) {
    return (
      <div
        ref={containerRef}
        style={{ width: containerWidth }}
        className="inline-block"
      >
        <motion.button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          disabled={state === 'loading' || state === 'success' || disabled}
          animate={{
            scale: state === 'error' ? 0.96 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "inline-flex items-center justify-center font-medium text-white transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm disabled:opacity-80 disabled:cursor-not-allowed",
            "text-white dark:text-gray-100",
            colorMap[state],
            sizeMap[size],
            filteredClassName
          )}
          aria-live={state === 'loading' ? 'polite' : 'off'}
          aria-busy={state === 'loading'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              className="flex items-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              {renderIcon()}
              <span className="ml-2 whitespace-nowrap">{renderText()}</span>
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }

  // When not using custom width, render as before (backward compatibility)
  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={state === 'loading' || state === 'success' || disabled}
      animate={{
        scale: state === 'error' ? 0.96 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "inline-flex items-center justify-center font-medium text-white transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm disabled:opacity-80 disabled:cursor-not-allowed",
        "text-white dark:text-gray-100",
        colorMap[state],
        sizeMap[size],
        getWidthClasses(),
        filteredClassName
      )}
      aria-live={state === 'loading' ? 'polite' : 'off'}
      aria-busy={state === 'loading'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          className="flex items-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
        >
          {renderIcon()}
          <span className="ml-2 whitespace-nowrap">{renderText()}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export function LoginButton({
  successDuration = 4000,
  loadingText: customLoadingText,
  successText: customSuccessText,
  errorText: customErrorText,
  hasFormErrors,
  ...props
}: AsyncButtonProps & {
  hasFormErrors?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
}) {
  // Use custom texts if provided, otherwise use defaults
  const loadingText = customLoadingText || "Authenticating..."
  const successText = customSuccessText || "Success! Redirecting..."
  const errorText = customErrorText || (hasFormErrors ? "Please fix form errors" : "Login failed! Please try again")
  
  return (
    <AsyncButton
      loadingText={loadingText}
      successText={successText}
      errorText={errorText}
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


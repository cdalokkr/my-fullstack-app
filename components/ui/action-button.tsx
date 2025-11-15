"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Edit, 
  Save, 
  X, 
  Trash2, 
  UserPlus, 
  Eye, 
  Settings,
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Type definitions
export interface ActionButtonProps {
  action: 'edit' | 'save' | 'cancel' | 'delete' | 'add' | 'view' | 'settings'
  variant?: 'button' | 'icon-only'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: React.ComponentType<any>
  children?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  'aria-label'?: string
  'data-testid'?: string
}

// Theme configurations based on existing patterns
const actionThemes = {
  edit: {
    base: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300',
    icon: 'text-blue-600',
    shadow: 'shadow-blue-500/20'
  },
  save: {
    base: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300',
    icon: 'text-green-600',
    shadow: 'shadow-green-500/20'
  },
  cancel: {
    base: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300',
    icon: 'text-red-600',
    shadow: 'shadow-red-500/20'
  },
  delete: {
    base: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300',
    icon: 'text-red-600',
    shadow: 'shadow-red-500/20'
  },
  add: {
    base: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300',
    icon: 'text-purple-600',
    shadow: 'shadow-purple-500/20'
  },
  view: {
    base: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300',
    icon: 'text-indigo-600',
    shadow: 'shadow-indigo-500/20'
  },
  settings: {
    base: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300',
    icon: 'text-gray-600',
    shadow: 'shadow-gray-500/20'
  }
}

// Default icons for each action type
const defaultIcons = {
  edit: Edit,
  save: Save,
  cancel: X,
  delete: Trash2,
  add: UserPlus,
  view: Eye,
  settings: Settings
}

// Size configurations
const sizeConfigs = {
  sm: {
    button: 'h-8 text-xs px-3',
    icon: 'h-3.5 w-3.5',
    iconOnly: 'h-8 w-8'
  },
  md: {
    button: 'h-9 text-sm px-4',
    icon: 'h-4 w-4',
    iconOnly: 'h-9 w-9'
  },
  lg: {
    button: 'h-10 text-sm px-6',
    icon: 'h-5 w-5',
    iconOnly: 'h-10 w-10'
  }
}

/**
 * Comprehensive ActionButton Component
 * 
 * A reusable button component with consistent styling, animations, and accessibility
 * that supports all common action types throughout the application.
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({
    action,
    variant = 'button',
    size = 'md',
    loading = false,
    disabled = false,
    icon: customIcon,
    children,
    onClick,
    className,
    'aria-label': ariaLabel,
    'data-testid': testId,
    ...props
  }, ref) => {
    const IconComponent = customIcon || defaultIcons[action]
    const theme = actionThemes[action]
    const sizeConfig = sizeConfigs[size]
    const isDisabled = disabled || loading

    // Generate accessible label if not provided
    const getAccessibleLabel = () => {
      if (ariaLabel) return ariaLabel
      if (variant === 'icon-only' && !children) {
        const actionLabels = {
          edit: 'Edit',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          add: 'Add',
          view: 'View',
          settings: 'Settings'
        }
        return actionLabels[action]
      }
      return undefined
    }

    return (
      <motion.button
        ref={ref}
        type="button"
        className={cn(
          // Base button styles
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200',
          'border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'outline-none disabled:pointer-events-none disabled:opacity-50',
          
          // Size configurations
          variant === 'icon-only' 
            ? sizeConfig.iconOnly 
            : sizeConfig.button,
          
          // Theme application
          theme.base,
          
          // Hover effects
          !isDisabled && 'hover:shadow-md hover:shadow-current/10',
          
          // Loading state
          loading && 'cursor-wait',
          
          // Custom className
          className
        )}
        disabled={isDisabled}
        onClick={onClick}
        data-testid={testId}
        aria-disabled={isDisabled}
        aria-label={getAccessibleLabel()}
        {...props}
        whileHover={!isDisabled ? { 
          scale: 1.05,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: { duration: 0.2 }
        } : undefined}
        whileTap={!isDisabled ? { 
          scale: 0.95,
          transition: { duration: 0.1 }
        } : undefined}
        animate={loading ? { 
          scale: 0.95,
          opacity: 0.8,
          transition: { duration: 0.2 }
        } : {}}
      >
        <motion.div
          className="flex items-center justify-center"
          whileHover={!isDisabled ? { 
            rotate: 5,
            scale: 1.1,
            transition: { duration: 0.2 }
          } : undefined}
          whileTap={!isDisabled ? { 
            scale: 0.9,
            transition: { duration: 0.1 }
          } : undefined}
        >
          {loading ? (
            <Loader2 
              className={cn(
                sizeConfig.icon, 
                'animate-spin',
                theme.icon
              )} 
            />
          ) : (
            <IconComponent 
              className={cn(
                sizeConfig.icon,
                theme.icon,
                children && (variant === 'button' ? 'mr-1' : '')
              )} 
            />
          )}
        </motion.div>
        
        {/* Button text */}
        {children && variant === 'button' && (
          <motion.span
            initial={{ opacity: 1 }}
            animate={loading ? { opacity: 0.5 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? `${children}...` : children}
          </motion.span>
        )}
      </motion.button>
    )
  }
)

ActionButton.displayName = 'ActionButton'

// Export convenience components for each action type
export const EditButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="edit" {...props} />
)
EditButton.displayName = 'EditButton'

export const SaveButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="save" {...props} />
)
SaveButton.displayName = 'SaveButton'

export const CancelButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="cancel" {...props} />
)
CancelButton.displayName = 'CancelButton'

export const DeleteButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="delete" {...props} />
)
DeleteButton.displayName = 'DeleteButton'

export const AddButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="add" {...props} />
)
AddButton.displayName = 'AddButton'

export const ViewButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="view" {...props} />
)
ViewButton.displayName = 'ViewButton'

export const SettingsButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'action'>>(
  (props, ref) => <ActionButton ref={ref} action="settings" {...props} />
)
SettingsButton.displayName = 'SettingsButton'

export default ActionButton
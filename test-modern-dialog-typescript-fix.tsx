// Test file to verify TypeScript fixes for modern-dialog component
import React from 'react'
import { 
  ModernDialog,
  ModernDialogContent,
  ModernDialogTitle,
  ModernDialogHeader,
  ModernDialogTrigger,
  ModernDialogFooter,
  ModernDialogDescription
} from './components/ui/modern-dialog'

// Test component to verify type safety
export function TestModernDialogUsage() {
  return (
    <ModernDialog>
      <ModernDialogTrigger>Open Dialog</ModernDialogTrigger>
      
      <ModernDialogContent>
        {/* Test 1: Direct ModernDialogTitle */}
        <ModernDialogTitle>Test Dialog Title</ModernDialogTitle>
        
        {/* Test 2: Title inside header */}
        <ModernDialogHeader>
          <ModernDialogTitle>Header Dialog Title</ModernDialogTitle>
          <p>Additional header content</p>
        </ModernDialogHeader>
        
        <div className="dialog-content">
          <p>This should appear in the remaining children</p>
        </div>
        
        <ModernDialogFooter>
          <button>Cancel</button>
          <button>Save</button>
        </ModernDialogFooter>
      </ModernDialogContent>
    </ModernDialog>
  )
}

// Test with string children
export function TestModernDialogStringChildren() {
  return (
    <ModernDialog>
      <ModernDialogTrigger>Open Dialog</ModernDialogTrigger>
      
      <ModernDialogContent>
        {/* Test with string children */}
        <p>String child content</p>
        
        <div>
          <h2>String child in div</h2>
          <p>More string content</p>
        </div>
      </ModernDialogContent>
    </ModernDialog>
  )
}

// Test component to verify no props unknown errors
export function TestModernDialogPropsHandling() {
  return (
    <ModernDialog>
      <ModernDialogTrigger>Open Dialog</ModernDialogTrigger>
      
      <ModernDialogContent 
        showCloseButton={true} 
        size="lg"
        className="custom-dialog-class"
      >
        <ModernDialogTitle>Custom Size Dialog</ModernDialogTitle>
        
        <div className="content">
          Dialog content with custom props
        </div>
      </ModernDialogContent>
    </ModernDialog>
  )
}
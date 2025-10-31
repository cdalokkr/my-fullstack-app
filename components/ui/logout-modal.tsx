'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CheckCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface LogoutModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutModal({ isOpen, onOpenChange }: LogoutModalProps) {
  const [contentLoading, setContentLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadingMessages = [
    "Signing out...",
    "Clearing session...",
    "Redirecting..."
  ]

  const logoutMutation = trpc.auth.logout.useMutation()

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setContentLoading(true)
      setIsSuccess(false)
      setCurrentMessageIndex(0)
      setIsLoggingOut(false)
    }
  }, [isOpen])


  // Trigger logout when modal opens
  useEffect(() => {
    console.log('Logout effect triggered: isOpen=', isOpen, 'contentLoading=', contentLoading, 'isSuccess=', isSuccess, 'isLoggingOut=', isLoggingOut)
    if (isOpen && contentLoading && !isSuccess && !isLoggingOut) {
      console.log('Calling logout mutateAsync')
      setIsLoggingOut(true)
      logoutMutation.mutateAsync()
        .then(() => {
          console.log('Logout mutateAsync resolved successfully')
          // Keep loading true during progression
          setTimeout(() => setCurrentMessageIndex(1), 500)
          setTimeout(() => setCurrentMessageIndex(2), 1000)
          setTimeout(() => {
            setIsSuccess(true)
            setContentLoading(false)
          }, 1500)
        })
        .catch((error) => {
          console.error('Logout failed:', error)
          // For now, assume success even on error, or handle error state
          setTimeout(() => setCurrentMessageIndex(1), 500)
          setTimeout(() => setCurrentMessageIndex(2), 1000)
          setTimeout(() => {
            setIsSuccess(true)
            setContentLoading(false)
          }, 2500)
        })
    }
  }, [isOpen, contentLoading, isSuccess, isLoggingOut, logoutMutation])

  // Handle success and auto-close with immediate redirect
  useEffect(() => {
    if (isSuccess) {
      // Return focus to the logout trigger before closing
      const logoutTrigger = document.querySelector('[aria-label="Logout"]') as HTMLElement
      if (logoutTrigger) {
        logoutTrigger.focus()
      }
      onOpenChange(false)
      window.location.href = '/login'
    }
  }, [isSuccess, onOpenChange])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && contentLoading) return; onOpenChange(open); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md" role="alertdialog" aria-live="assertive">
        <DialogHeader>
          <DialogTitle>Logging Out</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 py-4">
          {isSuccess ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
              <p className="text-sm text-green-600">Successfully signed out!</p>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{loadingMessages[currentMessageIndex]}</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CheckCircle } from 'lucide-react'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  isSuccess: boolean
  currentStep: string
}

export function LogoutModal({ isOpen, onClose, isLoading, isSuccess, currentStep }: LogoutModalProps) {
  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setDelayPassed(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setDelayPassed(false);
    }
  }, [isSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && (isLoading || !delayPassed)) return; onClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Logging Out</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 py-4">
          {isSuccess ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500" />
              <p className="text-sm text-green-600">Logged Out successfully!</p>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">{currentStep}</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
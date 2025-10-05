'use client'

import { ReactNode, useState, useEffect, useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { TopBar } from './top-bar'
import { AdminOverview } from './admin-overview'
import { UserOverview } from './user-overview'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Profile } from '@/types'

interface DashboardLayoutProps {
  children?: ReactNode
}

function DashboardContent({
  profile,
  isLoading,
  onLoadingChange
}: {
  profile: Profile | undefined
  isLoading: boolean
  onLoadingChange: (loading: boolean) => void
}) {
  useEffect(() => {
    onLoadingChange(isLoading)
  }, [isLoading, onLoadingChange])

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Profile not found</h2>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {profile.role === 'admin' ? <AdminOverview onLoadingChange={onLoadingChange} /> : <UserOverview profile={profile} onLoadingChange={onLoadingChange} />}
    </div>
  )
}


export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get initial profile from localStorage for instant load
  const getInitialProfile = () => {
    if (typeof window === 'undefined') return undefined
    const stored = localStorage.getItem('userProfile')
    if (stored) {
      try {
        return JSON.parse(stored) as Profile
      } catch (error) {
        console.error('Error parsing stored profile:', error)
        return undefined
      }
    }
    return undefined
  }

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    initialData: getInitialProfile(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
  
  const [contentLoading, setContentLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [storedProfile, setStoredProfile] = useState<Profile | null>(null)

  // Memoize the setContentLoading callback to prevent unnecessary re-renders
  const handleLoadingChange = useCallback((loading: boolean) => {
    setContentLoading(loading)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('userProfile')
    if (stored) {
      try {
        setStoredProfile(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing stored profile:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (profile) {
      setStoredProfile(profile)
      localStorage.setItem('userProfile', JSON.stringify(profile))
    }
  }, [profile])

  // Loading messages for the splash screen
  const loadingMessages = [
    "Loading profile data...",
    "Fetching dashboard metrics...",
    "Loading recent activities...",
  ]

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (contentLoading) {
      const timer = setTimeout(() => setShowDialog(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowDialog(false)
    }
  }, [contentLoading])

  useEffect(() => {
    if (!contentLoading) return

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [contentLoading, loadingMessages.length])

  // Mock tenant data - in a real app, this would come from an API
  const tenants = useMemo(() => [
    { id: '1', name: 'Default Organization' }
  ], [])
  const defaultTenant = useMemo(() => tenants[0], [tenants])

  const handleTenantSwitch = useCallback((tenantId: string) => {
    // Handle tenant switching logic here
    console.log('Switching to tenant:', tenantId)
  }, [])

  return (
    <>
      <Dialog open={showDialog && contentLoading}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Your Dashboard</DialogTitle>
            <DialogDescription>
              {loadingMessages[currentMessageIndex]}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <SidebarProvider>
        <AppSidebar
          role={storedProfile?.role || 'user'}
          tenants={tenants}
          defaultTenant={defaultTenant}
          onTenantSwitch={handleTenantSwitch}
          user={storedProfile}
        />
        <SidebarInset>
          <TopBar user={storedProfile} />
          {children || <DashboardContent profile={profile} isLoading={profileLoading} onLoadingChange={handleLoadingChange} />}
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
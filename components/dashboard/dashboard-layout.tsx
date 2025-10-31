'use client'

import { ReactNode, useState, useEffect, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { TopBar } from './top-bar'
import { AdminOverview } from './admin-overview'
import { UserOverview } from './user-overview'
import { StatusBar } from './status-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      <div className="w-full h-full overflow-auto">
        <div className="min-h-full p-4 md:p-6 lg:p-8 pl-20 md:pl-24 lg:pl-24 space-y-6">
          <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/20 shadow-sm p-6 md:p-8 space-y-6">
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
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="w-full h-full overflow-auto">
        <div className="min-h-full p-4 md:p-6 lg:p-8 pl-20 md:pl-24 lg:pl-24 flex items-center justify-center">
          <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/20 shadow-sm p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
            <p className="text-muted-foreground">Unable to load your profile information.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="min-h-full p-4 md:p-6 lg:p-8 pl-20 md:pl-24 lg:pl-24 space-y-6 scroll-smooth-touch mobile-optimized">
        <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/20 shadow-sm p-6 md:p-8">
          {profile.role === 'admin' ? <AdminOverview onLoadingChange={onLoadingChange} /> : <UserOverview profile={profile} onLoadingChange={onLoadingChange} />}
        </div>
      </div>
    </div>
  )
}


// Function to get initial profile from localStorage
function getInitialProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('userProfile');
    if (!stored) return null;
    
    const profile = JSON.parse(stored);
    return profile;
  } catch (error) {
    console.error('Error parsing stored profile:', error);
    return null;
  }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [contentLoading, setContentLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [storedProfile, setStoredProfile] = useState<Profile | null>(null)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isLoginFlow, setIsLoginFlow] = useState(false)
  const [dashboardDataLoaded, setDashboardDataLoaded] = useState(false)

  // Detect if this is a fresh login (no stored profile in this session)
  useEffect(() => {
    const sessionProfile = sessionStorage.getItem('sessionProfile');
    const initialProfile = getInitialProfile();
    
    if (initialProfile) {
      setStoredProfile(initialProfile);
      // Check if this is a fresh login by checking session storage
      if (!sessionProfile) {
        setIsLoginFlow(true);
        sessionStorage.setItem('sessionProfile', JSON.stringify(initialProfile));
      }
    }
    
    // Set a timeout to force close the splash screen after 10 seconds
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
      setIsInitialLoad(false);
    }, 10000); // 10 seconds max

    return () => clearTimeout(timeout);
  }, [])

  // Track when dashboard data starts loading
  useEffect(() => {
    if (storedProfile && isLoginFlow) {
      // Start tracking dashboard data loading
      setContentLoading(true);
      setIsInitialLoad(true);
      
      // Set up a listener for when dashboard data is loaded
      const handleDashboardLoad = () => {
        setDashboardDataLoaded(true);
        setContentLoading(false);
        setIsInitialLoad(false);
        setIsLoginFlow(false);
      };

      // Listen for dashboard data loading events
      window.addEventListener('dashboardDataLoaded', handleDashboardLoad);
      
      // Auto-trigger after 3 seconds if no explicit load event
      const autoTimeout = setTimeout(() => {
        if (!dashboardDataLoaded) {
          handleDashboardLoad();
        }
      }, 3000);

      return () => {
        window.removeEventListener('dashboardDataLoaded', handleDashboardLoad);
        clearTimeout(autoTimeout);
      };
    }
  }, [storedProfile, isLoginFlow, dashboardDataLoaded])

  // Get initial profile once to avoid multiple calls
  const initialProfile = getInitialProfile();
  
  // Use cached profile as initial data and skip query if we already have it
  const { data: profile, isLoading: profileLoading, isError: profileError } = trpc.profile.get.useQuery(undefined, {
    initialData: initialProfile || undefined, // Use cached profile from localStorage
    staleTime: 5 * 60 * 1000,
    enabled: !initialProfile, // Skip query if we already have profile data
    retry: 2, // Limit retries to prevent infinite loading
    retryDelay: 1000,
  })

  // Memoize the setContentLoading callback to prevent unnecessary re-renders
  const handleLoadingChange = useCallback((loading: boolean) => {
    setContentLoading(loading)
  }, [])

  useEffect(() => {
    if (profile && profile !== getInitialProfile()) {
      setStoredProfile(profile)
      localStorage.setItem('userProfile', JSON.stringify(profile))
      // Close splash screen once we have profile data
      setContentLoading(false)
      setIsInitialLoad(false)
    }
    // Close splash screen if profile query fails
    if (profileError && !initialProfile) {
      setContentLoading(false)
      setIsInitialLoad(false)
    }
  }, [profile, profileError, initialProfile])

  // Loading messages for the splash screen
  const loadingMessages = [
    "Loading profile data...",
    "Fetching dashboard metrics...",
    "Loading recent activities...",
  ]

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if ((contentLoading && isInitialLoad && !loadingTimeout) || (isLoginFlow && !dashboardDataLoaded)) {
      const timer = setTimeout(() => setShowDialog(true), 300)
      return () => clearTimeout(timer)
    } else if (!contentLoading || loadingTimeout || dashboardDataLoaded) {
      setShowDialog(false)
    }
  }, [contentLoading, isInitialLoad, loadingTimeout, isLoginFlow, dashboardDataLoaded])

  useEffect(() => {
    if (!contentLoading || !isInitialLoad || loadingTimeout) return

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [contentLoading, isInitialLoad, loadingTimeout, loadingMessages.length])

  // Mock tenant data - in a real app, this would come from an API
  const tenants = useMemo(() => [
    { id: '1', name: 'Default Organization' }
  ], [])
  const defaultTenant = useMemo(() => tenants[0], [tenants])

  const handleTenantSwitch = useCallback((tenantId: string) => {
    // Handle tenant switching logic here
    console.log('Switching to tenant:', tenantId)
  }, [])

  // Determine the current user role, prioritizing stored profile
  const currentRole = storedProfile?.role || profile?.role;
  const currentUser = storedProfile || profile || null;
  
  // Show loading state while role is being determined
  if (!currentRole && (pathname === '/admin' || pathname === '/user')) {
    return (
      <Dialog open={true}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading your profile...</DialogTitle>
            <DialogDescription>
              Please wait while we prepare your dashboard.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog
        open={showDialog && (contentLoading || (isLoginFlow && !dashboardDataLoaded)) && (pathname === '/admin' || pathname === '/user')}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {loadingTimeout ? 'Dashboard Loading Issue' : 'Welcome to Your Dashboard'}
            </DialogTitle>
            <DialogDescription>
              {loadingTimeout
                ? 'We\'re having trouble loading your dashboard. You can still access the main features while we resolve this issue.'
                : isLoginFlow
                  ? 'Initializing your dashboard with all necessary data...'
                  : loadingMessages[currentMessageIndex]
              }
            </DialogDescription>
          </DialogHeader>
          {(loadingTimeout || (isLoginFlow && !dashboardDataLoaded)) && (
            <div className="mt-4">
              <Button
                onClick={() => {
                  setLoadingTimeout(false)
                  setContentLoading(false)
                  setIsInitialLoad(false)
                  setDashboardDataLoaded(true)
                  setIsLoginFlow(false)
                }}
                className="w-full"
              >
                {loadingTimeout ? 'Continue to Dashboard' : 'Skip Loading & Continue'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <SidebarProvider>
        <AppSidebar
          role={currentRole || 'user'}
          tenants={tenants}
          defaultTenant={defaultTenant}
          onTenantSwitch={handleTenantSwitch}
          user={currentUser}
        />
        <SidebarInset className="flex flex-col min-h-screen">
          <TopBar user={currentUser} />
          <div className="flex-1 w-full pt-6 pb-4 px-4">
            {children || <DashboardContent profile={profile} isLoading={profileLoading} onLoadingChange={handleLoadingChange} />}
          </div>
          <StatusBar />
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
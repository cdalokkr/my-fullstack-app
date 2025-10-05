'use client'

import { ReactNode } from 'react'
import { trpc } from '@/lib/trpc/client'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { TopBar } from './top-bar'
import { AdminOverview } from './admin-overview'
import { UserOverview } from './user-overview'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardLayoutProps {
  children?: ReactNode
}

function DashboardContent() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery()

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
      {profile.role === 'admin' ? <AdminOverview /> : <UserOverview />}
    </div>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: profile } = trpc.profile.get.useQuery()

  // Mock tenant data - in a real app, this would come from an API
  const tenants = [
    { id: '1', name: 'Default Organization' }
  ]
  const defaultTenant = tenants[0]

  const handleTenantSwitch = (tenantId: string) => {
    // Handle tenant switching logic here
    console.log('Switching to tenant:', tenantId)
  }

  return (
    <SidebarProvider>
      <AppSidebar
        role={profile?.role || 'user'}
        tenants={tenants}
        defaultTenant={defaultTenant}
        onTenantSwitch={handleTenantSwitch}
        user={profile || null}
      />
      <SidebarInset>
        <TopBar user={profile} />
        {children || <DashboardContent />}
      </SidebarInset>
    </SidebarProvider>
  )
}
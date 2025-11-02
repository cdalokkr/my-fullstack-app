import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Administrative dashboard for system management',
  keywords: ['admin', 'dashboard', 'management', 'users'],
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ErrorBoundary>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ErrorBoundary>
  )
}
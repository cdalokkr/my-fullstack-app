import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { AdminDashboardStreaming } from '@/components/dashboard/admin-dashboard-streaming'
import { ErrorBoundary, PageErrorBoundary } from '@/components/ui/error-boundary'

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <PageErrorBoundary>
        <AdminDashboardStreaming />
      </PageErrorBoundary>
    </DashboardLayout>
  )
}
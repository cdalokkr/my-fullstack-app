import { ErrorBoundary, PageErrorBoundary } from '@/components/ui/error-boundary'
import { AdminDashboardStreaming } from '@/components/dashboard/admin-dashboard-streaming'

export default function AdminDashboardPage() {
  return (
    <PageErrorBoundary>
      <AdminDashboardStreaming />
    </PageErrorBoundary>
  )
}
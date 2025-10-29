import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import UserManagement from '@/components/dashboard/user-management'

export default function AllUsersPage() {
  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  )
}
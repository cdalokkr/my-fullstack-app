// ============================================
// app/(dashboard)/admin/users/page.tsx
// ============================================
import { UserManagement } from '@/components/dashboard/user-management'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User Management - Admin Dashboard',
  description: 'Manage users and permissions',
}

export default function UsersPage() {
  return <UserManagement />
}
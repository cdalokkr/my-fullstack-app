import type { Metadata } from 'next'
import { AllUsersManagementPage } from './all-users-management-page'

export const metadata: Metadata = {
  title: 'Manage Users - Admin Dashboard',
  description: 'Comprehensive user management interface with advanced filtering, role management, and bulk operations for system administrators.',
  keywords: ['admin', 'users', 'management', 'user administration', 'roles', 'permissions'],
  robots: 'noindex, nofollow', // Admin pages should not be indexed
}

export default function AllUsersPage() {
  return <AllUsersManagementPage />
}
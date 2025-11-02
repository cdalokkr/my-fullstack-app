import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User Management - Admin Dashboard',
  description: 'Comprehensive user management interface for system administrators.',
  keywords: ['admin', 'users', 'management', 'user administration'],
  robots: 'noindex, nofollow', // Admin pages should not be indexed
}

// Redirect to the all users management page
export default function UsersPage() {
  redirect('/admin/users/all')
}
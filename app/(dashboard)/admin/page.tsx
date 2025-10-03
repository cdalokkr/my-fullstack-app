// ============================================
// app/(dashboard)/admin/page.tsx
// ============================================
import { AdminOverview } from '@/components/dashboard/admin-overview'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Full-Stack App',
  description: 'Admin control panel',
}

export default function AdminDashboardPage() {
  return <AdminOverview />
}
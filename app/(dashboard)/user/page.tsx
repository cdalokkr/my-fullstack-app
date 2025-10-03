// ============================================
// app/(dashboard)/user/page.tsx
// ============================================
import { UserOverview } from '@/components/dashboard/user-overview'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Full-Stack App',
  description: 'User dashboard',
}

export default function UserDashboardPage() {
  return <UserOverview />
}

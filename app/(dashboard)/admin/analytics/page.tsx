// ============================================
// app/(dashboard)/admin/analytics/page.tsx
// ============================================
import { Analytics } from '@/components/dashboard/analytics'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - Admin Dashboard',
  description: 'View analytics and metrics',
}

export default function AnalyticsPage() {
  return <Analytics />
}
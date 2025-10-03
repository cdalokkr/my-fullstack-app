// ============================================
// app/(dashboard)/user/profile/page.tsx
// ============================================
import { ProfilePage } from '@/components/dashboard/profile-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile - Dashboard',
  description: 'Manage your profile',
}

export default function Profile() {
  return <ProfilePage />
}
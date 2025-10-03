// ============================================
// app/(dashboard)/admin/users/create/page.tsx
// ============================================
'use client'

import { CreateUserForm } from '@/components/dashboard/create-user-form'
import { useRouter } from 'next/navigation'

export default function CreateUserPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create User</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new user to the system</p>
      </div>
      <CreateUserForm onSuccess={() => router.push('/admin/users')} />
    </div>
  )
}
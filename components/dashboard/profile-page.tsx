// ============================================
// components/dashboard/profile-page.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { trpc } from '@/lib/trpc/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validations/auth'
import { FiSave, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const { data: profile } = trpc.profile.get.useQuery()
  const utils = trpc.useUtils()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
    },
  })

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully')
      utils.profile.get.invalidate()
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })

  const onSubmit = (data: ProfileUpdateInput) => {
    updateProfileMutation.mutate(data)
  }

  const handleCancel = () => {
    reset({
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
    })
    setIsEditing(false)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {profile.full_name || 'User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                <Badge variant="outline" className="mt-2">
                  {profile.role}
                </Badge>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  disabled={!isEditing}
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  placeholder="https://example.com/avatar.jpg"
                  disabled={!isEditing}
                  {...register('avatar_url')}
                />
                {errors.avatar_url && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.avatar_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input
                  value={new Date(profile.created_at).toLocaleDateString()}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="gap-2"
                  >
                    <FiSave />
                    {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
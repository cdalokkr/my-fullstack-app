'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { User, Activity, Bell, Edit, Settings, Eye } from 'lucide-react'
import { Profile, Activity as ActivityType } from '@/types'

interface ProfileCardProps {
  profile: Profile | null
  loading: boolean
}

function ProfileCard({ profile, loading }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Profile
        </CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : profile ? (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Name:</span> {profile.full_name || 'Not set'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> {profile.email}
            </p>
            <p className="text-sm">
              <span className="font-medium">Role:</span> {profile.role}
            </p>
            {profile.mobile_no && (
              <p className="text-sm">
                <span className="font-medium">Mobile:</span> {profile.mobile_no}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Profile not found</p>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivitiesCardProps {
  activities: ActivityType[]
  loading: boolean
}

function ActivitiesCard({ activities, loading }: ActivitiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activities
        </CardTitle>
        <CardDescription>Your latest actions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description || activity.activity_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activities</p>
        )}
      </CardContent>
    </Card>
  )
}

interface NotificationsCardProps {
  count: number
  loading: boolean
}

function NotificationsCard({ count, loading }: NotificationsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{count}</div>
        )}
        <p className="text-xs text-muted-foreground">Pending notifications</p>
      </CardContent>
    </Card>
  )
}

export function UserOverview() {
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery()
  const { data: activities, isLoading: activitiesLoading } = trpc.profile.getActivities.useQuery({ limit: 5 })
  const { data: unreadCount, isLoading: notificationsLoading } = trpc.notification.getUnreadCount.useQuery()

  return (
    <div className="space-y-6">
      {/* Profile and Notifications */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileCard profile={profile || null} loading={profileLoading} />
        <NotificationsCard count={unreadCount || 0} loading={notificationsLoading} />
      </div>

      {/* Recent Activities */}
      <ActivitiesCard activities={activities || []} loading={activitiesLoading} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your profile and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              View Notifications
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Activity History
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
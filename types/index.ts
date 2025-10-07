// ============================================
// types/index.ts
// ============================================
export type UserRole = 'admin' | 'user'

export type ActivityType = 'login' | 'logout' | 'profile_update' | 'data_view' | 'data_edit'

export interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  first_name?: string
  last_name?: string
  mobile_no?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  activity_type: ActivityType
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AnalyticsMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_date: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface AdminStats {
  totalUsers: number
  totalActivities: number
  todayActivities: number
}

export interface DashboardData {
  stats: AdminStats
  analytics: AnalyticsMetric[]
  recentActivities: (Activity & { profiles?: { email: string; full_name: string } })[]
  metadata: {
    fetchedAt: string
    version: string
    cacheExpiry: number
  }
}
// ============================================
// lib/trpc/routers/index.ts
// ============================================
import { router } from '../server'
import { authRouter } from './auth'
import { profileRouter } from './profile'
import { adminUsersRouter } from './admin-users'
import { adminDashboardRouter } from './admin-dashboard'
import { adminAnalyticsRouter } from './admin-analytics'
import { notificationRouter } from './notification'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  admin: router({
    users: adminUsersRouter,
    dashboard: adminDashboardRouter,
    analytics: adminAnalyticsRouter,
  }),
  notification: notificationRouter,
})

export type AppRouter = typeof appRouter

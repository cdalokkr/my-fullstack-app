// ============================================
// lib/trpc/routers/index.ts
// ============================================
import { router } from '../server'
import { authRouter } from './auth'
import { profileRouter } from './profile'
import { adminRouter } from './admin'
import { notificationRouter } from './notification'

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  admin: adminRouter,
  notification: notificationRouter,
})

export type AppRouter = typeof appRouter

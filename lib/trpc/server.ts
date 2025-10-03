// ============================================
// lib/trpc/server.ts
// ============================================
import { initTRPC, TRPCError } from '@trpc/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

let createContextCallCount = 0

export async function createContext() {
  createContextCallCount++
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (process.env.NODE_ENV === 'development') {
      console.log(`DEBUG: createContext call #${createContextCallCount} - profile query result:`, {
        found: !!data,
        profileId: data?.id,
        profileRole: data?.role,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint
      })
    }

    profile = data
  }

  return { supabase, user, profile }
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.profile) {
    if (process.env.NODE_ENV === 'development') {
      console.log('DEBUG: protectedProcedure - throwing UNAUTHORIZED')
    }
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user, profile: ctx.profile } })
})

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx })
})

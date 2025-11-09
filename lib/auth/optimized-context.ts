// ============================================
// lib/auth/optimized-context.ts
// Performance-optimized authentication context with async session management
// ============================================
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

// Performance monitoring interface
interface AuthPerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  contextSize: number
  cacheHit: boolean
  userFound: boolean
  profileFound: boolean
  error?: string
}

// Additional data for performance metrics
interface AuthMetricsData {
  userFound?: boolean
  profileFound?: boolean
  cacheHit?: boolean
  contextSize?: number
  error?: string
}

// Context result interface for type safety
export interface OptimizedContextResult {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null
  user: User | null
  profile: Profile | null
  metrics: AuthPerformanceMetrics
}

// Session cache for optimizing repeated requests
interface SessionCache {
  user: User
  profile: Profile | null
  expiresAt: number
  metrics: AuthPerformanceMetrics
}

// Global session cache (memory-based for performance)
const sessionCache = new Map<string, SessionCache>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CONTEXT_CACHE_PREFIX = 'ctx:'

let createContextCallCount = 0
let cacheHitCount = 0
let totalContextTime = 0

// Performance monitoring utility
function startAuthTiming(): AuthPerformanceMetrics {
  return {
    startTime: performance.now(),
    duration: 0,
    contextSize: 0,
    cacheHit: false,
    userFound: false,
    profileFound: false
  }
}

function endAuthTiming(metrics: AuthPerformanceMetrics, additionalData?: AuthMetricsData): AuthPerformanceMetrics {
  metrics.endTime = performance.now()
  metrics.duration = metrics.endTime - metrics.startTime
  
  if (additionalData) {
    Object.assign(metrics, additionalData)
  }
  
  // Log slow contexts for monitoring
  if (metrics.duration > 500) {
    console.warn(`[AUTH-PERF] Slow authentication context: ${metrics.duration.toFixed(2)}ms`, metrics)
  }
  
  return metrics
}

// Optimized session cache with TTL
function getCachedSession(userId: string): SessionCache | null {
  const cacheKey = CONTEXT_CACHE_PREFIX + userId
  const cached = sessionCache.get(cacheKey)
  
  if (cached && Date.now() < cached.expiresAt) {
    cacheHitCount++
    return cached
  }
  
  // Clean up expired cache
  if (cached) {
    sessionCache.delete(cacheKey)
  }
  
  return null
}

function setCachedSession(userId: string, session: SessionCache): void {
  const cacheKey = CONTEXT_CACHE_PREFIX + userId
  session.expiresAt = Date.now() + CACHE_TTL
  sessionCache.set(cacheKey, session)
  
  // Clean up old cache entries to prevent memory leaks
  if (sessionCache.size > 100) {
    const now = Date.now()
    for (const key of sessionCache.keys()) {
      const value = sessionCache.get(key)
      if (value && value.expiresAt < now) {
        sessionCache.delete(key)
      }
    }
  }
}

// Preload profile data to avoid N+1 queries
async function preloadProfile(supabaseClient: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, user_id, email, full_name, avatar_url, role, first_name, last_name, created_at, updated_at')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error preloading profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Exception preloading profile:', error)
    return null
  }
}

// Optimized context creation with async session management
export async function createOptimizedContext() {
  const metrics = startAuthTiming()
  createContextCallCount++
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // SECURITY FIX: Use getUser() instead of getSession() for authenticated user data
    // getUser() validates the session token with Supabase Auth server, preventing security vulnerabilities
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Check if user is authenticated (null if not authenticated, error if invalid)
    if (!user || userError) {
      const finalMetrics = endAuthTiming(metrics, {
        userFound: false,
        profileFound: false,
        cacheHit: false,
        error: userError?.message || 'User not authenticated'
      })
      
      totalContextTime += finalMetrics.duration || 0
      
      return {
        supabase,
        user: null,
        profile: null,
        metrics: finalMetrics
      }
    }
    
    const userId = user.id
    
    // Check cache first
    const cachedSession = getCachedSession(userId)
    if (cachedSession) {
      const finalMetrics = endAuthTiming(metrics, {
        userFound: true,
        profileFound: !!cachedSession.profile,
        cacheHit: true,
        contextSize: JSON.stringify(cachedSession).length
      })
      
      return {
        supabase,
        user: cachedSession.user,
        profile: cachedSession.profile,
        metrics: finalMetrics
      }
    }
    
    // Async session validation (non-blocking)
    const userValidationPromise = supabase.auth.getUser()
    
    // Preload profile while user is being validated
    const profilePromise = preloadProfile(supabase, userId)
    
    // Wait for both in parallel
    const [{ data: { user: validatedUser } }, profile] = await Promise.all([userValidationPromise, profilePromise])
    
    const finalMetrics = endAuthTiming(metrics, {
      userFound: !!validatedUser,
      profileFound: !!profile,
      cacheHit: false,
      contextSize: JSON.stringify({ user: validatedUser, profile }).length
    })
    
    const contextResult = {
      supabase,
      user: validatedUser,
      profile,
      metrics: finalMetrics
    }
    
    // Cache successful sessions
    if (validatedUser) {
      setCachedSession(userId, {
        user: validatedUser,
        profile,
        expiresAt: Date.now() + CACHE_TTL,
        metrics: finalMetrics
      })
    }
    
    totalContextTime += finalMetrics.duration || 0
    
    return contextResult
    
  } catch (error) {
    const finalMetrics = endAuthTiming(metrics, {
      error: error instanceof Error ? error.message : 'Unknown error',
      userFound: false,
      profileFound: false,
      cacheHit: false
    })
    
    console.error('[AUTH-PERF] Context creation failed:', error)
    
    return { 
      supabase: null, 
      user: null, 
      profile: null,
      metrics: finalMetrics
    }
  }
}

// Batch context creation for multiple requests
export async function createOptimizedContextBatch(userIds: string[]): Promise<Map<string, OptimizedContextResult>> {
  const results = new Map<string, OptimizedContextResult>()
  const promises: Promise<void>[] = []
  
  for (const userId of userIds) {
    if (!userId) continue
    
    const promise = createOptimizedContext().then(context => {
      if (context.user?.id === userId) {
        results.set(userId, context)
      }
    }).catch(error => {
      console.error(`[AUTH-PERF] Batch context creation failed for user ${userId}:`, error)
    })
    
    promises.push(promise)
  }
  
  await Promise.allSettled(promises)
  return results
}

// Performance monitoring utilities
export function getAuthPerformanceStats() {
  const avgContextTime = createContextCallCount > 0 ? totalContextTime / createContextCallCount : 0
  const cacheHitRate = createContextCallCount > 0 ? (cacheHitCount / createContextCallCount) * 100 : 0
  
  return {
    totalContextCreations: createContextCallCount,
    averageContextTime: avgContextTime,
    cacheHitRate: cacheHitRate,
    cacheHits: cacheHitCount,
    cacheSize: sessionCache.size
  }
}

// Invalidate session cache (call on logout or session refresh)
export function invalidateUserSession(userId: string): void {
  const cacheKey = CONTEXT_CACHE_PREFIX + userId
  sessionCache.delete(cacheKey)
}

// Invalidate all sessions (call on global events)
export function invalidateAllSessions(): void {
  sessionCache.clear()
  cacheHitCount = 0
  createContextCallCount = 0
  totalContextTime = 0
}
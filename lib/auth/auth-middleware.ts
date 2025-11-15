// ============================================
// lib/auth/auth-middleware.ts
// Performance-optimized authentication middleware with async session management
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createOptimizedContext } from './optimized-context'
import { TRPCError } from '@trpc/server'

// Performance monitoring for auth endpoints
interface AuthEndpointMetrics {
  method: string
  endpoint: string
  startTime: number
  duration?: number
  status: 'success' | 'error' | 'timeout'
  contextTime?: number
  userRole?: string
  cacheHit?: boolean
}

// Global metrics collection
const authMetrics: AuthEndpointMetrics[] = []
const MAX_METRICS_ENTRIES = 1000

// Middleware performance timing
function startAuthEndpointTiming(): number {
  return performance.now()
}

function recordAuthEndpointTiming(
  metrics: Omit<AuthEndpointMetrics, 'startTime' | 'duration'>,
  startTime: number
): void {
  const duration = performance.now() - startTime
  
  const endpointMetrics: AuthEndpointMetrics = {
    ...metrics,
    startTime,
    duration
  }
  
  // Store metrics (bounded collection to prevent memory issues)
  authMetrics.push(endpointMetrics)
  if (authMetrics.length > MAX_METRICS_ENTRIES) {
    authMetrics.shift()
  }
  
  // Log slow endpoints
  if (duration > 1000) {
    console.warn(`[AUTH-MW] Slow auth endpoint: ${metrics.endpoint} took ${duration.toFixed(2)}ms`, {
      method: metrics.method,
      duration,
      status: metrics.status,
      userRole: metrics.userRole
    })
  }
}

// Enhanced authentication middleware with performance monitoring
export async function authMiddleware(request: NextRequest) {
  const startTime = startAuthEndpointTiming()
  const url = new URL(request.url)
  const path = url.pathname
  
  // Skip auth middleware for public routes
  if (isPublicRoute(path)) {
    return NextResponse.next()
  }
  
  try {
    // Create optimized context (non-blocking)
    const context = await createOptimizedContext()
    
    if (!context.user) {
      recordAuthEndpointTiming({
        method: request.method,
        endpoint: path,
        status: 'error',
        contextTime: context.metrics.duration,
        userRole: 'anonymous'
      }, startTime)
      
      return redirectToLogin(request)
    }
    
    // Role-based access control with caching
    const userRole = context.profile?.role || 'user'
    
    // Check route permissions (cached for performance)
    const requiredRole = getRequiredRoleForRoute(path)
    if (requiredRole && !hasPermission(userRole, requiredRole)) {
      recordAuthEndpointTiming({
        method: request.method,
        endpoint: path,
        status: 'error',
        contextTime: context.metrics.duration,
        userRole,
        cacheHit: context.metrics.cacheHit
      }, startTime)
      
      return redirectToUnauthorized(request)
    }
    
    // Add user context to request headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-id', context.user.id)
    response.headers.set('x-user-role', userRole)
    response.headers.set('x-auth-time', context.metrics.duration?.toString() || '0')
    response.headers.set('x-cache-hit', context.metrics.cacheHit ? 'true' : 'false')
    
    recordAuthEndpointTiming({
      method: request.method,
      endpoint: path,
      status: 'success',
      contextTime: context.metrics.duration,
      userRole,
      cacheHit: context.metrics.cacheHit
    }, startTime)
    
    return response
    
  } catch (error) {
    recordAuthEndpointTiming({
      method: request.method,
      endpoint: path,
      status: 'error'
    }, startTime)
    
    console.error('[AUTH-MW] Middleware error:', error)
    return redirectToError(request)
  }
}

// Public routes that don't require authentication
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/api/auth',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ]
  
  return publicRoutes.some(route => path.startsWith(route))
}

// Get required role for different routes
function getRequiredRoleForRoute(path: string): string | null {
  // Admin routes
  if (path.startsWith('/admin')) {
    return 'admin'
  }
  
  // API admin routes
  if (path.startsWith('/api/trpc/admin')) {
    return 'admin'
  }
  
  // User dashboard routes
  if (path.startsWith('/dashboard') || path.startsWith('/api/trpc/dashboard')) {
    return 'user'
  }
  
  return null
}

// Check if user has required permission
function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'admin': 2,
    'user': 1,
    'anonymous': 0
  }
  
  return (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >= 
         (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0)
}

// Redirect helpers
function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/login', request.url)
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

function redirectToUnauthorized(request: NextRequest): NextResponse {
  return new NextResponse('Unauthorized', { status: 403 })
}

function redirectToError(request: NextRequest): NextResponse {
  return new NextResponse('Authentication Error', { status: 500 })
}

// Optimized auth procedures for tRPC with performance monitoring
export function createOptimizedProtectedProcedure() {
  return async ({ ctx, next, path }: { 
    ctx: any, 
    next: () => Promise<any>,
    path: string 
  }) => {
    const startTime = performance.now()
    
    try {
      // Check context metrics for performance
      if (ctx.metrics?.duration && ctx.metrics.duration > 1000) {
        console.warn(`[AUTH-PROC] Slow context for ${path}: ${ctx.metrics.duration}ms`)
      }
      
      // Add performance context to procedure
      const enhancedCtx = {
        ...ctx,
        performance: {
          contextTime: ctx.metrics?.duration || 0,
          cacheHit: ctx.metrics?.cacheHit || false,
          timestamp: Date.now()
        }
      }
      
      const result = await next()
      
      const procedureTime = performance.now() - startTime
      
      // Log slow procedures
      if (procedureTime > 500) {
        console.warn(`[AUTH-PROC] Slow procedure ${path}: ${procedureTime.toFixed(2)}ms`)
      }
      
      return result
      
    } catch (error) {
      const procedureTime = performance.now() - startTime
      
      // Log failed procedures with context
      console.error(`[AUTH-PROC] Failed procedure ${path}:`, {
        error: error instanceof Error ? error.message : error,
        duration: procedureTime,
        contextTime: ctx.metrics?.duration || 0
      })
      
      throw error
    }
  }
}

// Performance monitoring utilities
export function getAuthMiddlewareStats() {
  const recentMetrics = authMetrics.slice(-100) // Last 100 calls
  
  const avgResponseTime = recentMetrics.length > 0 
    ? recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.length
    : 0
  
  const errorRate = recentMetrics.length > 0
    ? (recentMetrics.filter(m => m.status === 'error').length / recentMetrics.length) * 100
    : 0
  
  const cacheHitRate = recentMetrics.length > 0
    ? (recentMetrics.filter(m => m.cacheHit === true).length / recentMetrics.length) * 100
    : 0
  
  return {
    totalRequests: authMetrics.length,
    recentRequests: recentMetrics.length,
    averageResponseTime: avgResponseTime,
    errorRate,
    cacheHitRate,
    slowEndpoints: recentMetrics
      .filter(m => (m.duration || 0) > 1000)
      .map(m => ({ endpoint: m.endpoint, duration: m.duration })),
    topErrorEndpoints: recentMetrics
      .filter(m => m.status === 'error')
      .reduce((acc, m) => {
        acc[m.endpoint] = (acc[m.endpoint] || 0) + 1
        return acc
      }, {} as Record<string, number>)
  }
}

// Export middleware for Next.js config
export { authMiddleware as default }

// Export for manual use
export { recordAuthEndpointTiming }
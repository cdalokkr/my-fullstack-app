// ============================================
// lib/security/route-protection.ts
// Comprehensive route protection with RBAC and security integration
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { TRPCError } from '@trpc/server'
import { getLockoutManager } from './account-lockout'
import { getCSRFProtection } from './csrf-protection'
import { getSecureSessionManager } from './secure-session'
import { loginRateLimiter, generalApiRateLimiter, adminApiRateLimiter, getClientIdentifier } from './rate-limiter'

export enum SecurityLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface RouteProtectionConfig {
  securityLevel: SecurityLevel
  requireCSRF: boolean
  requireRateLimit: boolean
  allowedMethods?: string[]
  requireMFA?: boolean
  sessionTimeout?: number
  allowedIPRanges?: string[]
  userAgentPattern?: RegExp
  customValidator?: (request: NextRequest) => Promise<boolean>
}

export interface SecurityContext {
  user: {
    id: string
    email: string
    role: string
    mfaVerified?: boolean
  } | null
  session: any
  securityLevel: SecurityLevel
  requestId: string
  riskLevel: 'high' | 'medium' | 'low'
  rateLimitInfo?: {
    limit: number
    remaining: number
    resetTime: Date
  }
}

export class RouteProtectionManager {
  private lockoutManager = getLockoutManager()
  private csrfProtection = getCSRFProtection()
  private sessionManager = getSecureSessionManager()
  
  // Default route protection configurations
  private routeConfigs: Map<string, RouteProtectionConfig> = new Map([
    // Public routes
    ['/api/auth/login', {
      securityLevel: SecurityLevel.PUBLIC,
      requireCSRF: true,
      requireRateLimit: true,
      allowedMethods: ['POST']
    }],
    ['/api/auth/logout', {
      securityLevel: SecurityLevel.AUTHENTICATED,
      requireCSRF: true,
      requireRateLimit: false
    }],
    ['/api/auth/refresh', {
      securityLevel: SecurityLevel.AUTHENTICATED,
      requireCSRF: false,
      requireRateLimit: true
    }],
    
    // Admin routes
    ['/admin', {
      securityLevel: SecurityLevel.ADMIN,
      requireCSRF: true,
      requireRateLimit: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    }],
    ['/api/admin', {
      securityLevel: SecurityLevel.ADMIN,
      requireCSRF: true,
      requireRateLimit: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    }],
    
    // User routes
    ['/dashboard', {
      securityLevel: SecurityLevel.USER,
      requireCSRF: true,
      requireRateLimit: true
    }],
    ['/api/user', {
      securityLevel: SecurityLevel.USER,
      requireCSRF: true,
      requireRateLimit: true
    }],
    
    // API routes
    ['/api/trpc', {
      securityLevel: SecurityLevel.AUTHENTICATED,
      requireCSRF: false,
      requireRateLimit: true
    }],
  ])

  // Main protection middleware
  async protectRoute(request: NextRequest, routePath: string): Promise<SecurityContext | NextResponse> {
    const requestId = crypto.randomUUID()
    const url = new URL(request.url)
    const path = this.normalizePath(url.pathname)
    
    // Get route configuration
    const config = this.getRouteConfig(path) || this.getDefaultConfig(path)
    
    // 1. Check rate limiting first
    if (config.requireRateLimit) {
      const rateLimitResponse = await this.checkRateLimit(request, config, path)
      if (rateLimitResponse) {
        return rateLimitResponse
      }
    }
    
    // 2. IP and User Agent validation
    const ipValidation = this.validateIPAndUserAgent(request, config)
    if (!ipValidation.valid) {
      return this.createSecurityErrorResponse('Access denied from this location', 403, requestId)
    }
    
    // 3. CSRF protection for state-changing requests
    if (config.requireCSRF && this.isStateChangingRequest(request)) {
      const csrfResult = await this.validateCSRF(request, path, requestId)
      if (csrfResult.error) {
        return this.createSecurityErrorResponse(csrfResult.error, 403, requestId)
      }
    }
    
    // 4. Security level validation
    const securityContext = await this.validateSecurityLevel(request, config, requestId)
    if (securityContext instanceof NextResponse) {
      return securityContext
    }
    
    // 5. Custom validation
    if (config.customValidator && !(await config.customValidator(request))) {
      return this.createSecurityErrorResponse('Custom validation failed', 403, requestId)
    }
    
    // 6. Add security headers and context
    const response = this.addSecurityHeaders(NextResponse.next(), securityContext, requestId)
    
    return {
      ...securityContext,
      requestId
    }
  }

  // Check rate limiting
  private async checkRateLimit(request: NextRequest, config: RouteProtectionConfig, path: string): Promise<NextResponse | null> {
    try {
      let limiter = generalApiRateLimiter
      
      if (path.startsWith('/api/auth/login')) {
        limiter = loginRateLimiter
      } else if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
        limiter = adminApiRateLimiter
      }
      
      const clientId = getClientIdentifier(request as any)
      const { limited, info, retryAfter } = await limiter.checkLimit(clientId)
      
      if (limited) {
        return this.createRateLimitResponse(info, retryAfter, requestId)
      }
      
      return null
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return null
    }
  }

  // Validate CSRF token
  private async validateCSRF(request: NextRequest, path: string, requestId: string): Promise<{ error?: string }> {
    try {
      const token = this.csrfProtection.extractToken(request as any)
      const sessionId = request.cookies.get('session-id')?.value || 'anonymous'
      
      const isValid = this.csrfProtection.validateToken(token || '', sessionId)
      if (!isValid) {
        await this.logSecurityEvent('csrf_validation_failed', {
          path,
          requestId,
          hasToken: !!token
        })
        return { error: 'Invalid CSRF token' }
      }
      
      return {}
    } catch (error) {
      console.error('CSRF validation error:', error)
      return { error: 'CSRF validation failed' }
    }
  }

  // Validate security level
  private async validateSecurityLevel(
    request: NextRequest, 
    config: RouteProtectionConfig, 
    requestId: string
  ): Promise<SecurityContext | NextResponse> {
    try {
      // For public routes, no authentication required
      if (config.securityLevel === SecurityLevel.PUBLIC) {
        return {
          user: null,
          session: null,
          securityLevel: config.securityLevel,
          requestId,
          riskLevel: 'low'
        }
      }
      
      // Extract session token
      const authHeader = request.headers.get('authorization')
      const sessionToken = authHeader?.toLowerCase().startsWith('bearer ') 
        ? authHeader.substring('bearer '.length)
        : request.cookies.get('session-token')?.value
      
      if (!sessionToken) {
        return this.createAuthErrorResponse('Authentication required', 401, requestId)
      }
      
      // Validate session
      const validation = await this.sessionManager.validateSession(sessionToken, request as any)
      if (!validation.valid) {
        return this.createAuthErrorResponse(validation.error || 'Invalid session', 401, requestId)
      }
      
      // Check account lockout
      const lockoutStatus = await this.lockoutManager.checkLockoutStatus(validation.session!.user.id)
      if (lockoutStatus.isLocked) {
        return this.createAuthErrorResponse('Account is locked', 423, requestId)
      }
      
      // Role-based access control
      const hasAccess = this.checkRoleAccess(validation.session!.user.role, config.securityLevel)
      if (!hasAccess) {
        await this.logSecurityEvent('insufficient_privileges', {
          userId: validation.session!.user.id,
          userRole: validation.session!.user.role,
          requiredLevel: config.securityLevel,
          path: request.nextUrl.pathname,
          requestId
        })
        return this.createAuthErrorResponse('Insufficient privileges', 403, requestId)
      }
      
      return {
        user: validation.session!.user,
        session: validation.session,
        securityLevel: config.securityLevel,
        requestId,
        riskLevel: validation.riskLevel || 'low'
      }
      
    } catch (error) {
      console.error('Security validation error:', error)
      return this.createAuthErrorResponse('Security validation failed', 500, requestId)
    }
  }

  // Check role-based access
  private checkRoleAccess(userRole: string, requiredLevel: SecurityLevel): boolean {
    const roleHierarchy = {
      [SecurityLevel.SUPER_ADMIN]: 4,
      [SecurityLevel.ADMIN]: 3,
      [SecurityLevel.USER]: 2,
      [SecurityLevel.AUTHENTICATED]: 1,
      [SecurityLevel.PUBLIC]: 0
    }
    
    const userLevel = roleHierarchy[userRole as SecurityLevel] || 0
    const requiredUserLevel = roleHierarchy[requiredLevel] || 0
    
    return userLevel >= requiredUserLevel
  }

  // Utility methods
  private normalizePath(pathname: string): string {
    // Remove trailing slash and normalize
    return pathname.replace(/\/$/, '') || '/'
  }

  private getRouteConfig(path: string): RouteProtectionConfig | null {
    for (const [routePattern, config] of this.routeConfigs.entries()) {
      if (this.matchRoute(path, routePattern)) {
        return config
      }
    }
    return null
  }

  private getDefaultConfig(path: string): RouteProtectionConfig {
    // Default to authenticated for API routes, public for others
    if (path.startsWith('/api/')) {
      return {
        securityLevel: SecurityLevel.AUTHENTICATED,
        requireCSRF: true,
        requireRateLimit: true
      }
    }
    
    return {
      securityLevel: SecurityLevel.PUBLIC,
      requireCSRF: false,
      requireRateLimit: false
    }
  }

  private matchRoute(path: string, pattern: string): boolean {
    // Simple pattern matching - in production, use a proper router
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1))
    }
    return path === pattern
  }

  private isStateChangingRequest(request: NextRequest): boolean {
    const method = request.method.toUpperCase()
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  }

  private validateIPAndUserAgent(request: NextRequest, config: RouteProtectionConfig): { valid: boolean } {
    // IP range validation
    if (config.allowedIPRanges && config.allowedIPRanges.length > 0) {
      const clientIP = this.getClientIP(request)
      const isAllowed = config.allowedIPRanges.some(range => this.ipInRange(clientIP, range))
      if (!isAllowed) {
        return { valid: false }
      }
    }
    
    // User agent validation
    if (config.userAgentPattern) {
      const userAgent = request.headers.get('user-agent') || ''
      if (!config.userAgentPattern.test(userAgent)) {
        return { valid: false }
      }
    }
    
    return { valid: true }
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }
    
    return request.ip || 'unknown'
  }

  private ipInRange(ip: string, range: string): boolean {
    // Simple IP range validation - implement proper CIDR checking in production
    return ip.startsWith(range.split('/')[0])
  }

  // Response creators
  private createSecurityErrorResponse(message: string, status: number, requestId: string): NextResponse {
    return new NextResponse(JSON.stringify({ 
      error: message,
      requestId,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    })
  }

  private createAuthErrorResponse(message: string, status: number, requestId: string): NextResponse {
    return this.createSecurityErrorResponse(message, status, requestId)
  }

  private createRateLimitResponse(limitInfo: any, retryAfter: number | undefined, requestId: string): NextResponse {
    return new NextResponse(JSON.stringify({
      error: 'Rate limit exceeded',
      requestId,
      retryAfter,
      limit: limitInfo.limit,
      remaining: limitInfo.remaining
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Retry-After': (retryAfter || 60).toString(),
        'X-RateLimit-Limit': limitInfo.limit.toString(),
        'X-RateLimit-Remaining': limitInfo.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(limitInfo.resetTime.getTime() / 1000).toString()
      }
    })
  }

  private addSecurityHeaders(response: NextResponse, context: SecurityContext, requestId: string): NextResponse {
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    if (context.user) {
      response.headers.set('X-User-ID', context.user.id)
      response.headers.set('X-User-Role', context.user.role)
    }
    
    response.headers.set('X-Security-Level', context.securityLevel)
    response.headers.set('X-Risk-Level', context.riskLevel)
    
    return response
  }

  private async logSecurityEvent(event: string, data: any): Promise<void> {
    console.log(`[SECURITY] ${event}:`, data)
    // In production, send to your security monitoring system
  }

  // Add custom route configuration
  addRouteConfig(path: string, config: RouteProtectionConfig): void {
    this.routeConfigs.set(path, config)
  }

  // Get security statistics
  getSecurityStats() {
    return {
      totalRoutes: this.routeConfigs.size,
      routesBySecurityLevel: Array.from(this.routeConfigs.values())
        .reduce((acc, config) => {
          acc[config.securityLevel] = (acc[config.securityLevel] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      csrfRequired: Array.from(this.routeConfigs.values()).filter(c => c.requireCSRF).length,
      rateLimited: Array.from(this.routeConfigs.values()).filter(c => c.requireRateLimit).length
    }
  }
}

// Singleton instance
let routeProtectionManager: RouteProtectionManager | null = null

export function getRouteProtectionManager(): RouteProtectionManager {
  if (!routeProtectionManager) {
    routeProtectionManager = new RouteProtectionManager()
  }
  return routeProtectionManager
}

// Export middleware for Next.js
export async function securityMiddleware(request: NextRequest) {
  const protectionManager = getRouteProtectionManager()
  const result = await protectionManager.protectRoute(request, request.nextUrl.pathname)
  
  if (result instanceof NextResponse) {
    return result
  }
  
  return result
}
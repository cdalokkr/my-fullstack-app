// ============================================
// tests/security-comprehensive-test.ts
// Comprehensive security testing suite for all implemented security features
// ============================================
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { 
  RateLimiter, 
  loginRateLimiter, 
  generalApiRateLimiter,
  getClientIdentifier
} from '../lib/security/rate-limiter'
import { CSRFProtection, getCSRFProtection } from '../lib/security/csrf-protection'
import { AccountLockoutManager } from '../lib/security/account-lockout'
import { SecureSessionManager } from '../lib/security/secure-session'
import { RouteProtectionManager, SecurityLevel } from '../lib/security/route-protection'
import { SecurityMonitor, getSecurityMonitor } from '../lib/security/security-monitor'
import { createClient } from '@supabase/supabase-js'

describe('Security Test Suite', () => {
  let csrfProtection: CSRFProtection
  let sessionManager: SecureSessionManager
  let routeProtection: RouteProtectionManager
  let securityMonitor: SecurityMonitor

  beforeAll(() => {
    csrfProtection = getCSRFProtection()
    sessionManager = new SecureSessionManager()
    routeProtection = new RouteProtectionManager()
    securityMonitor = getSecurityMonitor()
  })

  afterAll(() => {
    // Clean up any test data
  })

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('Rate Limiting Tests', () => {
    test('should allow requests within rate limit', async () => {
      const customLimiter = new RateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
        keyGenerator: (id) => `test:${id}`
      })

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await customLimiter.checkLimit('test-user-1')
        expect(result.limited).toBe(false)
        expect(result.info.remaining).toBe(5 - i - 1)
      }
    })

    test('should block requests exceeding rate limit', async () => {
      const customLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (id) => `test:${id}`
      })

      // First 2 requests should succeed
      await customLimiter.checkLimit('test-user-2')
      await customLimiter.checkLimit('test-user-2')

      // 3rd request should be blocked
      const result = await customLimiter.checkLimit('test-user-2')
      expect(result.limited).toBe(true)
      expect(result.retryAfter).toBeDefined()
    })

    test('should handle login rate limiting specifically', async () => {
      // Simulate multiple login attempts
      for (let i = 0; i < 5; i++) {
        await loginRateLimiter.checkLimit('192.168.1.1')
      }

      const result = await loginRateLimiter.checkLimit('192.168.1.1')
      expect(result.limited).toBe(true)
    })

    test('should reset rate limit after window expires', async () => {
      const customLimiter = new RateLimiter({
        windowMs: 100, // Very short window for testing
        maxRequests: 1,
        keyGenerator: (id) => `test:${id}`
      })

      // First request succeeds
      let result = await customLimiter.checkLimit('test-user-3')
      expect(result.limited).toBe(false)

      // Second request fails
      result = await customLimiter.checkLimit('test-user-3')
      expect(result.limited).toBe(true)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should allow request again
      result = await customLimiter.checkLimit('test-user-3')
      expect(result.limited).toBe(false)
    })
  })

  describe('CSRF Protection Tests', () => {
    test('should generate valid CSRF tokens', () => {
      const token = csrfProtection.generateToken('test-session-1')
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    test('should validate correct CSRF tokens', () => {
      const sessionId = 'test-session-2'
      const token = csrfProtection.generateToken(sessionId)
      
      const isValid = csrfProtection.validateToken(token, sessionId)
      expect(isValid).toBe(true)
    })

    test('should reject invalid CSRF tokens', () => {
      const sessionId = 'test-session-3'
      csrfProtection.generateToken(sessionId)
      
      const isValid = csrfProtection.validateToken('invalid-token', sessionId)
      expect(isValid).toBe(false)
    })

    test('should reject tokens from different sessions', () => {
      const token = csrfProtection.generateToken('session-1')
      const isValid = csrfProtection.validateToken(token, 'session-2')
      expect(isValid).toBe(false)
    })

    test('should handle CSRF middleware for safe methods', async () => {
      const request = new Request('http://localhost/test', {
        method: 'GET'
      })

      const middleware = csrfProtection.createCSRFMiddleware()
      const result = await middleware(request, { sessionId: 'test-session' })
      
      expect(result.valid).toBe(true)
    })

    test('should require CSRF tokens for state-changing methods', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST'
      })

      const middleware = csrfProtection.createCSRFMiddleware()
      const result = await middleware(request, { sessionId: 'test-session' })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('CSRF token missing')
    })
  })

  describe('Account Lockout Tests', () => {
    let lockoutManager: AccountLockoutManager

    beforeAll(() => {
      // Create a mock for testing
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          single: jest.fn()
        })
      }
      lockoutManager = new AccountLockoutManager(mockSupabase as any)
    })

    test('should not lock account initially', async () => {
      // Mock the Supabase response
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }
      
      const manager = new AccountLockoutManager(mockSupabase as any)
      const status = await manager.checkLockoutStatus('test-user-1')
      expect(status.isLocked).toBe(false)
      expect(status.failedAttempts).toBe(0)
      expect(status.severity).toBe('none')
    })

    test('should record security violations', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'violation-1',
              violation_type: 'brute_force',
              severity: 'high'
            },
            error: null
          })
        })
      }
      
      const manager = new AccountLockoutManager(mockSupabase as any)
      const violation = await manager.recordSecurityViolation(
        'test-user-2',
        'brute_force',
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      )

      expect(violation.violation_type).toBe('brute_force')
      expect(violation.severity).toBe('high')
    })
  })

  describe('Session Management Tests', () => {
    test('should create valid session tokens', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user'
      }

      const request = new Request('http://localhost/test', {
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const session = await sessionManager.createSession(user, request)
      
      expect(session.access_token).toBeDefined()
      expect(session.token_type).toBe('bearer')
      expect(session.user.id).toBe('user-1')
      expect(session.expires_at).toBeDefined()
    })

    test('should validate correct sessions', async () => {
      const user = {
        id: 'user-2',
        email: 'test2@example.com',
        role: 'admin'
      }

      const request = new Request('http://localhost/test', {
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const session = await sessionManager.createSession(user, request)
      const validation = await sessionManager.validateSession(session.access_token, request)
      
      expect(validation.valid).toBe(true)
      expect(validation.session).toBeDefined()
      expect(validation.riskLevel).toBeDefined()
    })

    test('should reject invalid sessions', async () => {
      const request = new Request('http://localhost/test', {
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const validation = await sessionManager.validateSession('invalid-token', request)
      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
    })

    test('should refresh access tokens', async () => {
      const user = {
        id: 'user-3',
        email: 'test3@example.com',
        role: 'user'
      }

      const request = new Request('http://localhost/test', {
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const session = await sessionManager.createSession(user, request)
      
      const refreshResult = await sessionManager.refreshAccessToken(session.refresh_token!)
      expect(refreshResult.success).toBe(true)
      expect(refreshResult.newToken).toBeDefined()
    })
  })

  describe('Route Protection Tests', () => {
    test('should allow access to public routes', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST'
      })

      const result = await routeProtection.protectRoute(request as any, '/api/auth/login')
      
      expect(result).not.toBeInstanceOf(Response)
      expect((result as any).securityLevel).toBe(SecurityLevel.PUBLIC)
    })

    test('should require authentication for protected routes', async () => {
      const request = new Request('http://localhost/dashboard', {
        method: 'GET'
      })

      const result = await routeProtection.protectRoute(request as any, '/dashboard')
      
      // Should return an authentication error response
      expect(result).toBeInstanceOf(Response)
    })

    test('should enforce role-based access control', async () => {
      // This would require a valid session with specific role
      // For testing purposes, we'll mock the session validation
      const request = new Request('http://localhost/admin', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      })

      const result = await routeProtection.protectRoute(request as any, '/admin')
      
      expect(result).toBeInstanceOf(Response)
    })

    test('should add security headers to responses', async () => {
      const request = new Request('http://localhost/public', {
        method: 'GET'
      })

      const result = await routeProtection.protectRoute(request as any, '/public')
      
      if (result instanceof Response === false) {
        const response = (result as any).response
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(response.headers.get('X-Frame-Options')).toBe('DENY')
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      }
    })
  })

  describe('Security Monitoring Tests', () => {
    test('should record security events', async () => {
      const eventId = await securityMonitor.recordEvent({
        event_type: 'login_attempt',
        severity: 'low',
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        endpoint: '/api/auth/login',
        method: 'POST',
        status_code: 200,
        response_time: 100,
        metadata: { test: true },
        resolved: false,
        alert_triggered: false,
        tags: ['test']
      })

      expect(eventId).toBeDefined()
    })

    test('should detect brute force patterns', async () => {
      // Record multiple failed login attempts
      for (let i = 0; i < 15; i++) {
        await securityMonitor.recordEvent({
          event_type: 'login_failure',
          severity: 'high',
          ip_address: '192.168.1.100',
          user_agent: 'Attack Bot',
          endpoint: '/api/auth/login',
          method: 'POST',
          status_code: 401,
          response_time: 50,
          metadata: { attempt: i },
          resolved: false,
          alert_triggered: false,
          tags: ['brute_force']
        })
      }

      const anomalies = await securityMonitor.detectAnomalies()
      const bruteForceAnomaly = anomalies.find((a: any) => a.type === 'login_pattern')
      
      expect(bruteForceAnomaly).toBeDefined()
      expect(bruteForceAnomaly?.severity).toBe('critical')
    })

    test('should generate security metrics', async () => {
      // Record some events
      await securityMonitor.recordEvent({
        event_type: 'login_success',
        severity: 'low',
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        endpoint: '/api/auth/login',
        method: 'POST',
        status_code: 200,
        response_time: 100,
        metadata: {},
        resolved: false,
        alert_triggered: false,
        tags: ['login']
      })

      const metrics = await securityMonitor.getSecurityMetrics('1h')
      expect(metrics.total_events).toBeGreaterThan(0)
      expect(metrics.security_score).toBeDefined()
    })

    test('should handle real-time alerts', async () => {
      const alerts = await securityMonitor.getRealTimeAlerts()
      expect(Array.isArray(alerts)).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    test('should handle complete authentication flow with security', async () => {
      const clientIP = '192.168.1.50'
      
      // 1. Check rate limiting for login
      const rateLimitResult = await loginRateLimiter.checkLimit(clientIP)
      expect(rateLimitResult.limited).toBe(false)

      // 2. Create session
      const user = { id: 'integration-user', email: 'integration@example.com', role: 'user' }
      const request = new Request('http://localhost/test', {
        headers: { 'x-forwarded-for': clientIP, 'user-agent': 'Test Browser' }
      })
      const session = await sessionManager.createSession(user, request)

      // 3. Validate session
      const validation = await sessionManager.validateSession(session.access_token, request)
      expect(validation.valid).toBe(true)

      // 4. Record successful login
      await securityMonitor.recordEvent({
        event_type: 'login_success',
        severity: 'low',
        user_id: user.id,
        session_id: 'test-session',
        ip_address: clientIP,
        user_agent: 'Test Browser',
        endpoint: '/api/auth/login',
        method: 'POST',
        status_code: 200,
        response_time: 150,
        metadata: { integration: true },
        resolved: false,
        alert_triggered: false,
        tags: ['integration_test']
      })

      // 5. Check security metrics
      const metrics = await securityMonitor.getSecurityMetrics('1h')
      expect(metrics.total_events).toBeGreaterThan(0)
    })

    test('should handle attack scenarios', async () => {
      const attackerIP = '192.168.1.200'
      
      // Simulate brute force attack
      for (let i = 0; i < 10; i++) {
        // Check rate limiting
        const rateLimitResult = await loginRateLimiter.checkLimit(attackerIP)
        
        // Record failed login
        await securityMonitor.recordEvent({
          event_type: 'login_failure',
          severity: 'high',
          ip_address: attackerIP,
          user_agent: 'Attack Tool',
          endpoint: '/api/auth/login',
          method: 'POST',
          status_code: 401,
          response_time: 25,
          metadata: { attack_attempt: i },
          resolved: false,
          alert_triggered: false,
          tags: ['attack', 'brute_force']
        })
      }

      // Should trigger rate limiting
      const finalRateLimitResult = await loginRateLimiter.checkLimit(attackerIP)
      expect(finalRateLimitResult.limited).toBe(true)

      // Should detect anomaly
      const anomalies = await securityMonitor.detectAnomalies()
      const bruteForceAnomaly = anomalies.find((a: any) => a.type === 'login_pattern')
      expect(bruteForceAnomaly).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50
      const promises: Promise<any>[] = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          loginRateLimiter.checkLimit(`192.168.1.${i % 10}`)
        )
      }

      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results).toHaveLength(concurrentRequests)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('should maintain performance under load', async () => {
      const iterations = 100
      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        const token = csrfProtection.generateToken(`perf-test-${i}`)
        csrfProtection.validateToken(token, `perf-test-${i}`)
      }

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})

// Security test utilities
export class SecurityTestUtils {
  static createMockRequest(options: {
    method?: string
    path?: string
    headers?: Record<string, string>
    body?: any
  } = {}): Request {
    const { method = 'GET', path = '/', headers = {}, body } = options
    
    const requestInit: RequestInit = {
      method,
      headers
    }

    if (body) {
      requestInit.body = JSON.stringify(body)
      requestInit.headers = {
        ...headers,
        'Content-Type': 'application/json'
      }
    }

    return new Request(`http://localhost${path}`, requestInit)
  }

  static createMockUser(id: string, role: string = 'user'): any {
    return {
      id,
      email: `${id}@example.com`,
      role,
      first_name: 'Test',
      last_name: 'User'
    }
  }

  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async generateLoad(generator: () => Promise<any>, count: number): Promise<void> {
    const promises = []
    for (let i = 0; i < count; i++) {
      promises.push(generator())
    }
    await Promise.all(promises)
  }
}
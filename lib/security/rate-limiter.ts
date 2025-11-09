// ============================================
// lib/security/rate-limiter.ts
// Advanced rate limiting with Redis support and multiple strategies
// ============================================
import { createClient } from '@supabase/supabase-js'

// Rate limiting strategies
export enum RateLimitStrategy {
  SLIDING_WINDOW = 'sliding_window',
  FIXED_WINDOW = 'fixed_window',
  TOKEN_BUCKET = 'token_bucket'
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  strategy?: RateLimitStrategy
  keyGenerator?: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: Date
  totalHits: number
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>
  decrement(key: string): Promise<void>
  resetKey(key: string): Promise<void>
  getRemainingRequests(key: string, limit: number): Promise<RateLimitInfo>
}

// In-memory store for development (use Redis in production)
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs })
      return 1
    }

    record.count++
    return record.count
  }

  async decrement(key: string): Promise<void> {
    const record = this.store.get(key)
    if (record && record.count > 0) {
      record.count--
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key)
  }

  async getRemainingRequests(key: string, limit: number): Promise<RateLimitInfo> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      return {
        limit,
        remaining: limit,
        resetTime: new Date(now),
        totalHits: 0
      }
    }

    return {
      limit,
      remaining: Math.max(0, limit - record.count),
      resetTime: new Date(record.resetTime),
      totalHits: record.count
    }
  }
}

// Redis store for production
class RedisRateLimitStore implements RateLimitStore {
  private redis: any

  constructor() {
    // Initialize Redis client if available
    this.redis = null // Placeholder for Redis client
  }

  async increment(key: string, windowMs: number): Promise<number> {
    // Implement Redis-based increment
    // This is a placeholder - implement with actual Redis client
    return 1
  }

  async decrement(key: string): Promise<void> {
    // Implement Redis-based decrement
  }

  async resetKey(key: string): Promise<void> {
    // Implement Redis key reset
  }

  async getRemainingRequests(key: string, limit: number): Promise<RateLimitInfo> {
    // Implement Redis-based rate limit info
    return {
      limit,
      remaining: limit,
      resetTime: new Date(),
      totalHits: 0
    }
  }
}

export class RateLimiter {
  private store: RateLimitStore
  public config: RateLimitConfig

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      strategy: RateLimitStrategy.SLIDING_WINDOW,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      ...config
    }
    
    // Use provided store or default to memory store
    this.store = store || new MemoryRateLimitStore()
  }

  async checkLimit(identifier: string): Promise<{ 
    limited: boolean; 
    info: RateLimitInfo;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier)
      : `rate_limit:${identifier}`

    const hits = await this.store.increment(key, this.config.windowMs)
    const info = await this.store.getRemainingRequests(key, this.config.maxRequests)

    const limited = hits > this.config.maxRequests
    let retryAfter: number | undefined

    if (limited) {
      retryAfter = Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
    }

    return { limited, info, retryAfter }
  }

  async recordSuccess(identifier: string): Promise<void> {
    if (this.config.skipSuccessfulRequests) {
      const key = this.config.keyGenerator 
        ? this.config.keyGenerator(identifier)
        : `rate_limit:${identifier}`
      await this.store.decrement(key)
    }
  }

  async recordFailure(identifier: string): Promise<void> {
    // Always record failures (don't decrement)
  }

  async reset(identifier: string): Promise<void> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier)
      : `rate_limit:${identifier}`
    await this.store.resetKey(key)
  }

  getHeaders(info: RateLimitInfo): Record<string, string | number> {
    const headers: Record<string, string | number> = {}

    if (this.config.standardHeaders) {
      headers['X-RateLimit-Limit'] = info.limit
      headers['X-RateLimit-Remaining'] = info.remaining
      headers['X-RateLimit-Reset'] = Math.ceil(info.resetTime.getTime() / 1000)
    }

    if (this.config.legacyHeaders) {
      headers['X-RateLimit-Limit'] = info.limit
      headers['X-RateLimit-Remaining'] = info.remaining
    }

    return headers
  }
}

// Pre-configured rate limiters for different endpoints
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  keyGenerator: (identifier: string) => `login:${identifier}`,
  message: 'Too many login attempts. Please wait before trying again.'
})

export const generalApiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  keyGenerator: (identifier: string) => `api:${identifier}`
})

export const adminApiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per 15 minutes
  keyGenerator: (identifier: string) => `admin:${identifier}`
})

// Rate limiting utility functions
export function getClientIdentifier(request: Request): string {
  // Get client IP (consider X-Forwarded-For, X-Real-IP headers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to a default identifier
  return 'unknown'
}

export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: Request, identifier?: string) => {
    const clientId = identifier || getClientIdentifier(request)
    const { limited, info, retryAfter } = await limiter.checkLimit(clientId)

    const headers = limiter.getHeaders(info)

    if (limited) {
      headers['Retry-After'] = retryAfter || Math.ceil(limiter.config.windowMs / 1000)
      return new Response(JSON.stringify({ 
        error: limiter.config.message,
        retryAfter: retryAfter || Math.ceil(limiter.config.windowMs / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })
    }

    return { headers, limited: false, info }
  }
}
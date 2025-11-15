// ============================================
// lib/security/account-lockout.ts
// Account lockout and security violation tracking system
// ============================================
import { createClient } from '@supabase/supabase-js'

export interface SecurityViolation {
  id: string
  user_id: string
  violation_type: 'brute_force' | 'suspicious_login' | 'account_takeover' | 'rate_limit_exceeded' | 'invalid_session'
  ip_address: string
  user_agent: string
  attempts_count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'escalated'
  created_at: string
  resolved_at?: string
  metadata?: Record<string, any>
}

export interface LockoutPolicy {
  maxFailedAttempts: number
  lockoutDurationMinutes: number
  progressiveBackoff: boolean
  maxLockoutDurationHours: number
  notificationThreshold: number
  allowUnlockByEmail: boolean
}

export interface AccountLockoutStatus {
  isLocked: boolean
  failedAttempts: number
  nextAvailableAt?: Date
  lockoutReason?: string
  severity: 'none' | 'warning' | 'locked' | 'blocked'
}

export class AccountLockoutManager {
  private supabase: any
  private defaultPolicy: LockoutPolicy

  constructor(supabaseClient: any, policy?: Partial<LockoutPolicy>) {
    this.supabase = supabaseClient
    this.defaultPolicy = {
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15,
      progressiveBackoff: true,
      maxLockoutDurationHours: 24,
      notificationThreshold: 3,
      allowUnlockByEmail: true,
      ...policy
    }
  }

  // Check if account is currently locked
  async checkLockoutStatus(userId: string, ipAddress?: string): Promise<AccountLockoutStatus> {
    try {
      // Check for active violations
      const { data: violations } = await this.supabase
        .from('security_violations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!violations || violations.length === 0) {
        return {
          isLocked: false,
          failedAttempts: 0,
          severity: 'none'
        }
      }

      // Check for current lockout
      const activeLockout = violations.find((v: SecurityViolation) =>
        v.violation_type === 'brute_force' &&
        new Date(v.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )

      if (activeLockout) {
        const lockoutEnd = new Date(activeLockout.created_at)
        lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.getLockoutDuration(violations.length))

        const now = new Date()
        if (now < lockoutEnd) {
          return {
            isLocked: true,
            failedAttempts: violations.length,
            nextAvailableAt: lockoutEnd,
            lockoutReason: 'Multiple failed login attempts detected',
            severity: 'locked'
          }
        } else {
          // Lockout period has expired
          await this.resolveViolation(activeLockout.id)
        }
      }

      return {
        isLocked: false,
        failedAttempts: violations.length,
        severity: violations.length >= this.defaultPolicy.notificationThreshold ? 'warning' : 'none'
      }

    } catch (error) {
      console.error('Error checking lockout status:', error)
      return {
        isLocked: false,
        failedAttempts: 0,
        severity: 'none'
      }
    }
  }

  // Record a security violation
  async recordSecurityViolation(
    userId: string,
    violationType: SecurityViolation['violation_type'],
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<SecurityViolation> {
    try {
      // Check recent violations to calculate severity
      const recentViolations = await this.getRecentViolations(userId, 60) // Last 60 minutes

      const severity = this.calculateSeverity(violationType, recentViolations.length)

      const { data, error } = await this.supabase
        .from('security_violations')
        .insert({
          user_id: userId,
          violation_type: violationType,
          ip_address: ipAddress,
          user_agent: userAgent,
          attempts_count: recentViolations.length + 1,
          severity,
          status: 'active',
          metadata: metadata || {}
        })
        .select()
        .single()

      if (error) throw error

      // Check if lockout should be triggered
      await this.evaluateLockout(userId, recentViolations.length + 1)

      // Log security event
      await this.logSecurityEvent('violation_recorded', {
        userId,
        violationType,
        severity,
        attemptsCount: recentViolations.length + 1
      })

      return data

    } catch (error) {
      console.error('Error recording security violation:', error)
      throw error
    }
  }

  // Unlock account
  async unlockAccount(userId: string, reason: string, unlockedBy?: string): Promise<void> {
    try {
      // Update all active violations for this user
      const { error: updateError } = await this.supabase
        .from('security_violations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          metadata: {
            unlock_reason: reason,
            unlocked_by: unlockedBy
          }
        })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (updateError) throw updateError

      // Log unlock event
      await this.logSecurityEvent('account_unlocked', {
        userId,
        reason,
        unlockedBy
      })

    } catch (error) {
      console.error('Error unlocking account:', error)
      throw error
    }
  }

  // Get recent violations for a user
  private async getRecentViolations(userId: string, minutesBack: number): Promise<SecurityViolation[]> {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000).toISOString()

    const { data } = await this.supabase
      .from('security_violations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })

    return data || []
  }

  // Calculate severity based on violation type and frequency
  private calculateSeverity(violationType: SecurityViolation['violation_type'], attemptsCount: number): SecurityViolation['severity'] {
    const severityMap: Record<SecurityViolation['violation_type'], SecurityViolation['severity']> = {
      'brute_force': 'critical',
      'account_takeover': 'critical',
      'invalid_session': 'medium',
      'rate_limit_exceeded': 'low',
      'suspicious_login': 'high'
    }

    const baseSeverity = severityMap[violationType] || 'low'

    // Escalate severity based on attempt count
    if (attemptsCount >= 10) return 'critical'
    if (attemptsCount >= 5) return 'high'
    if (attemptsCount >= 3) return (baseSeverity === 'low' ? 'medium' : baseSeverity) as SecurityViolation['severity']

    return baseSeverity as SecurityViolation['severity']
  }

  // Get lockout duration based on attempt count
  private getLockoutDuration(attemptsCount: number): number {
    if (!this.defaultPolicy.progressiveBackoff) {
      return this.defaultPolicy.lockoutDurationMinutes
    }

    // Progressive backoff: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 24hr
    const backoffMinutes = [15, 30, 60, 120, 240, 480, 1440]
    const index = Math.min(attemptsCount - 1, backoffMinutes.length - 1)
    
    return backoffMinutes[index]
  }

  // Evaluate if account should be locked
  private async evaluateLockout(userId: string, attemptsCount: number): Promise<void> {
    if (attemptsCount >= this.defaultPolicy.maxFailedAttempts) {
      // Account should be locked
      await this.recordSecurityViolation(
        userId,
        'brute_force',
        'system',
        'system'
      )
    }
  }

  // Resolve a specific violation
  private async resolveViolation(violationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('security_violations')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', violationId)

    if (error) {
      console.error('Error resolving violation:', error)
    }
  }

  // Log security events
  private async logSecurityEvent(event: string, data: any): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          event_type: event,
          event_data: data,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  // Get security dashboard data
  async getSecurityDashboard() {
    try {
      const { data: recentViolations } = await this.supabase
        .from('security_violations')
        .select(`
          *,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      const { data: stats } = await this.supabase
        .from('security_violations')
        .select('violation_type, severity, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      return {
        recentViolations: recentViolations || [],
        stats: this.calculateSecurityStats(stats || []),
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error getting security dashboard:', error)
      return {
        recentViolations: [],
        stats: { total: 0, critical: 0, locked: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }

  // Calculate security statistics
  private calculateSecurityStats(violations: any[]) {
    return {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
      locked: violations.filter(v => v.status === 'active' && v.violation_type === 'brute_force').length,
      byType: violations.reduce((acc, v) => {
        acc[v.violation_type] = (acc[v.violation_type] || 0) + 1
        return acc
      }, {})
    }
  }
}

// Singleton instance
let lockoutManager: AccountLockoutManager | null = null

export function getLockoutManager(): AccountLockoutManager {
  if (!lockoutManager) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    lockoutManager = new AccountLockoutManager(supabase)
  }
  return lockoutManager
}
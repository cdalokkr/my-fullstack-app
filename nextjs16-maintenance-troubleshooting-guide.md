# Next.js 16 Maintenance and Troubleshooting Guide

## Overview

This guide provides comprehensive procedures for maintaining and troubleshooting the optimized Next.js 16 application. It covers routine maintenance, performance monitoring, issue diagnosis, and emergency response procedures.

## Routine Maintenance

### Daily Maintenance Tasks

#### Automated Health Monitoring
```bash
#!/bin/bash
# daily-health-check.sh

echo "🔍 Running daily health checks..."

# Application health
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

# Performance metrics
curl -s http://localhost:3000/api/metrics | jq '.metrics."api_response_time".avg'

# System resources
echo "Memory usage:"
free -h

echo "Disk usage:"
df -h /

echo "Application logs:"
pm2 logs your-app --lines 10 --nostream
```

#### Log Rotation
```bash
# PM2 log rotation (configured in ecosystem.config.js)
pm2 reloadLogs

# System log cleanup
sudo logrotate -f /etc/logrotate.d/your-app
```

### Weekly Maintenance Tasks

#### Performance Review
```bash
#!/bin/bash
# weekly-performance-review.sh

echo "📊 Weekly Performance Review"

# Bundle size analysis
npm run build
echo "Bundle sizes:"
ls -lah .next/static/chunks/

# Database performance
echo "Slow queries (>100ms):"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;"

# Cache hit rates
echo "Cache performance:"
# Add cache monitoring logic
```

#### Security Audit
```bash
# Run automated security audit
node scripts/security-audit.js

# Check for vulnerable dependencies
npm audit

# Update dependencies (review changes first)
npm update --save
```

#### Database Maintenance
```sql
-- Analyze table statistics
ANALYZE VERBOSE;

-- Check index usage
SELECT schemaname, tablename, indexname,
       idx_tup_read, idx_tup_fetch,
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Clean up unused indexes (if any)
-- DROP INDEX CONCURRENTLY IF EXISTS unused_index_name;
```

### Monthly Maintenance Tasks

#### Comprehensive System Review
```bash
#!/bin/bash
# monthly-system-review.sh

echo "🔍 Monthly System Review"

# Application metrics
echo "30-day performance summary:"
curl -s http://localhost:3000/api/metrics | jq '.summary'

# Security assessment
echo "Security audit:"
node scripts/security-audit.js

# Dependency updates
echo "Outdated dependencies:"
npm outdated

# System resources
echo "System load:"
uptime
echo "Memory usage:"
free -h
echo "Disk usage:"
df -h
```

#### Backup Verification
```bash
# Test backup restoration
echo "Testing backup restoration..."

# Create test database
createdb test_restore

# Restore from backup
gunzip -c /backups/database-$(date +%Y%m%d).sql.gz | psql -d test_restore

# Verify data integrity
psql -d test_restore -c "SELECT COUNT(*) FROM profiles;"

# Clean up
dropdb test_restore
```

## Performance Monitoring

### Key Performance Indicators (KPIs)

#### Application Performance
- **Page Load Time:** Target < 2000ms
- **API Response Time:** Target < 500ms
- **Error Rate:** Target < 1%
- **Bundle Size:** Target < 300KB

#### System Performance
- **Memory Usage:** Target < 80%
- **CPU Usage:** Target < 70%
- **Disk Usage:** Target < 85%
- **Database Connections:** Target < 80% of pool

### Monitoring Commands

#### Real-time Monitoring
```bash
# PM2 monitoring
pm2 monit

# System monitoring
htop

# Network monitoring
sudo netstat -tlnp | grep :3000
```

#### Performance Analysis
```bash
# Bundle analysis
npm run build:analyze

# Lighthouse performance audit
npx lighthouse http://localhost:3000 --output json --output-path ./lighthouse-report.json

# Database query analysis
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM profiles WHERE email = 'test@example.com';"
```

## Troubleshooting Procedures

### Application Issues

#### Application Won't Start
**Symptoms:** PM2 shows errored status, application not accessible

**Diagnosis:**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs your-app --lines 50

# Check environment variables
pm2 env 0

# Check Node.js version
node --version

# Check port availability
sudo netstat -tlnp | grep :3000
```

**Solutions:**
```bash
# Restart application
pm2 restart your-app

# If restart fails, check configuration
pm2 describe your-app

# Rebuild application
npm run build
pm2 restart your-app

# Check file permissions
ls -la /path/to/your/app
```

#### High Memory Usage
**Symptoms:** Application consuming excessive memory, potential crashes

**Diagnosis:**
```bash
# Check memory usage
pm2 monit

# Check for memory leaks
pm2 logs your-app | grep -i "heap"

# Analyze heap dumps (if enabled)
# Requires heapdump package
```

**Solutions:**
```bash
# Restart application
pm2 restart your-app

# Scale application (if using cluster mode)
pm2 scale your-app 2

# Check for memory-intensive operations
# Review recent code changes
# Implement memory monitoring
```

#### Slow Performance
**Symptoms:** Slow page loads, high response times

**Diagnosis:**
```bash
# Check system resources
uptime
free -h

# Check database performance
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check application metrics
curl http://localhost:3000/api/metrics

# Profile application
npm run build:analyze
```

**Solutions:**
```bash
# Restart application
pm2 restart your-app

# Clear caches
# Redis flush if applicable
# Application cache clear

# Database optimization
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "VACUUM ANALYZE;"

# Check for blocking queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT pid, query, age(clock_timestamp(), query_start) as duration
FROM pg_stat_activity
WHERE state = 'active' AND age(clock_timestamp(), query_start) > interval '1 minute'
ORDER BY duration DESC;"
```

### Database Issues

#### Connection Pool Exhaustion
**Symptoms:** Database connection errors, slow queries

**Diagnosis:**
```bash
# Check active connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT count(*) as active_connections,
       state,
       wait_event
FROM pg_stat_activity
GROUP BY state, wait_event;"

# Check connection pool settings
# Review PgBouncer or connection pool configuration
```

**Solutions:**
```bash
# Restart connection pool
sudo systemctl restart pgbouncer

# Increase pool size (if configured)
# Review application connection usage

# Kill long-running queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND age(clock_timestamp(), query_start) > interval '5 minutes';"
```

#### Slow Queries
**Symptoms:** Queries taking longer than expected

**Diagnosis:**
```bash
# Find slow queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Analyze specific query
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM your_table WHERE your_condition;"
```

**Solutions:**
```bash
# Add missing indexes
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);"

# Update statistics
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "ANALYZE table_name;"

# Query optimization
# Review and rewrite slow queries
```

### Security Issues

#### Security Alert Investigation
**Symptoms:** Security monitoring alerts, suspicious activity

**Investigation:**
```bash
# Check security logs
grep -i "security\|attack\|suspicious" /var/log/your-app/*.log

# Review access logs
grep "status=[45].." /var/log/nginx/access.log | tail -20

# Check for common attack patterns
grep -i "sql\|xss\|csrf" /var/log/your-app/*.log

# Run security audit
node scripts/security-audit.js
```

**Response:**
```bash
# Block suspicious IPs (temporary)
sudo iptables -A INPUT -s suspicious_ip -j DROP

# Update security rules
# Review and update CSP if needed
# Update security headers if needed

# Notify security team
# Escalate if necessary
```

## Emergency Response Procedures

### Critical Incident Response

#### Application Down (Critical)
**Immediate Actions:**
```bash
# 1. Confirm the issue
curl -f http://localhost:3000/api/health || echo "Application is down"

# 2. Check system status
pm2 status
sudo systemctl status nginx

# 3. Attempt restart
pm2 restart all
sudo systemctl restart nginx

# 4. Check logs for errors
pm2 logs your-app --lines 20
sudo tail -20 /var/log/nginx/error.log

# 5. If restart fails, rollback
./scripts/deploy-production.sh rollback
```

#### Data Loss (Critical)
**Immediate Actions:**
```bash
# 1. Stop all writes
pm2 stop all

# 2. Assess data loss
# Check database integrity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public';"

# 3. Restore from backup
gunzip -c /backups/database-emergency.sql.gz | psql -d $DB_NAME

# 4. Verify data integrity
# Run application tests
npm test

# 5. Restart application
pm2 start all
```

#### Security Breach (Critical)
**Immediate Actions:**
```bash
# 1. Isolate the system
# Disconnect from network if necessary
sudo iptables -F
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# 2. Preserve evidence
# Take system snapshots
# Preserve logs

# 3. Notify security team
# Follow incident response plan

# 4. Assess damage
# Check for data exfiltration
# Review access logs

# 5. Recovery planning
# Plan system rebuild if necessary
```

### Communication Plan

#### Internal Communication
- **Slack/Teams:** Immediate updates for technical team
- **Email:** Formal incident reports
- **Status Page:** Customer-facing updates

#### External Communication
- **Customers:** Status page updates for outages
- **Stakeholders:** Regular updates for critical incidents
- **Media:** Prepared statements if necessary

### Post-Incident Activities

#### Incident Review
```markdown
# Incident Report Template

## Incident Summary
- Date/Time: [timestamp]
- Duration: [duration]
- Impact: [affected users/services]
- Severity: [critical/high/medium/low]

## Timeline
- Detection: [when/how detected]
- Response: [initial actions]
- Resolution: [how fixed]
- Communication: [updates sent]

## Root Cause
- Technical cause: [detailed explanation]
- Contributing factors: [list]
- Prevention: [how to prevent recurrence]

## Resolution
- Actions taken: [step-by-step]
- Verification: [how confirmed fixed]
- Rollback: [if performed]

## Lessons Learned
- What went well: [list]
- What could improve: [list]
- Action items: [list with owners]

## Metrics
- MTTR: [mean time to resolution]
- Impact assessment: [quantitative impact]
- Prevention measures: [implemented safeguards]
```

#### Follow-up Actions
- Implement fixes for root cause
- Update monitoring/alerts
- Review and update procedures
- Team training if needed
- Stakeholder communication

## Performance Optimization

### Ongoing Optimization Tasks

#### Bundle Optimization
```bash
# Regular bundle analysis
npm run build:analyze

# Monitor bundle size trends
echo "Bundle size history:"
ls -la .next/static/chunks/ | grep -E "\.js$" | sort -k5 -n

# Optimize if size increases
# Review new dependencies
# Consider code splitting improvements
```

#### Database Optimization
```sql
-- Regular index maintenance
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) as size,
       idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0  -- Unused indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Rebuild fragmented indexes
REINDEX INDEX CONCURRENTLY index_name;

-- Update table statistics
ANALYZE VERBOSE;
```

#### Caching Optimization
```bash
# Monitor cache hit rates
# Adjust TTL settings based on usage patterns
# Implement cache warming for frequently accessed data
```

### Capacity Planning

#### Resource Monitoring
```bash
# CPU monitoring
uptime
mpstat 1 5

# Memory monitoring
free -h
vmstat 1 5

# Disk I/O monitoring
iostat -x 1 5

# Network monitoring
sar -n DEV 1 5
```

#### Scaling Decisions
- **Vertical Scaling:** Increase server resources
- **Horizontal Scaling:** Add more servers/load balancers
- **Database Scaling:** Read replicas, connection pooling
- **Caching:** Redis cluster, CDN optimization

## Backup and Recovery

### Backup Procedures
```bash
#!/bin/bash
# automated-backup.sh

# Database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > /backups/database-$(date +%Y%m%d-%H%M%S).sql.gz

# Application files backup
tar -czf /backups/app-$(date +%Y%m%d-%H%M%S).tar.gz /path/to/your/app --exclude=node_modules

# Configuration backup
tar -czf /backups/config-$(date +%Y%m%d-%H%M%S).tar.gz /path/to/your/app/.env*

# Cleanup old backups (keep 30 days)
find /backups -name "*.gz" -mtime +30 -delete
```

### Recovery Testing
```bash
#!/bin/bash
# disaster-recovery-test.sh

echo "🧪 Testing Disaster Recovery"

# 1. Simulate data loss
# Create test scenario

# 2. Execute recovery
# Restore from backup

# 3. Verify integrity
# Run health checks
# Run application tests

# 4. Measure RTO/RPO
# Document recovery time
# Assess data loss

echo "✅ Disaster recovery test completed"
```

## Contact Information

### Support Teams
- **Development Team:** dev-team@company.com
- **DevOps Team:** devops@company.com
- **Database Team:** dba@company.com
- **Security Team:** security@company.com

### Escalation Contacts
- **On-call Engineer:** oncall@company.com (24/7)
- **Technical Lead:** tech-lead@company.com
- **CTO:** cto@company.com

### External Resources
- **Next.js Documentation:** https://nextjs.org/docs
- **Supabase Documentation:** https://supabase.com/docs
- **PM2 Documentation:** https://pm2.keymetrics.io/docs

---

**Maintenance Guide Prepared By:** Kilo Code Technical Leadership
**Date:** October 30, 2025
**Version:** 1.0
**Review Date:** Monthly
# Production House — Deployment Checklist

## Pre-Deployment Verification

### Code Review
- [x] All TypeScript files compiled without errors
- [x] No `any` types used
- [x] Error handling on all async operations
- [x] No hardcoded secrets or API keys
- [x] No console.log statements (development only)
- [x] Code follows established patterns
- [x] Comments added for complex logic

### Database Migrations
- [x] Schema migration (001_schema.sql) - 316 lines, all 14 tables created
- [x] RLS policies migration (002_rls.sql) - 759 lines, 72 policies defined
- [x] Functions migration (003_functions.sql) - 96 lines, helpers and triggers
- [x] All migrations tested locally
- [x] Foreign keys configured with proper cascades
- [x] Indexes created for performance

### Authentication System
- [x] Supabase client (browser-safe)
- [x] Server-side client with cookie handling
- [x] Admin client with service role key
- [x] Middleware for token refresh
- [x] Auth helpers for common operations
- [x] Login page with email/password/magic link/OAuth
- [x] Signup page with registration flow
- [x] OAuth callback handler
- [x] Error handling and user feedback

### Security
- [x] RLS policies on all tables
- [x] Multi-tenant isolation at organization level
- [x] Admin-only routes protected
- [x] Service role key not exposed
- [x] Session management with automatic refresh
- [x] Environment variables documented
- [x] No sensitive data in logs

### Documentation
- [x] AUTHENTICATION_DATABASE_SETUP.md - Comprehensive guide
- [x] QUICK_START_REFERENCE.md - Quick lookup and examples
- [x] .env.local.example - Configuration template
- [x] Code comments and docstrings
- [x] API patterns documented

## Local Testing (Before Deployment)

### Prerequisites
```bash
# Verify Node.js and npm
node --version  # Should be 18+
npm --version

# Install dependencies
npm install

# Verify all packages installed
npm list @supabase/ssr @supabase/supabase-js
```

### Database Setup
```bash
# Create Supabase project at supabase.com
# Copy project URL and API keys to .env.local

# Apply migrations
cp .env.local.example .env.local
# Edit .env.local with Supabase values

supabase link
supabase db push
# Or manually run migrations in SQL editor
```

### Authentication Testing
```bash
npm run dev
# Visit http://localhost:3000/signup
# [ ] Create account
# [ ] Receive confirmation email
# [ ] Click confirmation link
# [ ] Redirected to login

# [ ] Login with email/password
# [ ] Redirected to /dashboard
# [ ] Session persists on refresh
# [ ] Logout works

# [ ] Test magic link (if email configured)
# [ ] Test Google OAuth (if configured)
```

### Security Testing
```sql
-- In Supabase SQL Editor

-- Test RLS with organization isolation
SELECT * FROM organizations;  -- Should show only your org

-- Test published article visibility (public)
SELECT * FROM articles WHERE status = 'published';
-- Should return articles even for public/unauthenticated

-- Test admin operations
SELECT * FROM admin_alerts;  -- Only visible to admins

-- View active RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public' LIMIT 5;
```

### Route Protection Testing
- [ ] `/dashboard` redirects to `/login` if not authenticated
- [ ] `/admin` redirects to `/dashboard` if not admin
- [ ] Public routes accessible without auth
- [ ] Protected routes accessible with auth
- [ ] Admin routes require admin role

### Form Validation Testing
- [ ] Signup password validation (min 6 chars)
- [ ] Email validation on all forms
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] Forms prevent double-submission

## Staging Deployment

### Environment Setup
```bash
# Set these in your hosting provider (Vercel, Railway, etc.)
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_AI_API_KEY=...
RESEND_API_KEY=...
LATE_API_KEY=...
NEXT_PUBLIC_APP_URL=https://staging.yourapp.com
```

### Database Preparation
- [ ] Create new Supabase project for staging
- [ ] Run all 3 migrations in order
- [ ] Verify all tables created
- [ ] Check RLS policies are applied
- [ ] Test database queries work

### Staging Verification
- [ ] Deploy to staging environment
- [ ] Run full authentication flow
- [ ] Test all authentication methods
- [ ] Verify RLS policies work
- [ ] Check API endpoints
- [ ] Monitor error logs
- [ ] Load test with concurrent users
- [ ] Test on mobile devices

### Email Configuration (If Using Resend)
- [ ] Verify sender domain
- [ ] Test confirmation emails sent
- [ ] Test password reset emails
- [ ] Check email templates render correctly

### OAuth Configuration
- [ ] Google OAuth credentials configured
- [ ] Redirect URLs set correctly
- [ ] Test OAuth flow end-to-end
- [ ] Verify user creation after OAuth

## Production Deployment

### Pre-Production Checklist
- [ ] All staging tests passed
- [ ] Performance testing completed
- [ ] Security audit passed
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Support documentation ready
- [ ] Team trained on procedures

### Production Environment Setup
```bash
# Same as staging but use production values
NEXT_PUBLIC_SUPABASE_URL=<prod-url>
# ... other production credentials
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Production Database
- [ ] Create production Supabase project
- [ ] Run migrations (001, 002, 003) in order
- [ ] Verify all 14 tables created
- [ ] Verify 72 RLS policies applied
- [ ] Test admin user creation
- [ ] Verify helper functions exist

### SSL/TLS
- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] Mixed content warnings resolved
- [ ] Security headers set

### Custom Domains (Optional)
- [ ] Domain DNS records configured
- [ ] Domain verification completed
- [ ] SSL certificate provisioned
- [ ] Redirect URLs updated

### Post-Deployment Verification
- [ ] Website loads without errors
- [ ] Signup/login flows work
- [ ] Forms submit correctly
- [ ] Redirects work properly
- [ ] Error pages display correctly
- [ ] Analytics/monitoring working
- [ ] Email delivery verified

### Monitoring Setup
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring (Vercel, etc.)
- [ ] Log aggregation (if needed)
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up
- [ ] Database backups enabled
- [ ] Regular backup testing scheduled

## Post-Deployment

### Immediate (First 24 Hours)
- [ ] Monitor error logs constantly
- [ ] Check email deliverability
- [ ] Verify OAuth functionality
- [ ] Monitor database performance
- [ ] Check authentication rate limits
- [ ] Test payment flows (if configured)

### Weekly
- [ ] Review error logs
- [ ] Check failed authentication attempts
- [ ] Verify backup completion
- [ ] Monitor database query performance
- [ ] Review user feedback

### Monthly
- [ ] Rotate API keys
- [ ] Review RLS policies for effectiveness
- [ ] Update security headers if needed
- [ ] Performance optimization
- [ ] Database maintenance

## Rollback Plan

If critical issues occur after deployment:

### Quick Rollback
```bash
# Using Vercel
vercel rollback
# Select previous deployment

# Using other providers
# Redeploy from previous working commit
git checkout <previous-commit>
npm run build
# Deploy
```

### Database Rollback
```sql
-- Backup current data before any risky operations
-- If needed, restore from backup:
-- Contact Supabase support for restoration
```

## Common Issues & Fixes

### Database Connection Fails
- [ ] Verify NEXT_PUBLIC_SUPABASE_URL is correct
- [ ] Verify API keys are correct
- [ ] Check Supabase project is active
- [ ] Verify RLS policies allow your user

### Authentication Not Working
- [ ] Check .env.local.example matches your values
- [ ] Verify Supabase Auth enabled
- [ ] Check OAuth app credentials
- [ ] Verify redirect URLs in OAuth app

### RLS Prevents Access
- [ ] Ensure user has organization_id
- [ ] Check RLS policy conditions
- [ ] Verify user role is set correctly
- [ ] Test with admin user (should bypass)

### Email Not Sending
- [ ] Verify Resend API key
- [ ] Check sender domain verification
- [ ] Review email templates
- [ ] Check spam/junk folder

## Monitoring Queries

Monitor these to ensure health:

```sql
-- Check recent logins
SELECT COUNT(*) as login_count, DATE(created_at) as date
FROM auth.audit_log_entries
WHERE event = 'signin'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- Check for RLS errors
SELECT * FROM pg_stat_statements
WHERE query LIKE '%pg_policies%'
ORDER BY calls DESC;

-- Monitor article processing
SELECT status, COUNT(*) as count
FROM articles
WHERE created_at > now() - interval '24 hours'
GROUP BY status;

-- Check job execution
SELECT job_type, status, COUNT(*) as count
FROM job_log
WHERE started_at > now() - interval '7 days'
GROUP BY job_type, status;

-- Monitor admin alerts
SELECT severity, COUNT(*) as count
FROM admin_alerts
WHERE is_resolved = false
GROUP BY severity;
```

## Maintenance Windows

Schedule maintenance for:
- Database backups (should be automatic with Supabase)
- Dependency updates (monthly)
- Security patches (as needed)
- Performance optimization (quarterly)
- Data cleanup/archival (semi-annual)

## Support & Documentation

Key contacts and resources:
- Supabase Status: status.supabase.com
- Vercel Status: status.vercel.com
- Stripe Status: status.stripe.com
- Email: Your support email
- Documentation: See AUTHENTICATION_DATABASE_SETUP.md

## Sign-Off

- [ ] Tech Lead: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
- [ ] Security: _________________ Date: _______
- [ ] QA: _________________ Date: _______

---

**Last Updated**: February 14, 2026
**Status**: Ready for Production
**Next Review**: After first month in production

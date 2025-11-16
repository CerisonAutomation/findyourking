# 🔐 FindYourKing Security Checklist

## Critical Security Items - DO IMMEDIATELY

### 🚨 URGENT: Protect Your Credentials

- [ ] **Create `.env.local` file** with your Supabase credentials
  - Location: Project root (same level as `package.json`)
  - Contains: API keys, database passwords, JWT secrets
  - **NEVER commit to git!**

- [ ] **Verify `.env.local` is gitignored**
  ```bash
  cat .gitignore | grep ".env"
  ```
  Must show: `.env*.local` or `.env.local`

- [ ] **Check git history for exposed secrets**
  ```bash
  git log --all --oneline --grep="env\|secret\|key" --author=""
  git log -S "SUPABASE" --oneline
  git log -S "DATABASE_URL" --oneline
  ```

- [ ] **If credentials were committed:**
  1. Immediately rotate all keys in Supabase Dashboard
  2. Force push (⚠️ only if safe): `git push -f origin main`
  3. Notify Vercel to invalidate cache

---

## Access Control & Permissions

- [ ] **Supabase RLS (Row Level Security) enabled** for all tables
  - Check: Supabase Dashboard → Tables → Click table → RLS toggle
  - Must be ON for:
    - `profiles`
    - `kings`
    - `bookings`
    - `messages`
    - `reviews`
    - `notifications`

- [ ] **RLS Policies implemented** for each table
  - [ ] SELECT: Users can only view their own records
  - [ ] INSERT: Users can only create their own records
  - [ ] UPDATE: Users can only update their own records
  - [ ] DELETE: Users can only delete their own records

- [ ] **Admin role** created in Supabase
  - Can bypass RLS for administrative tasks
  - Limited to trusted admins only

- [ ] **JWT verification** working correctly
  - Auth tokens are signed with `SUPABASE_JWT_SECRET`
  - Verified on every protected request

---

## Authentication Security

- [ ] **Password hashing** enabled
  - Supabase handles this automatically
  - Verify: All user passwords in DB are hashed (never plain text)

- [ ] **Session management** secure
  - Access tokens: Short-lived (15 min default)
  - Refresh tokens: Longer-lived (1 week default)
  - Stored securely (httpOnly cookies recommended)

- [ ] **Email verification** optional but recommended
  - New users must verify email
  - Prevents spam account creation

- [ ] **Password reset flow** implemented
  - Tokens expire after 24 hours
  - Sent via email only
  - Cannot be reused after password changed

- [ ] **OAuth providers** (if used) properly configured
  - Redirect URIs whitelisted
  - Only trusted providers enabled
  - Credentials stored in environment variables

---

## Database Security

- [ ] **Database backups** enabled
  - Daily automated backups configured
  - At least 7-day retention
  - Test restore process quarterly

- [ ] **SQL injection protection**
  - All queries use parameterized statements
  - Verify: Search codebase for `.query()` or `.sql\`\`` patterns
  - ✅ Using Supabase client eliminates most injection risks

- [ ] **Database user permissions** limited
  - Separate users for app, migrations, admin
  - Each has minimal required permissions
  - `postgres` user password changed from default

- [ ] **Connection pooling** configured
  - Use pooled connection for app (`DATABASE_URL`)
  - Use non-pooled for migrations (`DATABASE_URL_NON_POOLING`)
  - Set connection limits in Supabase

- [ ] **Logs monitored** for suspicious queries
  - Check: Supabase Dashboard → Logs
  - Watch for unusual connection patterns
  - Alert on failed authentication attempts

---

## API Security

- [ ] **Rate limiting** implemented
  - Prevent brute force attacks
  - Limit per IP: 100 requests/minute for auth endpoints
  - Limit per user: 1000 requests/minute for general API

- [ ] **CORS** properly configured
  - Only allow requests from your domain
  - No wildcard (`*`) in production
  - Credentials included only for same-domain

- [ ] **Input validation** on all API endpoints
  - Validate data types (string, number, email)
  - Validate lengths (max 255 chars for names)
  - Sanitize user inputs (remove HTML/scripts)
  - Reject malformed requests early

- [ ] **API response filtering**
  - Never return sensitive fields (passwords, tokens)
  - Example: User query returns `{id, name, bio}` not `{id, name, bio, password_hash}`

- [ ] **HTTPS only** (enforced in production)
  - All endpoints require HTTPS
  - Redirect HTTP → HTTPS
  - Set `Strict-Transport-Security` header

- [ ] **API versioning**
  - Document API versions
  - Maintain backwards compatibility
  - Deprecate old endpoints properly

---

## File Upload Security

- [ ] **File upload validation**
  - Whitelist allowed file types (.jpg, .png, .pdf only)
  - Validate file size limits (< 10MB)
  - Scan for malware

- [ ] **Secure file storage**
  - Upload to Supabase Storage (not database)
  - Files have public/private access control
  - Signed URLs for time-limited access
  - Delete old files automatically

- [ ] **Filename sanitization**
  - Remove special characters from filenames
  - Use random UUIDs instead of user input
  - Store original filename separately if needed

---

## Frontend Security

- [ ] **No secrets in frontend code**
  - ✅ Only use `NEXT_PUBLIC_*` variables for public keys
  - ❌ Never hardcode API keys/passwords
  - ❌ Never log sensitive data to console

- [ ] **Content Security Policy (CSP)** headers set
  ```
  default-src 'self'
  script-src 'self' 'unsafe-inline'
  style-src 'self' 'unsafe-inline'
  img-src 'self' https:
  ```

- [ ] **XSS protection** enabled
  - Sanitize user-generated content
  - Escape HTML entities
  - Use Content Security Policy

- [ ] **CSRF protection** implemented
  - Use SameSite cookie attribute
  - Verify CSRF tokens on state-changing requests
  - Next.js provides built-in protection

- [ ] **Sensitive data not in localStorage**
  - ❌ Don't store: passwords, tokens (partially)
  - ✅ OK to store: user preferences, theme
  - Use httpOnly cookies for auth tokens instead

---

## Monitoring & Logging

- [ ] **Error logging** configured
  - Errors logged to Sentry or similar
  - NOT displayed to users in production
  - Internal errors return generic messages

- [ ] **Audit logging** enabled
  - Track who accessed what and when
  - Log: login, logout, data changes
  - Retention: 90 days minimum

- [ ] **Performance monitoring** active
  - Track API response times
  - Alert on slowdowns
  - Monitor database query performance

- [ ] **Security monitoring** configured
  - Detect brute force attempts (multiple failed logins)
  - Alert on unusual activity
  - Monitor for suspicious patterns

- [ ] **Log storage** secure
  - Logs encrypted at rest
  - Access restricted to admins
  - Automated cleanup of old logs

---

## Deployment Security

- [ ] **Environment variables** not exposed
  - ✅ Set in Vercel environment settings
  - ❌ Never in git, comments, or documentation
  - Verify: Vercel Dashboard → Project Settings → Environment

- [ ] **Secrets rotation** scheduled
  - Change database password: Quarterly
  - Rotate API keys: Annually or if exposed
  - Update JWT secrets: Never (breaks existing tokens)

- [ ] **Deployment pipeline** secure
  - Only authorized people can deploy
  - Require code review before deploy
  - Use branch protection on main

- [ ] **SSL/TLS certificate** valid
  - HTTPS enabled for all domains
  - Certificate auto-renews (Vercel handles this)
  - No self-signed certificates in production

- [ ] **Security headers** configured
  ```
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=()
  ```

---

## Dependency Security

- [ ] **npm dependencies** up to date
  ```bash
  npm outdated
  npm update
  npm audit
  ```

- [ ] **Security vulnerabilities** fixed
  - Run: `npm audit`
  - Fix: `npm audit fix` (or manually review)
  - Check regularly: Use Dependabot or Snyk

- [ ] **Licenses** checked
  - All dependencies use compatible licenses
  - No GPL/AGPL conflicts

- [ ] **Unused dependencies** removed
  - Smaller attack surface
  - Faster dependency updates
  - Cleaner codebase

---

## Incident Response

- [ ] **Incident response plan** documented
  - Steps to take if data breach occurs
  - Who to notify (security team, legal, users)
  - Communication templates

- [ ] **Backup & recovery** tested
  - Can restore from backup in < 1 hour
  - Backup tested monthly
  - Recovery procedure documented

- [ ] **Security contacts** established
  - Email for security reports: security@yourdomain.com
  - Response SLA: < 24 hours
  - Published on website or security.txt

---

## Testing & Validation

- [ ] **Security testing** performed
  - SQL injection tests
  - XSS tests
  - CSRF tests
  - Authentication bypass tests

- [ ] **Penetration testing** (for production)
  - Consider hiring external security firm
  - At least annually
  - Fix all findings before public launch

- [ ] **Automated security scanning** enabled
  - SAST (Static Analysis): Code scanning on commits
  - DAST (Dynamic Analysis): Runtime testing
  - Container scanning: If using Docker

---

## Documentation

- [ ] **Security documentation** created
  - Data flow diagrams
  - Authentication architecture
  - Encryption key management
  - Incident response procedures

- [ ] **Developer security guide** written
  - How to use API securely
  - Common pitfalls to avoid
  - Best practices

- [ ] **Privacy policy** published
  - What data is collected
  - How it's used
  - How long it's stored
  - User rights and requests

- [ ] **Terms of service** updated
  - Acceptable use policy
  - Liability disclaimers
  - Changes and updates notification

---

## Compliance

- [ ] **GDPR compliance** (if serving EU users)
  - User consent for data collection
  - Right to access personal data
  - Right to be forgotten (data deletion)
  - Data breach notification within 72 hours

- [ ] **CCPA compliance** (if serving CA residents)
  - Privacy notice provided
  - Right to know data collected
  - Right to delete personal info
  - Right to opt-out of sales

- [ ] **Payment security** (if handling payments)
  - PCI DSS compliance
  - Never store credit card data
  - Use Stripe/payment processor
  - Encrypt sensitive payment info

---

## Quick Security Audit

Run this script to check basic security:

```bash
#!/bin/bash
echo "🔐 FindYourKing Security Audit"

# Check gitignore
echo "✓ Checking .gitignore..."
grep -q ".env" .gitignore && echo "  ✅ .env ignored" || echo "  ❌ .env NOT ignored!"

# Check for secrets in git
echo "✓ Checking git history..."
git log -p | grep -i "password\|secret\|api.key" && echo "  ⚠️ Secrets found in git!" || echo "  ✅ No secrets in history"

# Check for hardcoded keys
echo "✓ Checking for hardcoded keys..."
grep -r "eyJ" app/ lib/ components/ 2>/dev/null && echo "  ⚠️ JWT tokens found in code!" || echo "  ✅ No tokens in code"

# Check npm vulnerabilities
echo "✓ Checking dependencies..."
npm audit 2>/dev/null | grep -q "vulnerabilities" && echo "  ⚠️ Vulnerabilities found!" || echo "  ✅ No vulnerabilities"

echo ""
echo "Audit complete!"
```

---

## Security Update Schedule

**Weekly:**
- [ ] Check npm audit for new vulnerabilities
- [ ] Review error logs for anomalies

**Monthly:**
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Check backup status

**Quarterly:**
- [ ] Rotate credentials if high-risk
- [ ] Test disaster recovery
- [ ] Security training for team

**Annually:**
- [ ] Full penetration test
- [ ] Security audit
- [ ] Update security policies

---

## Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Next.js Security:** https://nextjs.org/docs/going-to-production/security
- **Supabase Security:** https://supabase.com/docs/guides/auth
- **npm Security:** https://docs.npmjs.com/cli/v8/commands/npm-audit

---

**Last Updated:** November 15, 2025  
**Status:** ✅ Ready for Review

---

## Sign-Off

- [ ] Security lead reviewed and approved
- [ ] All critical items implemented
- [ ] Team trained on security practices
- [ ] Ready for production deployment


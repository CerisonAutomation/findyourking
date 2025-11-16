# 🔐 FindYourKing Credentials Setup Guide

## ⚠️ CRITICAL - READ FIRST

Your Supabase credentials have been provided. This document explains how to set them up securely.

**Remember:**
- ❌ NEVER commit `.env.local` to Git
- ❌ NEVER share credentials publicly  
- ❌ NEVER expose secrets in code
- ✅ ALWAYS keep credentials in `.env.local` (which is gitignored)
- ✅ ALWAYS use secure environment variables in production

---

## 🚀 Quick Setup (5 minutes)

### 1. Create `.env.local` File

Open your terminal in the project root:

```bash
cd /Users/cerisonbrown/Downloads/findyourkingproject/findyourking-reborn
```

Create `.env.local` file (exact filename - don't use `.env` or `.env.development`):

```bash
cat > .env.local << 'EOF'
# FindYourKing Environment Variables
# Created: 2025-11-15
# DO NOT COMMIT TO GIT

# ✅ Public Keys (Frontend - Safe)
NEXT_PUBLIC_SUPABASE_URL="https://jxsskdhygpvmrpkhyhcl.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c3NrZGh5Z3B2bXJwa2h5aGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTg4NTgsImV4cCI6MjA3ODY3NDg1OH0.xn8JKqsWEmJRAwx9wClk-lZwIcmYzX0x6SsdaHMunjE"

# 🔐 Private Keys (Server Only - KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c3NrZGh5Z3B2bXJwa2h5aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA5ODg1OCwiZXhwIjoyMDc4Njc0ODU4fQ.FvV4XB4hYDPa6TCs78agxGFje-D_Km4HvIKryg3XAnA"
SUPABASE_JWT_SECRET="VM4kZFICFvOiU87m/7LGUkoFpQBgUGv1hdBk8C+vzCNCb2RXfV6dY7k8zZcuB+iOmTTsV2pJbfNmpsRw0Dn5uw=="

# 🗄️ Database Connection Strings (KEEP SECRET)
DATABASE_URL="postgres://postgres.jxsskdhygpvmrpkhyhcl:Fp5hphx2B4LLvfIn@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DATABASE_URL_NON_POOLING="postgres://postgres.jxsskdhygpvmrpkhyhcl:Fp5hphx2B4LLvfIn@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Environment
NODE_ENV="development"
EOF
```

### 2. Verify File Created

```bash
ls -la .env.local
```

You should see: `-rw-r--r-- ... .env.local`

### 3. Verify It's Protected in Git

```bash
git status | grep env
```

You should see nothing (meaning it's ignored). Or:

```bash
cat .gitignore | grep env
```

You should see: `.env*.local` and/or `.env`

### 4. Restart Dev Server

```bash
# Kill existing server
npm run dev

# You'll see: Available at http://localhost:3000
```

### 5. Test the Connection

Open browser and check:
- http://localhost:3000 should load without errors
- Check browser console (F12) for errors
- No "Supabase connection failed" messages

✅ **Done!** Your credentials are set up securely.

---

## 📋 What Each Variable Does

### Public Variables (Visible to Frontend)

**`NEXT_PUBLIC_SUPABASE_URL`**
- Your Supabase project URL
- Needed to connect from browser
- Safe to expose (publicly listed on your website)
- Example: `https://jxsskdhygpvmrpkhyhcl.supabase.co`

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- Anonymous key for public operations
- Used by frontend JavaScript
- Limited by RLS policies
- Safe to expose (often in code/docs)
- Example: Starts with `eyJ...` (JWT format)

### Private Variables (Server Only)

**`SUPABASE_SERVICE_ROLE_KEY`**
- 🔴 KEEP SECRET - Never expose!
- Full database access (bypass RLS)
- Used only in server-side code/API routes
- If leaked: rotate immediately in Supabase Dashboard
- Example: Starts with `eyJ...` (JWT format)

**`SUPABASE_JWT_SECRET`**
- 🔴 KEEP SECRET - Never expose!
- Used to sign/verify JWT tokens
- Used in authentication middleware
- If leaked: all existing tokens become invalid
- Example: Base64 encoded string

**`DATABASE_URL`**
- 🔴 KEEP SECRET - Never expose!
- Connection string for pooled connections
- Used for app database queries
- Pooling enabled for performance
- If leaked: reset Postgres password immediately
- Format: `postgres://user:pass@host:port/db?params`

**`DATABASE_URL_NON_POOLING`**
- 🔴 KEEP SECRET - Never expose!
- Connection string for migrations/admin tasks
- Direct connection (no pooling)
- Use for:
  - Database migrations
  - Admin operations
  - Batch operations
- If leaked: reset Postgres password immediately

---

## 🔍 Verification Commands

### Check Environment Variables Loaded

```bash
# From Node REPL
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Should output: https://jxsskdhygpvmrpkhyhcl.supabase.co
```

### Test Supabase Connection

```bash
# Create test-supabase.js
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Missing env variables!')
  process.exit(1)
}

const supabase = createClient(url, key)
console.log('✅ Supabase client created successfully!')
EOF

# Run test
node test-supabase.js

# Should output: ✅ Supabase client created successfully!
# Clean up
rm test-supabase.js
```

### Verify Git Protection

```bash
# Check .env.local is NOT in git
git ls-files | grep ".env"

# Should show nothing

# Check it's in .gitignore
grep "\.env" .gitignore

# Should show: .env*.local and/or .env
```

---

## 🚨 If You Accidentally Exposed Credentials

### Immediate Actions (Do Now!)

1. **Rotate the exposed key in Supabase:**
   - Go to https://app.supabase.com
   - Select your project (jxsskdhygpvmrpkhyhcl)
   - Settings → API
   - Regenerate the exposed key
   - Copy new key

2. **Update `.env.local`:**
   - Paste new key value
   - Save file
   - Restart server

3. **If service role key leaked:**
   - Anyone has full database access
   - Immediately notify users of potential breach
   - Backup database before rotating
   - Regenerate in Supabase
   - Update all deployments

4. **If database password leaked:**
   - Reset Postgres password in Supabase
   - Update `DATABASE_URL` variables
   - Restart all connections
   - Change admin password
   - Audit recent queries

5. **Check git history:**
   ```bash
   # Search for exposed keys
   git log -p | grep -i "eyJ\|postgres\|password"
   
   # If found, you may need to rewrite history (dangerous!)
   # Recommend using BFG Repo-Cleaner if needed
   ```

6. **Notify Vercel (if deployed):**
   - Update environment variables in Vercel Dashboard
   - Project Settings → Environment Variables
   - Update with new credentials
   - Trigger redeploy

---

## 📊 Environment Variables by Location

### Development (Your Computer)
```
File: .env.local (gitignored)
Used by: npm run dev
Variables: All (public + private)
Protection: Git ignores it automatically
Rotation: Not needed (local only)
```

### Production (Vercel)
```
Location: Vercel Dashboard → Project Settings → Environment Variables
Variables: All (public + private)
Protection: Encrypted at Vercel, only visible to team
Rotation: Every 6 months for security role key
Deployment: Automatically deployed on redeploy
```

### CI/CD Pipeline (GitHub Actions, etc.)
```
Location: GitHub Secrets (Settings → Secrets)
Variables: Private keys only
Protection: Encrypted, only used during deployment
Rotation: After security events
Access: Limited to deployment workflows only
```

---

## ✅ Security Checklist

- [ ] `.env.local` file created with all credentials
- [ ] `.env.local` is in `.gitignore` (verified with `git status`)
- [ ] **Never** committed `.env.local` to git
- [ ] Dev server restarted and running without errors
- [ ] All pages load successfully
- [ ] No "Supabase connection" errors in browser console
- [ ] Verified credentials are NOT in any git commits
- [ ] Supabase project settings show correct credentials
- [ ] Ready to proceed with development

---

## 🔄 When to Rotate Credentials

**Rotate Immediately:**
- Credentials appear in public repository
- Someone with access leaves team
- Suspicious database activity detected
- Regular security audit recommends it

**Rotate Regularly:**
- Quarterly: Rotate service role key
- Quarterly: Rotate JWT secret (⚠️ careful - invalidates tokens)
- Annually: Rotate database password
- Annually: Rotate all API keys

**Don't Rotate Unnecessarily:**
- Public anon key (can't access anything sensitive anyway)
- Just rotated (wait 90 days minimum)
- No security incident occurred

---

## 🎯 Next Steps

1. ✅ Set up `.env.local` (you are here)
2. ✅ Verify credentials work (test connection)
3. → Set up Supabase tables/RLS policies
4. → Deploy to Vercel with environment variables
5. → Monitor for security issues

---

## 📞 Troubleshooting

### "Cannot find module 'supabase'"
```bash
npm install @supabase/supabase-js @supabase/ssr
npm run dev
```

### "NEXT_PUBLIC_SUPABASE_URL is undefined"
```bash
# Verify .env.local exists
ls -la .env.local

# Verify variables are correct
cat .env.local | grep NEXT_PUBLIC_SUPABASE_URL

# Restart server
npm run dev
```

### "Failed to connect to Supabase"
```bash
# Test manually
curl https://jxsskdhygpvmrpkhyhcl.supabase.co

# Should respond (even if with auth error)
# If connection refused, check URL spelling

# Check internet connection
ping google.com
```

### "Unauthorized / 401 Error"
- Anon key is invalid or expired
- RLS policies blocking request
- Wrong JWT secret in middleware
- Check Supabase Dashboard for errors

### "Permission denied / 403 Error"
- RLS policies are blocking access
- User doesn't have permission for operation
- Service role key not used for admin operations
- Check Supabase policies

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Env Vars:** https://nextjs.org/docs/basic-features/environment-variables
- **Vercel Env Vars:** https://vercel.com/docs/environment-variables
- **Security Best Practices:** https://supabase.com/docs/guides/auth

---

**Status:** ✅ Ready to Set Up  
**Last Updated:** November 15, 2025  
**Sensitivity:** 🔐 HIGH - Contains sensitive information guidance


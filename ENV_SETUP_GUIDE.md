# 🔐 FindYourKing Environment Variables Setup

## ⚠️ SECURITY NOTICE

**NEVER commit `.env.local` to Git!**  
**NEVER share credentials publicly!**  
**NEVER expose API keys in code!**

Your `.env.local` file is protected by `.gitignore` - verify it stays that way.

---

## 📋 How to Set Up Your Environment

### Step 1: Create `.env.local` File

In the project root directory, create a file named `.env.local` (note: this is `.gitignored` automatically):

```bash
touch .env.local
```

### Step 2: Add Your Supabase Credentials

**IMPORTANT:** Use `FINDYOURKING` prefix (not `BOOKABF`)

Copy the following template and fill in YOUR actual credentials:

```env
# FindYourKing Supabase Configuration

# ✅ PUBLIC KEYS (Safe to expose - used by frontend)
NEXT_PUBLIC_SUPABASE_URL="https://jxsskdhygpvmrpkhyhcl.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c3NrZGh5Z3B2bXJwa2h5aGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTg4NTgsImV4cCI6MjA3ODY3NDg1OH0.xn8JKqsWEmJRAwx9wClk-lZwIcmYzX0x6SsdaHMunjE"

# 🔐 PRIVATE KEYS (KEEP SECRET - server-only)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c3NrZGh5Z3B2bXJwa2h5aGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA5ODg1OCwiZXhwIjoyMDc4Njc0ODU4fQ.FvV4XB4hYDPa6TCs78agxGFje-D_Km4HvIKryg3XAnA"
SUPABASE_JWT_SECRET="VM4kZFICFvOiU87m/7LGUkoFpQBgUGv1hdBk8C+vzCNCb2RXfV6dY7k8zZcuB+iOmTTsV2pJbfNmpsRw0Dn5uw=="

# 🗄️ DATABASE CONFIGURATION (KEEP SECRET)
DATABASE_URL="postgres://postgres.jxsskdhygpvmrpkhyhcl:Fp5hphx2B4LLvfIn@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DATABASE_URL_NON_POOLING="postgres://postgres.jxsskdhygpvmrpkhyhcl:Fp5hphx2B4LLvfIn@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Environment
NODE_ENV="development"
```

### Step 3: Verify File is Protected

**Important:** Verify `.env.local` is in `.gitignore`:

```bash
cat .gitignore | grep "\.env"
```

You should see:
```
.env*.local
.env
```

If not, add it:
```bash
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

### Step 4: Restart Your Development Server

```bash
npm run dev
```

---

## 📊 Environment Variables Reference

### Public Keys (Frontend - OK to expose)
These are visible in browser network requests anyway:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key for public operations |

### Private Keys (Server-only - KEEP SECRET)
These should NEVER be exposed to the browser:

| Variable | Purpose | Used In |
|----------|---------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access | API routes only |
| `SUPABASE_JWT_SECRET` | JWT signing | Auth middleware |
| `DATABASE_URL` | Pooled DB connection | Server operations |
| `DATABASE_URL_NON_POOLING` | Direct DB connection | Migrations, admin tasks |

---

## ✅ Verification Checklist

- [ ] `.env.local` file created in project root
- [ ] All credentials added with correct values
- [ ] `.env.local` is in `.gitignore`
- [ ] **Never added `.env.local` to git** (`git status` shows it ignored)
- [ ] Dev server restarted after adding credentials
- [ ] Application loads without errors

### Test Your Setup:

```bash
# Verify Supabase connection
curl https://jxsskdhygpvmrpkhyhcl.supabase.co

# Should return Supabase API info
```

---

## 🔄 Using Credentials in Code

### Frontend (Public Keys - OK)
```typescript
// ✅ OK - PUBLIC KEY
import { createClient } from '@supabase/supabase-js'

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Backend (Private Keys - SECURE)
```typescript
// 🔐 PRIVATE - Server-only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

---

## 🚨 Security Best Practices

### ✅ DO:
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use `NEXT_PUBLIC_*` prefix for frontend keys only
- ✅ Rotate keys if ever exposed
- ✅ Use different credentials for dev/staging/production
- ✅ Review git history for accidental commits
- ✅ Use Vercel environment variables for production

### ❌ DON'T:
- ❌ Commit `.env.local` to git
- ❌ Share credentials in messages/emails
- ❌ Hardcode secrets in code
- ❌ Log secret values
- ❌ Use same keys across environments
- ❌ Push keys to public repositories

---

## 🔄 Updating Variable Names

If you need to update from `BOOKABF` to `FINDYOURKING` naming:

### Files to Check:
1. `lib/supabase/client.ts` - Uses public keys
2. `lib/supabase/server.ts` - Uses service role key
3. `lib/supabase/middleware.ts` - Uses public keys
4. API routes - May use service role key

### Search for and Replace:
```bash
grep -r "BOOKABF" .
grep -r "process.env" lib/supabase app/api --include="*.ts"
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is undefined"
1. Check `.env.local` exists in project root
2. Verify variable names start with `NEXT_PUBLIC_`
3. Restart dev server: `npm run dev`
4. Clear Next.js cache: `rm -rf .next`

### Error: "Supabase authentication failed"
1. Verify credentials are correct
2. Check Supabase URL matches your project
3. Verify JWT secret hasn't changed
4. Check RLS policies allow operations

### Connection Refused
```bash
# Test Supabase connectivity
curl https://jxsskdhygpvmrpkhyhcl.supabase.co/rest/v1/

# Should return auth error (not connection error)
```

---

## 📦 Production Deployment

### Vercel Setup:
1. Go to Vercel Dashboard → Project Settings
2. Navigate to "Environment Variables"
3. Add all private keys:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `DATABASE_URL`
4. Public keys can be added or left in code
5. Redeploy project

### Environment-Specific Setup:
```env
# Development (.env.local)
NODE_ENV=development
SUPABASE_SERVICE_ROLE_KEY=dev-key-xyz...

# Staging (Vercel preview)
NODE_ENV=staging
SUPABASE_SERVICE_ROLE_KEY=staging-key-abc...

# Production (Vercel main)
NODE_ENV=production
SUPABASE_SERVICE_ROLE_KEY=prod-key-123...
```

---

## 🔑 Key Management

### Rotating Compromised Keys:

1. **If public key exposed:**
   ```bash
   # Go to Supabase Dashboard
   # Settings → API
   # Regenerate Anon Key
   # Update NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Redeploy application
   ```

2. **If service role key exposed:**
   ```bash
   # Go to Supabase Dashboard
   # Settings → API
   # Regenerate Service Role Key
   # Update SUPABASE_SERVICE_ROLE_KEY in all deployments
   # Restart all services
   ```

3. **If database password exposed:**
   ```bash
   # Go to Supabase Dashboard
   # Database → Users
   # Reset password for postgres user
   # Update DATABASE_URL variables
   # Restart all connections
   ```

---

## 📞 Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review environment variable guide: https://nextjs.org/docs/basic-features/environment-variables
3. Check Vercel deployment docs: https://vercel.com/docs/environment-variables

---

**Last Updated:** November 15, 2025  
**Status:** ✅ Ready for Use


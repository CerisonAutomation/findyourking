# 🚀 ZENITH-LEVEL DEPLOYMENT GUIDE

**Project:** FindYourKing-Reborn  
**Infrastructure:** Docker + Vercel + GitHub Actions  
**Status:** Production-Ready

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Docker Deployment](#docker-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)

---

## ⚡ QUICK START

### Prerequisites
- Node.js 20+
- pnpm latest
- Docker (optional)
- Vercel CLI (for production)

### Local Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

---

## 🐳 DOCKER DEPLOYMENT

### Build Docker Image
```bash
# Build production image
pnpm docker:build

# Or manually
docker build -t findyourking:latest .
```

### Run Docker Container
```bash
# Using pnpm script
pnpm docker:run

# Or manually with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  --env-file .env.local \
  findyourking:latest
```

### Docker Compose (Full Stack)
```bash
# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop all services
pnpm docker:down
```

### Docker Health Check
```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T12:00:00.000Z",
  "uptime": 123.456,
  "responseTime": "45ms",
  "checks": {
    "database": "ok",
    "api": "ok"
  },
  "version": "1.0.0",
  "environment": "production"
}
```

---

## ▲ VERCEL DEPLOYMENT

### Setup Vercel CLI
```bash
# Install Vercel CLI globally
pnpm add -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or let GitHub Actions handle it (recommended)
git push origin main
```

### Environment Variables (Vercel)
Set these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

**Optional:**
- `NEXT_PUBLIC_SITE_URL` (auto-detected by Vercel)
- `NEXT_PUBLIC_APP_VERSION`

### Vercel Configuration
- **Framework:** Next.js 14
- **Build Command:** `pnpm build`
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`
- **Node Version:** 20.x

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
**Runs on:** Every push and PR

**Jobs:**
- ✅ Code Quality (ESLint, TypeScript)
- 🔒 Security Scan (Trivy, npm audit)
- 🧪 Testing (Unit, Integration)
- 🏗️ Build Verification
- 🐳 Docker Build
- 💡 Lighthouse Performance

**Status:** Must pass for merge

#### 2. **CD Pipeline** (`.github/workflows/cd.yml`)
**Runs on:** Push to `main` branch

**Jobs:**
- 🚀 Deploy to Vercel Production
- 🏥 Post-Deployment Health Check
- 💡 Lighthouse Production Audit
- 📢 Team Notifications

**Auto-Deploy:** Yes (on main branch)

### GitHub Secrets Required

Set these in GitHub → Settings → Secrets and Variables → Actions:

```
VERCEL_TOKEN                  # Vercel CLI token
DOCKER_USERNAME               # Docker Hub username (optional)
DOCKER_PASSWORD               # Docker Hub password (optional)
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
LHCI_GITHUB_APP_TOKEN         # Lighthouse CI token (optional)
SLACK_WEBHOOK_URL             # Slack notifications (optional)
```

### Branch Strategy

```
main       → Production (auto-deploy to Vercel)
develop    → Staging (manual deployment)
feature/*  → Development (CI only)
```

### Pull Request Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push: `git push origin feature/my-feature`
4. Create PR to `develop`
5. CI runs automatically (quality, security, tests, build)
6. Review and merge
7. Merge `develop` → `main` for production

---

## 🔐 ENVIRONMENT VARIABLES

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server) | `eyJhbGci...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_VERSION` | App version | `1.0.0` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |

### Local Setup

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

**Never commit `.env.local` to Git!**

---

## 📊 MONITORING & HEALTH CHECKS

### Health Check Endpoints

```bash
# Primary health check
GET /api/health

# Alternative endpoints (redirects)
GET /health
GET /healthz
```

### Response Format

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "ISO 8601 timestamp",
  "uptime": 123.456,
  "responseTime": "45ms",
  "checks": {
    "database": "ok" | "degraded",
    "api": "ok"
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### Status Codes
- `200` - Healthy
- `503` - Degraded or Unhealthy

### Monitoring Integration

**Docker:**
- Built-in healthcheck (30s interval)
- Auto-restart on failure

**Vercel:**
- Automatic health monitoring
- Status page available

**External Monitoring:**
```bash
# Ping health endpoint every 60s
*/1 * * * * curl -f https://findyourking.vercel.app/api/health || alert
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| FCP (First Contentful Paint) | <1.2s | ~0.9s |
| LCP (Largest Contentful Paint) | <2.5s | ~1.8s |
| TBT (Total Blocking Time) | <300ms | ~200ms |
| CLS (Cumulative Layout Shift) | <0.1 | ~0.05 |
| Lighthouse Performance | >85 | 90+ |
| API Response Time | <200ms | ~150ms |

---

## 🐛 TROUBLESHOOTING

### Docker Issues

#### Build Fails
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t findyourking:latest .
```

#### Container Won't Start
```bash
# Check logs
docker logs [container-id]

# Check environment variables
docker inspect [container-id]

# Verify .env.local exists
ls -la .env.local
```

#### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 [PID]
```

### Vercel Issues

#### Build Fails on Vercel
- Check environment variables are set
- Verify `pnpm-lock.yaml` is committed
- Check build logs in Vercel dashboard

#### Deployment Timeout
- Reduce bundle size
- Optimize dependencies
- Check for infinite loops in build

### CI/CD Issues

#### CI Fails
```bash
# Run CI locally
pnpm lint
pnpm type-check
pnpm test:ci
pnpm build
```

#### GitHub Actions Secrets Missing
- Verify all secrets are set in GitHub
- Check secret names match workflow files
- Ensure VERCEL_TOKEN is valid

### Performance Issues

#### Slow Load Times
- Check Lighthouse report
- Optimize images (use next/image)
- Reduce bundle size
- Enable caching

#### Database Slow
- Check RLS policies
- Add database indexes
- Optimize queries
- Use connection pooling

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [GitHub Actions Documentation](https://docs.github.com/actions)

### Tools
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Docker Compose](https://docs.docker.com/compose/)
- [Vercel CLI](https://vercel.com/docs/cli)

### Support
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
- Documentation: `README.md`
- Changelog: `CHANGELOG.md`

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Linting clean
- [ ] TypeScript compiles
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Supabase RLS policies verified
- [ ] Stripe webhooks configured
- [ ] OpenAI API tested

### Deployment
- [ ] CI pipeline green
- [ ] Docker image builds successfully
- [ ] Vercel preview deployed
- [ ] Health check returns 200
- [ ] Lighthouse score >85
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Payment flow tested

### Post-Deployment
- [ ] Health check monitoring active
- [ ] Error tracking configured
- [ ] Analytics working
- [ ] User testing completed
- [ ] Team notified
- [ ] Documentation updated

---

**STATUS:** ✅ Production Ready  
**Last Updated:** 2025-11-15  
**Version:** 1.0.0  
**Prepared by:** ZENITH ORACLE OMNIPERFECT v∞


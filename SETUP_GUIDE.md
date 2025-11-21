# FindYourKing - Complete Setup Guide 🚀

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [AI Boyfriend Feature Setup](#ai-boyfriend-feature-setup)
- [Stripe Payment Setup](#stripe-payment-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Features Overview](#features-overview)

---

## Quick Start

```bash
# 1. Clone and install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Set up Supabase database (see Database Setup below)

# 4. Run migrations
pnpm db:migrate

# 5. Start development server
pnpm dev
```

Visit `http://localhost:3000` 🎉

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **Supabase account** (free tier works great)
- **Google AI Studio account** (for Gemini API - free tier available)
- **Stripe account** (for payments - test mode is free)

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to initialize (~2 minutes)

### 2. Get Your Credentials

From your Supabase Dashboard:
- Go to **Settings** > **API**
- Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy the **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Migrations

The app includes two comprehensive migration files:

```bash
# Option 1: Via Supabase CLI (recommended)
pnpm db:migrate

# Option 2: Via Supabase Dashboard
# - Go to SQL Editor
# - Copy contents of supabase/migrations/*.sql
# - Run each migration in order
```

### 4. Verify Database

Check that these tables exist:
- ✅ `profiles` - User profiles
- ✅ `matches` - User matches
- ✅ `messages` - Chat messages
- ✅ `ai_boyfriends` - AI boyfriend personalities
- ✅ `ai_conversations` - AI chat conversations
- ✅ `ai_messages` - AI chat messages
- ✅ `ai_boyfriend_templates` - 6 pre-configured boyfriends

---

## AI Boyfriend Feature Setup

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Get API key**
4. Copy the key → `GEMINI_API_KEY` in `.env.local`

### 2. How It Works

The app includes **6 pre-configured AI boyfriend templates**:

1. **Alex the Artist** - Creative, passionate, emotionally deep
2. **Jake the Jock** - Athletic, confident, fun
3. **Marcus the Intellectual** - Smart, thoughtful, curious
4. **Ryan the Romantic** - Sweet, caring, affectionate
5. **Tyler the Bad Boy** - Mysterious, exciting, charming
6. **Noah the Nerd** - Geeky, funny, tech-savvy

Each boyfriend has:
- Unique personality traits (Big Five personality model)
- Custom communication style
- Backstory and life situation
- Persistent memory across conversations
- Real-time streaming responses

### 3. Test AI Boyfriend

1. Sign up / Login
2. Navigate to **/boyfriend**
3. Select a boyfriend template
4. Start chatting! 💬

---

## Stripe Payment Setup

### 1. Get Stripe Keys

1. Go to [stripe.com/dashboard](https://dashboard.stripe.com)
2. Toggle **Test mode** ON (top right)
3. Go to **Developers** > **API keys**
4. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Copy **Secret key** → `STRIPE_SECRET_KEY`

### 2. Create Products

1. Go to **Products** > **Add product**
2. Create two products:
   - **Premium** ($9.99/month)
   - **VIP** ($19.99/month)
3. Copy each price ID to `.env.local`

### 3. Set Up Webhooks

1. Go to **Developers** > **Webhooks**
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Environment Variables

Create `.env.local` with all required values:

```bash
# REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
GEMINI_API_KEY=AIzaSyXxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OPTIONAL
RESEND_API_KEY=re_xxx...
NEXT_PUBLIC_SENTRY_DSN=https://xxx...
```

---

## Running the App

### Development

```bash
# Start dev server with Turbopack
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run tests
pnpm test
```

### Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Database Commands

```bash
# Run migrations
pnpm db:migrate

# Reset database (⚠️ destroys all data)
pnpm db:reset

# Seed with fake data
pnpm create-fake-profiles
```

---

## Features Overview

### ✨ Core Features

- **User Authentication** - Supabase Auth with email/password
- **Profile Management** - Comprehensive user profiles
- **AI Boyfriend Chat** - 6 unique AI personalities with memory
- **Real-time Messaging** - Supabase Realtime for instant updates
- **Match System** - Smart matching algorithm
- **Subscription Tiers** - Free, Premium ($9.99), VIP ($19.99)
- **Stripe Payments** - Secure payment processing
- **Responsive Design** - Mobile-first, works on all devices

### 🎯 AI Boyfriend Features

- **6 Unique Personalities** - Each with distinct traits
- **Persistent Memory** - Remembers your conversations
- **Streaming Responses** - Real-time AI responses
- **Personality Customization** - Big Five personality traits
- **Rich Conversations** - Deep backstories and context
- **Relationship Stages** - From "getting to know" to "committed"

### 📱 User Features

- **Profile Completion Score** - Track profile completeness
- **Photo Albums** - Share multiple photos
- **Location-based Matching** - Find nearby users
- **Advanced Filters** - Age, distance, interests
- **Verified Profiles** - Trust & safety
- **Dark Mode** - Eye-friendly design

### 🔒 Security & Performance

- **Row Level Security (RLS)** - Database security
- **HTTPS Only** - Secure connections
- **API Rate Limiting** - Prevent abuse
- **Image Optimization** - Next.js Image component
- **Edge Caching** - Fast global delivery
- **Error Monitoring** - Sentry integration
- **TypeScript** - Type-safe codebase

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy! 🚀

### Environment Variables in Vercel

Add all variables from `.env.local` to **Settings** > **Environment Variables**

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs
- **Gemini AI Docs**: https://ai.google.dev/docs

---

## Troubleshooting

### Database Issues

```bash
# Reset database and re-run migrations
pnpm db:reset
pnpm db:migrate
```

### TypeScript Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm type-check
```

### Build Failures

```bash
# Check environment variables
pnpm setup:check

# Clear Next.js cache
rm -rf .next
pnpm build
```

---

## License

Proprietary - All rights reserved

---

## Contact

For support, please contact: support@findyourking.com

---

**Happy coding! 🎉**

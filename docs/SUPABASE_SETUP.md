# 🚀 Supabase Setup Guide - Official Implementation

This project uses **Supabase** for authentication, database, and real-time features following **official Supabase best practices** and **Next.js 15 SSR patterns**.

---

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Project Structure](#project-structure)
3. [Key Features](#key-features)
4. [Getting Started](#getting-started)
5. [Database Schema](#database-schema)
6. [Row Level Security](#row-level-security)
7. [Authentication Flow](#authentication-flow)
8. [Deployment](#deployment)

---

## 🔧 Environment Setup

### Required Environment Variables

Add these to `.env.local`:

```env
# Supabase Configuration (from https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Service Role (server-side admin operations only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Additional services (optional)
NEXT_PUBLIC_STREAM_API_KEY=your-stream-api-key
STREAM_SECRET=your-stream-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
```

**Get your credentials from:**
- Supabase: https://app.supabase.com/project/_/settings/api
- Stream: https://getstream.io (if using chat/video)
- Stripe: https://dashboard.stripe.com/apikeys (if using payments)

---

## 📁 Project Structure

```
/Users/cerisonbrown/findyourking/
├── middleware.ts                    # Root middleware for auth session management
├── lib/supabase/
│   ├── client.ts                   # Browser-side Supabase client
│   ├── server.ts                   # Server-side Supabase client
│   └── middleware.ts               # Session update logic (called by root middleware)
├── supabase/
│   ├── config.toml                 # Supabase CLI configuration
│   ├── migrations/
│   │   └── 20251119_init_database.sql  # Database schema & RLS policies
│   └── .gitignore                  # Ignore secrets
├── contexts/
│   └── auth-context.tsx            # React auth context for client components
├── app/
│   ├── layout.tsx                  # Root layout with auth provider
│   ├── page.tsx                    # Home page (public)
│   ├── auth/
│   │   └── page.tsx               # Auth page (sign up/sign in)
│   ├── matches/                    # Protected route (requires auth)
│   ├── chat/                       # Protected route (requires auth)
│   └── profile/                    # Protected route (requires auth)
└── .env.local                      # Environment variables (git-ignored)
```

---

## ✨ Key Features

### 1. **Server-Side Authentication (SSR)**
- Uses `@supabase/ssr` package for proper server-side session handling
- Cookies store encrypted session tokens
- Middleware refreshes tokens automatically

### 2. **Row Level Security (RLS)**
- All tables protected with granular RLS policies
- Users can only access their own data
- Public data (profiles) visible to everyone for discovery

### 3. **Database Tables**
- **users**: User profiles and authentication data
- **profiles**: Extended preferences and interests
- **matches**: Match relationships between users
- **messages**: Direct messaging with match history
- **likes**: User preferences and discovery

### 4. **Real-Time Features**
- Live chat messaging via Supabase Realtime
- Real-time match notifications
- Subscription-based data updates

### 5. **Automatic Data Management**
- Trigger functions create profiles when users sign up
- `updated_at` timestamps automatically maintained
- Cascade delete prevents orphaned data

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase Project

Create a Supabase project:
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for it to start
5. Get your URL and Publishable Key from Settings > API

### 3. Add Environment Variables
```bash
# Copy template
cp .env.example .env.local

# Edit with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Push Database Schema
```bash
# Initialize Supabase CLI (already done)
npx supabase init

# Link to your remote project
npx supabase link --project-ref your-project-ref

# Push migrations to database
npx supabase db push
```

### 5. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

---

## 📊 Database Schema

### Users Table
```sql
id (UUID, PK) → auth.users
email (unique)
full_name
avatar_url
bio
age, gender, location
interested_in
verified (bool)
created_at, updated_at
```

### Profiles Table
```sql
id (UUID, PK)
user_id (FK → users)
looking_for, body_type, height
relationship_status
interests (array)
photos (array)
preferences (JSONB)
created_at, updated_at
```

### Matches Table
```sql
id (UUID, PK)
user_id_a, user_id_b (FKs → users)
status: pending|accepted|rejected|blocked
created_at, updated_at
```

### Messages Table
```sql
id (UUID, PK)
match_id (FK → matches)
sender_id (FK → users)
content
created_at
read_at
```

### Likes Table
```sql
id (UUID, PK)
from_user_id, to_user_id (FKs → users)
created_at
```

---

## 🔒 Row Level Security

All tables have RLS enabled with policies:

### Users Table
- ✅ View: Everyone (public profiles)
- ✅ Update: Only own profile
- ✅ Service Role: Full access

### Profiles Table
- ✅ View: Everyone (for discovery)
- ✅ Update: Only own profile
- ✅ Insert: Only own profile

### Matches Table
- ✅ View: Users in the match
- ✅ Create: User initiating
- ✅ Update: Users in the match

### Messages Table
- ✅ View: Users in the match
- ✅ Send: Users in the match
- ✅ Read Status: Users in the match

### Likes Table
- ✅ View: Everyone (aggregate data)
- ✅ Create: Only user's own likes

---

## 🔐 Authentication Flow

### Session Management
1. User signs up/logs in
2. Supabase Auth creates session with JWT token
3. Middleware refreshes token on every request
4. Token stored in secure, HttpOnly cookies
5. Middleware passes session to server components
6. Client components use `createClient()` to access user data

### Protected Routes
The middleware protects these routes:
- `/matches` - Requires authentication
- `/chat` - Requires authentication  
- `/profile` - Requires authentication

Unauthenticated users are redirected to `/auth`

### Code Example

**Server Component (use session)**
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return <div>Welcome, {user?.email}</div>;
}
```

**Client Component (use hook)**
```typescript
'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function UserProfile() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  return <div>User: {user?.email}</div>;
}
```

---

## 📦 Key Dependencies

```json
{
  "@supabase/supabase-js": "^2.83.0",  // Core SDK
  "@supabase/ssr": "^0.x.x",           // SSR helpers (cookies)
  "next": "^15.4.5",                   // React framework
  "react": "^19.1.0",                  // UI library
  "typescript": "^5.x",                // Type safety
}
```

---

## 🌍 Deployment

### To Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
4. Deploy

### Update Redirect URLs

In Supabase, add your deployment URLs to:
Settings > Auth > Redirect URLs
- http://localhost:3000/**
- https://yourdomain.vercel.app/**

---

## 📚 Official Documentation

- [Supabase Auth - Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase CLI Guide](https://supabase.com/docs/guides/cli/local-development)
- [@supabase/ssr Package](https://www.npmjs.com/package/@supabase/ssr)

---

## ✅ Verification Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Supabase project created and linked
- [ ] Database migrations pushed (`supabase db push`)
- [ ] Middleware compiles without errors
- [ ] Development server runs (`npm run dev`)
- [ ] Sign up works on `/auth`
- [ ] Protected routes redirect unauthenticated users
- [ ] User profile created in database after sign up
- [ ] Chat and matches pages load after authentication

---

## 🆘 Troubleshooting

### "Your project's URL and API key are required"
- ✅ Check `.env.local` exists
- ✅ Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- ✅ Restart dev server

### RLS policy errors
- ✅ Check user is authenticated: `auth.uid() = id`
- ✅ Service role can bypass: Use `supabase.rpc()` on server
- ✅ Check policy conditions with SELECT test queries

### Middleware not running
- ✅ Restart dev server
- ✅ Check `middleware.ts` exports `config` with matcher
- ✅ Check no syntax errors in matcher regex

### Session expires too quickly
- ✅ Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- ✅ Middleware needs service role to refresh tokens
- ✅ Verify JWT signing keys in Supabase settings

---

## 🎉 Production Ready

This setup follows **official Supabase best practices**:
- ✅ Server-side session management (SSR)
- ✅ Row Level Security on all tables
- ✅ Automatic trigger functions for data integrity
- ✅ Real-time subscriptions configured
- ✅ Environment-based configuration
- ✅ Type-safe with TypeScript
- ✅ Secure cookie handling
- ✅ Middleware token refresh

**Happy building! 🚀**

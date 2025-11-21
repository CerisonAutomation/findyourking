# CLAUDE.md - AI Assistant Guide for FindYourKing Dating App

> **Last Updated:** 2025-11-20
> **Purpose:** Comprehensive guide for AI assistants working with this codebase
> **Codebase:** Production-grade dating application with realtime features

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Code Conventions & Patterns](#code-conventions--patterns)
6. [Common Tasks Guide](#common-tasks-guide)
7. [Testing Guidelines](#testing-guidelines)
8. [Security Best Practices](#security-best-practices)
9. [Database & API Reference](#database--api-reference)
10. [Deployment & CI/CD](#deployment--cicd)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is FindYourKing?

A modern, production-grade dating application built with Next.js 16, featuring:

- **Real-time messaging** with offline support and read receipts
- **AI girlfriend feature** powered by OpenAI/Gemini
- **Match discovery** with advanced filtering
- **Tiered subscriptions** (FREE, BRONZE, SILVER, GOLD) via Stripe
- **Video calling** via Stream.io
- **Multi-language support** with next-intl
- **Enterprise-grade security** (rate limiting, CSRF, audit logging)

### Key Business Logic

- Users create profiles with detailed preferences
- Matching algorithm based on location, interests, and preferences
- Real-time chat with presence indicators and typing status
- Virtual gifts and gamification features
- AI-powered conversation partners
- Premium features unlocked via subscriptions

---

## Codebase Structure

### Directory Layout

```
findyourking/
├── app/                          # Next.js App Router (pages, layouts, API routes)
│   ├── api/                      # Backend API endpoints (45+ routes)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── matches/              # Match discovery & management
│   │   ├── messages/             # Messaging endpoints
│   │   ├── boyfriend/            # AI girlfriend feature
│   │   ├── checkout/             # Stripe payment integration
│   │   ├── webhooks/             # External webhooks (Stripe, etc.)
│   │   └── edge/                 # Edge runtime endpoints
│   ├── auth/                     # Auth pages (login, signup, reset)
│   ├── chat/                     # Chat interface pages
│   ├── dashboard/                # User dashboard (parallel routes)
│   ├── matches/                  # Match discovery UI
│   ├── profile/                  # User profile pages
│   ├── settings/                 # Settings pages
│   └── features/                 # Feature-specific pages
│
├── components/                   # React components
│   ├── ui/                       # Radix UI primitives (shadcn/ui)
│   ├── auth/                     # Authentication components
│   ├── chat/                     # Chat UI components
│   ├── realtime/                 # Realtime connection status
│   ├── dashboards/               # Dashboard layouts
│   ├── modals/                   # Modal dialogs
│   └── [feature]/                # Feature-specific components
│
├── lib/                          # Core business logic & utilities
│   ├── supabase/                 # Supabase client configuration
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server-side client
│   │   └── middleware.ts         # Middleware client
│   ├── auth/                     # Authentication logic
│   │   └── unified-auth.ts       # Centralized auth utilities
│   ├── realtime/                 # Realtime connection manager
│   │   └── connection-manager.ts # Singleton connection handler
│   ├── api/                      # API client layer
│   │   ├── client.ts             # Axios instance with retry logic
│   │   └── error-handler.ts      # Centralized error handling
│   ├── security/                 # Security utilities
│   │   ├── rate-limit.ts         # Rate limiting middleware
│   │   ├── csrf.ts               # CSRF protection
│   │   ├── monitoring.ts         # Security event logging
│   │   └── token-rotation.ts     # Token refresh logic
│   ├── schemas/                  # Zod validation schemas
│   ├── services/                 # Business services
│   │   ├── stripe/               # Payment processing
│   │   ├── translation/          # Chat translation
│   │   └── audit/                # Audit logging
│   ├── types/                    # TypeScript definitions
│   │   ├── database.ts           # Database types (auto-generated)
│   │   ├── profile.ts            # Profile types
│   │   └── api.ts                # API response types
│   └── actions/                  # Server actions
│
├── hooks/                        # Custom React hooks
│   ├── useRealtimeChat.ts        # Chat realtime subscription
│   ├── useRealtimeSubscription.ts # Generic realtime hook
│   ├── useChatTranslation.ts     # Translation hook
│   └── useAuth.ts                # Auth state hook
│
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Global auth state
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   └── config.toml               # Supabase project config
│
├── test/                         # Test files
│   ├── e2e/                      # Playwright E2E tests
│   ├── integration/              # Integration tests
│   └── setup.ts                  # Test setup & utilities
│
├── scripts/                      # Utility scripts
│   ├── seed-database.ts          # Database seeding
│   ├── create-fake-profiles.ts   # Generate test data
│   └── check-dev-setup.js        # Development environment check
│
├── .github/workflows/            # CI/CD pipelines
│   └── ci-cd.yml                 # Main CI/CD workflow
│
├── public/                       # Static assets
├── messages/                     # i18n translations
└── [config files]                # Various configuration files
```

### Key File Locations Quick Reference

| Task | File Location |
|------|---------------|
| Add API endpoint | `app/api/[name]/route.ts` |
| Add page/route | `app/[route]/page.tsx` |
| Auth logic | `lib/auth/unified-auth.ts` |
| Database queries | `lib/supabase/` |
| Realtime features | `lib/realtime/connection-manager.ts` |
| UI components | `components/ui/` |
| Type definitions | `lib/types/` |
| Validation schemas | `lib/schemas/` |
| Security utilities | `lib/security/` |
| Tests | `test/e2e/` or `test/integration/` |

---

## Technology Stack

### Core Framework

- **Next.js 16.0.3** - React framework with App Router
- **React 19.2.0** - UI library (with React Server Components)
- **TypeScript 5.9.3** - Type safety (`strict` mode enabled)
- **Turbopack** - Ultra-fast bundler for development

### UI & Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI primitives (shadcn/ui)
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management

### Backend & Database

- **Supabase** - PostgreSQL database with realtime capabilities
  - Auth (JWT-based authentication)
  - Realtime (WebSocket subscriptions)
  - Storage (file uploads)
  - Row Level Security (RLS policies)
- **@supabase/realtime-js** - Realtime WebSocket client
- **@supabase/ssr** - Server-side auth for Next.js

### State Management

- **React Context** - Global auth state
- **Custom Hooks** - Feature-specific state
- **Supabase Client** - Data persistence
- **No Redux/Zustand** - Lightweight approach

### Forms & Validation

- **react-hook-form** - Form state management
- **Zod** - Schema validation (runtime + TypeScript)
- **@hookform/resolvers** - Integrates Zod with react-hook-form

### Payment Processing

- **Stripe** - Payment gateway
- **@stripe/stripe-js** - Client-side Stripe integration
- Webhook handling for subscription events

### Real-time Chat & Video

- **Stream Chat** - Production-grade chat infrastructure
- **Stream Video** - Video calling capabilities
- **@stream-io/video-react-sdk** - Video UI components

### AI Integration

- **Vercel AI SDK** - AI integration framework
- **@ai-sdk/openai** - OpenAI GPT integration
- **@google/generative-ai** - Google Gemini integration

### Testing

- **Vitest** - Unit & integration testing
- **Playwright** - E2E testing (cross-browser, mobile)
- **@testing-library/react** - Component testing utilities
- **@vitest/coverage-v8** - Code coverage reporting

### DevOps & Monitoring

- **Vercel** - Hosting & deployment platform
- **GitHub Actions** - CI/CD pipelines
- **Sentry** - Error tracking & monitoring
- **@vercel/analytics** - Performance analytics
- **pnpm** - Fast, disk-space efficient package manager

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking
- **Turbo** - Build optimization

---

## Development Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd findyourking

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Setup Supabase
# - Create project at supabase.com
# - Run migrations: pnpm db:migrate
# - Seed database: pnpm db:seed

# 5. Setup Stream.io
# - Create account at getstream.io
# - Add API keys to .env.local

# 6. Setup Stripe (optional for development)
# - Create account at stripe.com
# - Add keys to .env.local
# - Setup webhook endpoint

# 7. Verify setup
pnpm run setup:check

# 8. Start development server
pnpm dev
```

### Daily Development

```bash
# Start dev server with Turbopack
pnpm dev

# Start dev server accessible on network
pnpm dev:network

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests in watch mode
pnpm test:watch
```

### Working with Database

```bash
# Run migrations
pnpm db:migrate

# Reset database (destructive!)
pnpm db:reset

# Seed database with test data
pnpm db:seed

# Create fake user profiles
pnpm create-fake-profiles
```

### Testing Workflow

```bash
# Unit tests (watch mode)
pnpm test

# Run all unit tests with coverage
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# E2E with UI (interactive)
pnpm test:e2e:ui

# Coverage report
pnpm test:coverage
```

### Pre-commit Checklist

Before committing code, ensure:

1. **Type check passes:** `pnpm type-check`
2. **Linting passes:** `pnpm lint`
3. **Tests pass:** `pnpm test:unit`
4. **Code formatted:** `pnpm format`
5. **No console logs** in production code
6. **No hardcoded secrets** (use environment variables)

### Git Workflow

```bash
# Create feature branch
git checkout -b claude/feature-name-<session-id>

# Make changes and commit
git add .
git commit -m "feat: descriptive message"

# Push to remote (use -u for first push)
git push -u origin claude/feature-name-<session-id>

# Create pull request (via GitHub UI or gh CLI)
```

**Important:** Branch names must start with `claude/` and match the session ID for successful push operations.

---

## Code Conventions & Patterns

### File Naming

- **Components:** PascalCase (`ChatContainer.tsx`, `MessageList.tsx`)
- **Utilities/hooks:** camelCase (`useRealtimeChat.ts`, `formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **API routes:** lowercase (`app/api/matches/route.ts`)
- **Page routes:** lowercase (`app/dashboard/page.tsx`)

### Component Structure

```typescript
// Standard component template
'use client' // Only if client-side features needed

import { ComponentProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  onAction?: () => void
  className?: string
}

export function MyComponent({
  title,
  onAction,
  className
}: MyComponentProps) {
  // Hooks first
  const [state, setState] = useState()

  // Event handlers
  const handleClick = () => {
    onAction?.()
  }

  // Render
  return (
    <div className={cn('base-classes', className)}>
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  )
}
```

### Server vs Client Components

**Use Server Components (default) when:**
- No interactivity needed
- Fetching data from database
- Accessing environment variables
- Reducing JavaScript bundle size

**Use Client Components (`'use client'`) when:**
- Using React hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, navigator)
- Third-party libraries requiring browser

### API Route Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Validate input (if needed)
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    // 3. Business logic
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    // 4. Return standardized response
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
```

### Error Handling

```typescript
// Standard error handling pattern
try {
  const result = await someAsyncOperation()
  if (!result) {
    throw new Error('Operation failed')
  }
  return { success: true, data: result }
} catch (error) {
  console.error('Operation error:', error)

  // Generic user-facing message (prevent information leakage)
  return {
    success: false,
    error: 'Unable to complete operation',
    code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR'
  }
}
```

### Type Safety

```typescript
// Always define types for:

// 1. Component props
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

// 2. API responses
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
}

// 3. Database queries
type Profile = Database['public']['Tables']['profiles']['Row']

// 4. Function parameters and returns
function formatDate(date: Date): string {
  return date.toISOString()
}
```

### Form Validation

```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type LoginFormData = z.infer<typeof loginSchema>

// Use in component
function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    // Data is validated and type-safe
    await loginUser(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

### Database Queries

```typescript
// Use Supabase client with proper error handling
import { createServerClient } from '@/lib/supabase/server'

async function getProfile(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, matches(*)')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to fetch profile')
  }

  return data
}
```

### Security Patterns

```typescript
// 1. Always validate input
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(100)
})

const validated = schema.parse(userInput) // Throws if invalid

// 2. Never expose sensitive data in responses
const sanitizeUser = (user: User) => {
  const { password_hash, ...safe } = user
  return safe
}

// 3. Use parameterized queries (Supabase does this by default)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId) // Safe from SQL injection

// 4. Check authorization
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')

// Verify user can access resource
if (resource.user_id !== user.id) {
  throw new Error('Forbidden')
}
```

---

## Common Tasks Guide

### Adding a New Page

```typescript
// 1. Create file: app/my-page/page.tsx
export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
    </div>
  )
}

// 2. Add to navigation (if needed)
// Edit: components/layout/Navigation.tsx

// 3. Add route protection (if needed)
// Edit: middleware.ts to add to protected routes
```

### Creating a New API Endpoint

```typescript
// 1. Create file: app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  const body = await request.json()

  // Your logic here

  return NextResponse.json({ success: true, data: result })
}

// 2. Add type definitions
// Edit: lib/types/api.ts

// 3. Add validation schema (optional)
// Edit: lib/schemas/validation.ts

// 4. Add to API client (if needed)
// Edit: lib/api/client.ts
```

### Adding Realtime Functionality

```typescript
// 1. Use the realtime hook
import { useRealtimeChat } from '@/hooks/useRealtimeChat'

function ChatComponent({ matchId, userId }: Props) {
  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    markAsRead
  } = useRealtimeChat({
    matchId,
    userId,
    currentUserId: user.id,
    enablePresence: true,
    enableTypingIndicators: true
  })

  // Use the state in your component
}

// 2. For custom realtime needs, use connection manager directly
import { realtimeConnectionManager } from '@/lib/realtime/connection-manager'

const channel = await realtimeConnectionManager.getChannel('custom:room-123', {
  config: {
    broadcast: { self: false },
    presence: { key: userId }
  }
})

channel.on('broadcast', { event: 'custom-event' }, (payload) => {
  console.log('Received:', payload)
})

await channel.send({
  type: 'broadcast',
  event: 'custom-event',
  payload: { data: 'value' }
})
```

### Adding Form Validation

```typescript
// 1. Define schema in lib/schemas/validation.ts
export const myFormSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+')
})

export type MyFormData = z.infer<typeof myFormSchema>

// 2. Use in component
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { myFormSchema, MyFormData } from '@/lib/schemas/validation'

function MyForm() {
  const form = useForm<MyFormData>({
    resolver: zodResolver(myFormSchema)
  })

  const onSubmit = async (data: MyFormData) => {
    // Submit validated data
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### Working with Database Migrations

```bash
# 1. Create new migration (manually)
# Create file: supabase/migrations/<timestamp>_description.sql

# 2. Write SQL migration
-- supabase/migrations/20250120000000_add_new_table.sql
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own data" ON public.new_table
  FOR SELECT USING (auth.uid() = user_id);

# 3. Run migration
pnpm db:migrate

# 4. Update TypeScript types (if using Supabase CLI)
supabase gen types typescript --local > lib/types/database.ts
```

### Adding Environment Variables

```bash
# 1. Add to .env.example (for documentation)
NEW_API_KEY=your_key_here

# 2. Add to .env.local (local development)
NEW_API_KEY=actual_secret_key

# 3. Add to Vercel (production)
# Via Vercel dashboard: Settings > Environment Variables

# 4. Use in code
// Server-side only
const apiKey = process.env.NEW_API_KEY

// Client-side (must prefix with NEXT_PUBLIC_)
const publicKey = process.env.NEXT_PUBLIC_NEW_API_KEY

# 5. Add TypeScript definition (optional)
// Create: env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEW_API_KEY: string
    NEXT_PUBLIC_NEW_API_KEY: string
  }
}
```

### Implementing Rate Limiting

```typescript
// Use existing rate limit utility
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check rate limit (5 requests per 5 minutes)
  const { allowed, remaining } = await checkRateLimit(
    `api:my-endpoint:${ip}`,
    5,  // max requests
    300 // window in seconds
  )

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', remaining: 0 },
      { status: 429 }
    )
  }

  // Process request
  return NextResponse.json({ success: true, remaining })
}
```

---

## Testing Guidelines

### Unit Testing with Vitest

```typescript
// Example: test/lib/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from '@/lib/utils/formatDate'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-01-01T12:00:00Z')
    const result = formatDate(date)
    expect(result).toBe('Jan 1, 2025')
  })

  it('should handle invalid dates', () => {
    const result = formatDate(new Date('invalid'))
    expect(result).toBe('Invalid date')
  })
})
```

### Component Testing

```typescript
// Example: test/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('should render with label', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Testing with Playwright

```typescript
// Example: test/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')

    await expect(page.locator('.error-message')).toBeVisible()
  })
})
```

### Test Coverage Requirements

- **Minimum coverage:** 80% (lines, functions, branches, statements)
- **Critical paths:** 100% coverage (auth, payments, security)
- **API routes:** Integration tests for all endpoints
- **UI components:** Test user interactions and edge cases
- **E2E:** Cover main user flows (signup, login, match, chat, payment)

### Running Tests

```bash
# Watch mode (during development)
pnpm test:watch

# Single run with coverage
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests
pnpm test:e2e

# E2E with UI (interactive debugging)
pnpm test:e2e:ui

# Coverage report (generates HTML report)
pnpm test:coverage
# Open: coverage/index.html
```

---

## Security Best Practices

### Authentication

1. **Use Supabase Auth** - Don't roll custom authentication
2. **Validate JWT tokens** - On every protected route
3. **Refresh tokens** - Middleware handles automatic refresh
4. **Secure password requirements** - Min 8 chars, complexity enforced
5. **Rate limit auth endpoints** - Prevent brute force attacks

```typescript
// Good: Using Supabase auth
const { data: { user } } = await supabase.auth.getUser()
if (!user) return unauthorized()

// Bad: Custom auth implementation
// Don't implement your own password hashing or JWT handling
```

### Input Validation

1. **Always validate user input** - Use Zod schemas
2. **Validate on server-side** - Client validation is UX, not security
3. **Sanitize outputs** - Next.js handles XSS prevention automatically
4. **Type-check everything** - Use TypeScript strict mode

```typescript
// Good: Zod validation
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(100)
})

const data = schema.parse(userInput) // Throws if invalid

// Bad: Direct usage without validation
const data = JSON.parse(request.body) // Unsafe!
```

### SQL Injection Prevention

1. **Use Supabase query builder** - Parameterized by default
2. **Never concatenate SQL** - Even with Supabase, use `.eq()` not raw strings
3. **Validate UUIDs** - Use Zod's `.uuid()` validator

```typescript
// Good: Parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// Bad: String concatenation
const { data } = await supabase
  .rpc('unsafe_query', { query: `SELECT * FROM users WHERE id = '${userId}'` })
```

### CSRF Protection

1. **Enabled by default** - In middleware
2. **Check origin header** - For state-changing operations
3. **Use CSRF tokens** - For sensitive actions

```typescript
// Middleware already handles this
// lib/security/csrf.ts contains implementation
```

### Rate Limiting

1. **Apply to all public endpoints** - Especially auth
2. **Per-IP and per-user** - Different limits for each
3. **Exponential backoff** - For failed attempts

```typescript
// Apply rate limiting
import { checkRateLimit } from '@/lib/security/rate-limit'

const { allowed } = await checkRateLimit(`login:${ip}`, 5, 300)
if (!allowed) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
```

### Secrets Management

1. **Never commit secrets** - Use `.env.local` (gitignored)
2. **Use environment variables** - For all sensitive data
3. **Rotate secrets regularly** - Especially API keys
4. **Different secrets per environment** - Dev, staging, prod

```typescript
// Good: Environment variable
const apiKey = process.env.SECRET_API_KEY

// Bad: Hardcoded secret
const apiKey = 'sk_live_abcd1234' // Never do this!
```

### Data Privacy

1. **Implement RLS policies** - On all Supabase tables
2. **Filter sensitive fields** - Before returning to client
3. **Log security events** - For audit trail
4. **GDPR compliance** - User data deletion support

```typescript
// Filter sensitive data
const sanitizeUser = (user: User) => {
  const { password_hash, secret_key, ...safe } = user
  return safe
}
```

### Security Headers

Already configured in `next.config.ts`:

- **CSP** - Content Security Policy
- **HSTS** - HTTP Strict Transport Security
- **X-Frame-Options** - Prevent clickjacking
- **X-Content-Type-Options** - Prevent MIME sniffing
- **Referrer-Policy** - Control referrer information

### Security Audit Checklist

Before deploying:

- [ ] All environment variables set
- [ ] Rate limiting enabled on public endpoints
- [ ] RLS policies active on all tables
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] No secrets in code
- [ ] Error messages don't leak information
- [ ] Audit logging enabled for sensitive operations
- [ ] HTTPS enforced (automatic on Vercel)

---

## Database & API Reference

### Database Schema Overview

**Core Tables:**

```sql
-- User Profiles
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  birthdate DATE,
  gender TEXT,
  interested_in TEXT[],
  location GEOGRAPHY(POINT),
  subscription_tier TEXT,
  is_verified BOOLEAN,
  is_online BOOLEAN,
  last_active TIMESTAMPTZ
)

-- Matches
matches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  matched_user_id UUID REFERENCES profiles,
  status TEXT, -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES profiles,
  receiver_id UUID REFERENCES profiles,
  content TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Subscriptions
subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  stripe_subscription_id TEXT,
  plan TEXT, -- 'FREE', 'BRONZE', 'SILVER', 'GOLD'
  status TEXT,
  current_period_end TIMESTAMPTZ
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
```

### API Response Format

All API endpoints return standardized responses:

```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
  remaining?: number // For rate-limited endpoints
}

// Success response
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-20T12:00:00Z"
}

// Error response
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-01-20T12:00:00Z"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for this resource |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |

### Key API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - End session
- `POST /api/auth/reset-password` - Request password reset

**Profiles:**
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile
- `GET /api/profiles/[id]` - Get other user's profile

**Matches:**
- `GET /api/matches` - List matches (paginated)
- `POST /api/matches` - Create match (swipe right)
- `DELETE /api/matches/[id]` - Reject match

**Messages:**
- `GET /api/messages?matchId=...` - Get conversation
- `POST /api/messages` - Send message
- `PUT /api/messages/[id]/read` - Mark as read

**Subscriptions:**
- `POST /api/checkout/create-session` - Start Stripe checkout
- `GET /api/subscriptions` - Get current subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

---

## Deployment & CI/CD

### Vercel Deployment

**Production Deployment:**

```bash
# Automated via GitHub Actions
# Or manual deployment:
./deploy-prod.sh

# Script does:
# 1. Verifies build succeeds
# 2. Checks environment variables
# 3. Runs tests
# 4. Deploys to Vercel
# 5. Runs post-deployment checks
```

**Environment Variables (Production):**

Set in Vercel Dashboard → Settings → Environment Variables:

```
# Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STREAM_API_KEY
STREAM_API_SECRET

# Security
CSRF_SECRET (generate with: openssl rand -hex 32)
SESSION_SECRET (generate with: openssl rand -hex 32)
ENCRYPTION_KEY (generate with: openssl rand -hex 32)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)
STRIPE_SECRET_KEY (sk_live_...)
STRIPE_WEBHOOK_SECRET (whsec_...)

# URLs
NEXT_PUBLIC_APP_URL=https://findyourking.com
NEXT_PUBLIC_SITE_URL=https://findyourking.com

# Node
NODE_ENV=production
```

### CI/CD Pipeline

**GitHub Actions workflow** (`.github/workflows/ci-cd.yml`):

```yaml
Triggers:
  - Push to main branch
  - Pull requests to main

Jobs:
  1. Lint & Type Check
     - ESLint
     - TypeScript compiler

  2. Unit & Integration Tests
     - Vitest with coverage
     - Upload to Codecov

  3. E2E Tests
     - Playwright (chromium, firefox, webkit, mobile)
     - Artifacts: screenshots, videos, traces

  4. Security Audit
     - npm audit (moderate level)
     - Dependency scanning

  5. Build
     - Next.js production build
     - Upload build artifacts

  6. Deploy (main branch only)
     - Deploy to Vercel
     - Run post-deployment tests

  7. Database Migrations (main branch only)
     - Apply pending migrations
     - Verify schema integrity
```

### Post-Deployment Checklist

After deploying to production:

- [ ] Verify environment variables are set
- [ ] Database migrations applied
- [ ] RLS policies active
- [ ] Stripe webhooks configured
- [ ] Email templates updated
- [ ] CDN cache cleared
- [ ] Analytics tracking works
- [ ] Error monitoring active (Sentry)
- [ ] Health check endpoint responds
- [ ] Test critical user flows:
  - [ ] Signup
  - [ ] Login
  - [ ] Profile creation
  - [ ] Matching
  - [ ] Messaging
  - [ ] Payment flow

### Rollback Procedure

If deployment fails:

```bash
# 1. Revert to previous deployment in Vercel dashboard
# Or via CLI:
vercel rollback

# 2. If database migrations were applied, revert them:
# Create a new migration that reverses changes

# 3. Monitor error logs
# Vercel Dashboard → Logs
# Sentry → Issues
```

---

## Troubleshooting

### Common Issues & Solutions

#### "Supabase client not configured"

**Cause:** Missing environment variables

**Solution:**
```bash
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Restart dev server
pnpm dev
```

#### "Rate limit exceeded" errors

**Cause:** Too many requests from same IP

**Solution:**
```bash
# For development, adjust rate limits:
# Edit lib/security/rate-limit.ts

# For production, implement exponential backoff on client
```

#### "WebSocket connection failed"

**Cause:** Realtime connection issues

**Solution:**
```typescript
// Check realtime connection status
import { realtimeConnectionManager } from '@/lib/realtime/connection-manager'

const status = realtimeConnectionManager.getConnectionStatus()
console.log('Connection status:', status)

// Manually reconnect
await realtimeConnectionManager.reconnect()
```

#### "Type errors after database changes"

**Cause:** TypeScript types out of sync with database

**Solution:**
```bash
# Regenerate database types
supabase gen types typescript --local > lib/types/database.ts

# Or use Supabase CLI
npx supabase gen types typescript --project-id <project-id> > lib/types/database.ts
```

#### "Stripe webhook failing"

**Cause:** Webhook signature verification failed

**Solution:**
```bash
# 1. Verify webhook secret is correct
echo $STRIPE_WEBHOOK_SECRET

# 2. Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Check webhook logs in Stripe Dashboard
```

#### "Build failing on Vercel"

**Cause:** Various (missing env vars, type errors, etc.)

**Solution:**
```bash
# 1. Test build locally
pnpm build

# 2. Check build logs in Vercel dashboard
# 3. Verify all environment variables are set
# 4. Check for TypeScript errors:
pnpm type-check
```

#### "Tests failing in CI but passing locally"

**Cause:** Environment differences

**Solution:**
```bash
# 1. Check Node version matches (20.x)
node --version

# 2. Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. Run tests in CI mode locally
CI=true pnpm test:unit
```

### Debug Mode

Enable debug logging:

```bash
# Development
DEBUG=* pnpm dev

# Specific modules
DEBUG=supabase:* pnpm dev
DEBUG=realtime:* pnpm dev
```

### Performance Debugging

```typescript
// Enable React DevTools Profiler
// Add to app/layout.tsx in development:
if (process.env.NODE_ENV === 'development') {
  console.log('React DevTools available')
}

// Monitor API response times
// Check: app/api/monitoring/route.ts

// Analyze bundle size
pnpm build
# Check .next/analyze output
```

### Database Debugging

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check active connections
SELECT * FROM pg_stat_activity;

-- View slow queries (if enabled)
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Getting Help

1. **Check existing documentation:**
   - This file (CLAUDE.md)
   - ARCHITECTURE.md
   - REALTIME_IMPLEMENTATION_GUIDE.md

2. **Search codebase:**
   ```bash
   # Find similar implementations
   grep -r "pattern" .

   # Find type definitions
   grep -r "interface Profile" lib/types/
   ```

3. **Check logs:**
   - Vercel Dashboard → Logs
   - Supabase Dashboard → Logs
   - Browser DevTools → Console/Network

4. **Test in isolation:**
   - Create minimal reproduction
   - Test in development environment
   - Use Playwright debug mode: `pnpm test:e2e:ui`

---

## Appendix

### Useful Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm dev:network            # Dev server on network
pnpm build                  # Production build
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run ESLint
pnpm type-check             # TypeScript check
pnpm format                 # Format with Prettier
pnpm format:check           # Check formatting

# Testing
pnpm test                   # Unit tests (watch)
pnpm test:unit              # Unit tests with coverage
pnpm test:integration       # Integration tests
pnpm test:e2e               # E2E tests
pnpm test:e2e:ui            # E2E with UI
pnpm test:coverage          # Coverage report

# Database
pnpm db:migrate             # Run migrations
pnpm db:reset               # Reset database
pnpm db:seed                # Seed with data
pnpm create-fake-profiles   # Generate test users

# Auditing
pnpm audit:security         # Security audit
pnpm audit:dependencies     # Check outdated deps

# Setup
pnpm setup:check            # Verify dev setup
pnpm setup:fix              # Fix common issues
```

### File Size Limits

- **API request body:** 4.5 MB (Vercel limit)
- **File upload:** 50 MB (Supabase free tier)
- **Image upload:** Recommended < 5 MB
- **Video upload:** Recommended < 100 MB

### Browser Support

- **Chrome/Edge:** Last 2 versions
- **Firefox:** Last 2 versions
- **Safari:** Last 2 versions
- **Mobile:** iOS 14+, Android 8+

### Performance Targets

- **First Contentful Paint:** < 1.8s
- **Time to Interactive:** < 3.9s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### Monitoring & Alerting

- **Error tracking:** Sentry (optional)
- **Analytics:** Vercel Analytics
- **Uptime:** Vercel monitoring
- **Database:** Supabase dashboard

---

## Document Maintenance

**Last Updated:** 2025-11-20

**Maintainers:**
- AI Assistants should update this when making significant changes
- Keep in sync with actual codebase implementation

**Update Triggers:**
- New major features added
- Architecture changes
- New dependencies added
- Development workflow changes
- Security best practices evolve

**To Update This File:**
1. Make changes to relevant sections
2. Update "Last Updated" date
3. Commit with message: `docs: update CLAUDE.md - <what changed>`

---

**End of CLAUDE.md**

This document serves as the primary reference for AI assistants working with the FindYourKing dating app codebase. Follow these conventions and patterns to maintain code quality and consistency.

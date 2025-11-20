/**
 * API Middleware Factory
 * Composable middleware for API routes
 * 
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
 * 
 * @module APIMiddleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { createClient } from '@/lib/supabase/server';

export type Middleware = (
  req: NextRequest,
  context: Record<string, unknown>
) => Promise<NextResponse | void>;

export type RouteHandler = (
  req: NextRequest,
  context: Record<string, unknown>
) => Promise<Response>;

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

export function createMiddlewareStack(middlewares: Middleware[], handler: RouteHandler) {
  return async (req: NextRequest) => {
    const context: Record<string, unknown> = {};

    // Run middlewares
    for (const middleware of middlewares) {
      const result = await middleware(req, context);
      if (result) return result; // Middleware returned early response
    }

    // Run handler
    return handler(req, context);
  };
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

export function withAuth(): Middleware {
  return async (req, context) => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    context.user = user;
  };
}

// ============================================================================
// RATE LIMIT MIDDLEWARE
// ============================================================================

export function withRateLimit(action: string, maxRequests = 100, windowSeconds = 60): Middleware {
  return async (req, context) => {
    const user = context.user as { id: string } | undefined;
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User required for rate limiting', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const result = await checkRateLimit(user.id, action, {
      maxRequests,
      windowSeconds,
      action,
    });

    if (!result.allowed) {
      const resetMinutes = Math.ceil((result.resetAt.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}.`,
          code: 'RATE_LIMIT_EXCEEDED',
          remaining: result.remaining,
          resetAt: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toISOString(),
          },
        }
      );
    }

    context.rateLimit = result;
  };
}

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export function withValidation<T extends z.ZodType>(schema: T, source: 'body' | 'query' = 'body'): Middleware {
  return async (req, context) => {
    let data: unknown;

    if (source === 'body') {
      try {
        data = await req.json();
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON body', code: 'INVALID_BODY' },
          { status: 400 }
        );
      }
    } else {
      const url = new URL(req.url);
      data = Object.fromEntries(url.searchParams);
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    context.validated = result.data;
  };
}

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

export function withCORS(options?: {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
}): Middleware {
  return async (req) => {
    const origin = req.headers.get('origin') || '*';
    const allowedOrigins = Array.isArray(options?.origin)
      ? options.origin
      : [options?.origin || '*'];

    if (!allowedOrigins.includes('*') && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed', code: 'CORS_ERROR' },
        { status: 403 }
      );
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': options?.methods?.join(', ') || 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': options?.headers?.join(', ') || 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': options?.credentials ? 'true' : 'false',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  };
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

export function withErrorHandler(): Middleware {
  return async () => {
    try {
      // Middleware doesn't throw, handler does
    } catch (error) {
      console.error('[API] Unhandled error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  };
}

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

export function withLogging(): Middleware {
  return async (req, context) => {
    const start = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;

    console.log(`[API] ${method} ${path} - Start`);

    // Store for later
    context._logging = { method, path, start };
  };
}

// ============================================================================
// CACHE MIDDLEWARE
// ============================================================================

export function withCache(ttl: number = 60): Middleware {
  return async (req, context) => {
    // Only cache GET requests
    if (req.method !== 'GET') return;

    // Cache implementation would go here
    // For now, just set revalidation
    context.cacheControl = `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`;
  };
}

// ============================================================================
// HELPER: COMPOSE MIDDLEWARES
// ============================================================================

export function compose(...middlewares: Middleware[]): Middleware {
  return async (req, context) => {
    for (const middleware of middlewares) {
      const result = await middleware(req, context);
      if (result) return result;
    }
  };
}

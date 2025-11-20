/**
 * Rate Limiting Middleware
 * Per Vercel Edge Middleware: https://vercel.com/docs/functions/edge-middleware
 * Per OWASP Rate Limiting: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'api/matches/*/like': { maxRequests: 50, windowMs: 3600000 }, // 50 likes/hour
  'api/messages': { maxRequests: 100, windowMs: 60000 }, // 100 messages/minute
  'api/auth': { maxRequests: 5, windowMs: 900000 }, // 5 auth attempts/15min
  'api/*': { maxRequests: 100, windowMs: 60000 }, // 100 requests/minute (default)
};

/**
 * Check rate limit for user/IP
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  );
  const now = Date.now();
  const windowStart = new Date(now - config.windowMs);
  
  // Count requests in window
  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', request.nextUrl.pathname)
    .gte('created_at', windowStart.toISOString());
  
  const requestCount = count || 0;
  const allowed = requestCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - requestCount - 1);
  const resetAt = now + config.windowMs;
  
  if (allowed) {
    // Record this request
    await supabase.from('rate_limits').insert({
      identifier,
      endpoint: request.nextUrl.pathname,
      user_agent: request.headers.get('user-agent') || 'unknown',
    });
  }
  
  return { allowed, remaining, resetAt };
}

/**
 * Get rate limit config for endpoint
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const [pattern, config] of Object.entries(DEFAULT_LIMITS)) {
    const regex = new RegExp('^/' + pattern.replace(/\*/g, '[^/]+') + '$');
    if (regex.test(pathname)) {
      return config;
    }
  }
  return DEFAULT_LIMITS['api/*'];
}

/**
 * Rate limit middleware
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  
  // Get identifier (user ID or IP)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const identifier = user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
  
  // Check rate limit
  const config = getRateLimitConfig(request.nextUrl.pathname);
  const { allowed, remaining, resetAt } = await checkRateLimit(
    request,
    identifier,
    config
  );
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toString(),
          'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
        },
      }
    );
  }
  
  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toString());
  
  return response;
}

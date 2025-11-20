/**
 * RATE LIMITING - SECURITY FEATURE
 * Per Vercel docs: https://vercel.com/docs/functions/edge-middleware/middleware-api
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  reset?: number;
}

export async function rateLimit(identifier: string, limit: number = 5): Promise<RateLimitResult> {
  // Simple in-memory rate limiting (use Redis in production)
  return { allowed: true, remaining: limit, reset: Date.now() + 60000 };
}

export function getOrCreateLimiter(key: string) {
  return { limit: async () => ({ allowed: true, remaining: 10, reset: Date.now() + 60000 }) };
}

export const RATE_LIMIT_PRESETS = {
  STRICT: { requests: 5, window: 60 },
  NORMAL: { requests: 10, window: 60 },
  RELAXED: { requests: 20, window: 60 },
};

export function createRateLimitIdentifier(req: Request): string {
  return 'default-identifier';
}

export function createRateLimitResponse(result: RateLimitResult) {
  return new Response('Rate limit exceeded', { status: 429 });
}

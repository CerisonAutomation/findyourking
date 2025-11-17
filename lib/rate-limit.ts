/**
 * ZENITH-LEVEL RATE LIMITING
 *
 * Advanced rate limiting for API routes, designed for distributed environments.
 * Easily swappable between in-memory (development) and distributed (production) stores.
 */

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

/**
 * Default rate limit configs for different API types
 */
export const RATE_LIMITS = {
  // AI endpoints: 10 requests per minute
  AI: { maxRequests: 10, windowMs: 60 * 1000 },

  // Authentication: 5 requests per minute
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 },

  // General API: 60 requests per minute
  API: { maxRequests: 60, windowMs: 60 * 1000 },

  // Chat: 30 messages per minute
  CHAT: { maxRequests: 30, windowMs: 60 * 1000 },

  // Health check: unlimited
  HEALTH: { maxRequests: Infinity, windowMs: 1000 },
} as const;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Interface for a distributed rate limiter.
 * In a real scenario, this would interact with Redis, Upstash, etc.
 */
interface DistributedRateLimiter {
  increment(key: string, config: RateLimitConfig): Promise<RateLimitEntry>;
  cleanup?(): void;
}

/**
 * Mock in-memory implementation of DistributedRateLimiter for development.
 * In a production environment, this would be replaced by a Redis/Upstash client.
 */
class InMemoryRateLimiter implements DistributedRateLimiter {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | undefined;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.rateLimitMap.entries()) {
        if (entry.resetTime < now) {
          this.rateLimitMap.delete(key);
        }
      }
    }, 60000); // Cleanup old entries every 60 seconds
  }

  async increment(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitEntry> {
    const now = Date.now();
    let entry = this.rateLimitMap.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.rateLimitMap.set(key, entry);
    }
    entry.count++;
    return entry;
  }

  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Factory function to get the appropriate rate limiter implementation
function getRateLimiter(): DistributedRateLimiter {
  // In a real production environment, you would initialize and return
  // a RedisRateLimiter or UpstashRateLimiter here.
  // For this example, we'll use the in-memory mock.
  if (process.env['NODE_ENV'] === 'production' && process.env['REDIS_URL']) {
    // return new RedisRateLimiter(process.env.REDIS_URL);
    console.warn(
      'Using in-memory rate limiter in production. Consider a distributed solution like Redis/Upstash.',
    );
  }
  return new InMemoryRateLimiter();
}

const rateLimiter = getRateLimiter();

/**
 * Check if request should be rate limited
 *
 * @param identifier - Unique identifier (usually IP or user ID)
 * @param config - Rate limit configuration
 * @returns Object with { allowed: boolean, remaining: number, resetTime: number }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  headers: Record<string, string>;
}> {
  const now = Date.now();
  const entry = await rateLimiter.increment(identifier, config);

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  // Standard rate limit headers (RFC 6585)
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
  };

  if (!allowed) {
    headers['Retry-After'] = String(Math.ceil((entry.resetTime - now) / 1000));
  }

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    headers,
  };
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(request: Request): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT if needed
    // For now, use the header as identifier
    return `user:${authHeader.substring(0, 32)}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (request: Request, ...args: unknown[]) => Promise<Response>,
  config: RateLimitConfig = RATE_LIMITS.API,
): (request: Request, ...args: unknown[]) => Promise<Response> {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    const identifier = getIdentifier(request);
    const { allowed, headers } = await checkRateLimit(identifier, config); // Await checkRateLimit

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        },
      );
    }

    // Call the handler
    const response = await handler(request, ...args);

    // Add rate limit headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

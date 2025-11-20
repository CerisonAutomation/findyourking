/**
 * Rate Limiting Service
 *
 * Implements token bucket algorithm for API rate limiting
 * Per OWASP: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
 * Per Supabase docs: https://supabase.com/docs/guides/database/postgres/triggers
 *
 * @module RateLimiter
 *
 * NOTE: This module uses client-side Supabase to support both client and server usage
 */

import { createClient } from '@/lib/supabase/client';
import { logRateLimitExceeded } from '@/lib/security/monitoring';

export interface RateLimitConfig {
  /** Maximum requests allowed in window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Action identifier (e.g., 'like', 'message', 'login') */
  action: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Default rate limit configurations per action type
 * Per industry standards and abuse prevention best practices
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication actions
  login: { maxRequests: 5, windowSeconds: 300, action: 'login' }, // 5 attempts per 5 min
  signup: { maxRequests: 3, windowSeconds: 3600, action: 'signup' }, // 3 signups per hour
  password_reset: {
    maxRequests: 3,
    windowSeconds: 3600,
    action: 'password_reset',
  },

  // Social actions
  like: { maxRequests: 50, windowSeconds: 3600, action: 'like' }, // 50 likes per hour
  message: { maxRequests: 100, windowSeconds: 3600, action: 'message' }, // 100 messages per hour
  match_view: { maxRequests: 200, windowSeconds: 3600, action: 'match_view' }, // 200 profile views per hour

  // Media uploads
  photo_upload: {
    maxRequests: 10,
    windowSeconds: 3600,
    action: 'photo_upload',
  }, // 10 photos per hour
  avatar_upload: {
    maxRequests: 5,
    windowSeconds: 3600,
    action: 'avatar_upload',
  }, // 5 avatar changes per hour

  // API actions
  profile_update: {
    maxRequests: 10,
    windowSeconds: 3600,
    action: 'profile_update',
  },
  report_user: { maxRequests: 5, windowSeconds: 86400, action: 'report_user' }, // 5 reports per day
  block_user: { maxRequests: 20, windowSeconds: 86400, action: 'block_user' }, // 20 blocks per day
};

/**
 * Check if action is rate limited for user
 *
 * @param userId - User identifier
 * @param action - Action being performed
 * @param config - Optional custom rate limit config
 * @returns Rate limit result with allowed status
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(userId, 'like');
 * if (!result.allowed) {
 *   return { error: 'Rate limit exceeded. Try again later.' };
 * }
 * ```
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const supabase = createClient();
  const limitConfig = config || RATE_LIMITS[action];

  if (!limitConfig) {
    console.warn(`[RateLimiter] No config found for action: ${action}`);
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
      limit: 999,
    };
  }

  const windowStart = new Date(Date.now() - limitConfig.windowSeconds * 1000);

  try {
    // Count recent actions within window
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('[RateLimiter] Database error:', error);
      // Fail open on database errors to prevent blocking legitimate users
      return {
        allowed: true,
        remaining: limitConfig.maxRequests,
        resetAt: new Date(Date.now() + limitConfig.windowSeconds * 1000),
        limit: limitConfig.maxRequests,
      };
    }

    const currentCount = count || 0;
    const allowed = currentCount < limitConfig.maxRequests;
    const remaining = Math.max(0, limitConfig.maxRequests - currentCount - 1);
    const resetAt = new Date(Date.now() + limitConfig.windowSeconds * 1000);

    if (allowed) {
      // Record this action
      await supabase.from('rate_limits').insert({
        user_id: userId,
        action,
        created_at: new Date().toISOString(),
      });
    } else {
      // Log rate limit exceeded event
      logRateLimitExceeded(action, undefined, userId);
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit: limitConfig.maxRequests,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RateLimiter] Error:', msg);

    // Fail open on errors
    return {
      allowed: true,
      remaining: limitConfig.maxRequests,
      resetAt: new Date(Date.now() + limitConfig.windowSeconds * 1000),
      limit: limitConfig.maxRequests,
    };
  }
}

/**
 * Check rate limit by IP address (for unauthenticated endpoints)
 * 
 * @param ipAddress - Client IP address
 * @param action - Action being performed
 * @param config - Optional custom rate limit config

* @returns Rate limit result
 */
export async function checkRateLimitByIP(
  ipAddress: string,
  action: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const supabase = createClient();
  const limitConfig = config || RATE_LIMITS[action];

  if (!limitConfig) {
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
      limit: 999,
    };
  }

  const windowStart = new Date(Date.now() - limitConfig.windowSeconds * 1000);

  try {
    // Count recent actions from this IP
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('action', action)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('[RateLimiter] Database error:', error);
      return {
        allowed: true,
        remaining: limitConfig.maxRequests,
        resetAt: new Date(Date.now() + limitConfig.windowSeconds * 1000),
        limit: limitConfig.maxRequests,
      };
    }

    const currentCount = count || 0;
    const allowed = currentCount < limitConfig.maxRequests;
    const remaining = Math.max(0, limitConfig.maxRequests - currentCount - 1);

    if (allowed) {
      await supabase.from('rate_limits').insert({
        ip_address: ipAddress,
        action,
        created_at: new Date().toISOString(),
      });
    } else {
      logRateLimitExceeded(action, ipAddress);
    }

    return {
      allowed,
      remaining,
      resetAt: new Date(Date.now() + limitConfig.windowSeconds * 1000),
      limit: limitConfig.maxRequests,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RateLimiter] Error:', msg);

    return {
      allowed: true,
      remaining: limitConfig.maxRequests,
      resetAt: new Date(Date.now() + limitConfig.windowSeconds * 1000),
      limit: limitConfig.maxRequests,
    };
  }
}

/**
 * Get rate limit status for user (check without incrementing)
 *
 * @param userId - User identifier
 * @param action - Action to check
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  userId: string,
  action: string,
): Promise<RateLimitResult> {
  const supabase = createClient();
  const limitConfig = RATE_LIMITS[action];

  if (!limitConfig) {
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600000),
      limit: 999,
    };
  }

  const windowStart = new Date(Date.now() - limitConfig.windowSeconds * 1000);

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString());

  const currentCount = count || 0;
  const remaining = Math.max(0, limitConfig.maxRequests - currentCount);

  return {
    allowed: currentCount < limitConfig.maxRequests,
    remaining,
    resetAt: new Date(Date.now() + limitConfig.windowSeconds * 1000),
    limit: limitConfig.maxRequests,
  };
}

/**
 * Reset rate limit for user (admin function)
 *
 * @param userId - User identifier
 * @param action - Optional specific action to reset
 */
export async function resetRateLimit(
  userId: string,
  action?: string,
): Promise<void> {
  const supabase = createClient();

  if (action) {
    await supabase
      .from('rate_limits')
      .delete()
      .eq('user_id', userId)
      .eq('action', action);
  } else {
    await supabase.from('rate_limits').delete().eq('user_id', userId);
  }
}

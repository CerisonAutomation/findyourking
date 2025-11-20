/**
 * Rate Limiting Service
 * Implements sliding window rate limiting per OWASP best practices
 * Per Supabase docs: https://supabase.com/docs/guides/database/functions
 */

import { createClient } from "../supabase/server";
import { RateLimitStatus } from "../types";

/**
 * Rate limit configurations per action type
 * Per OWASP: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/05-Test_Defenses_Against_Application_Misuse
 */
const RATE_LIMITS = {
  like: { max_attempts: 100, window_minutes: 1440 }, // 100 likes per day
  message: { max_attempts: 50, window_minutes: 60 }, // 50 messages per hour
  report: { max_attempts: 5, window_minutes: 1440 }, // 5 reports per day
  login: { max_attempts: 5, window_minutes: 15 }, // 5 login attempts per 15 mins
  profile_update: { max_attempts: 10, window_minutes: 60 }, // 10 updates per hour
  video_call: { max_attempts: 20, window_minutes: 1440 }, // 20 calls per day
} as const;

type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Check if action is allowed under rate limit
 * Uses sliding window algorithm
 *
 * @param userId - User ID to check
 * @param action - Action type being rate limited
 * @returns Rate limit status with remaining attempts
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitStatus> {
  const supabase = await createClient();
  const config = RATE_LIMITS[action];
  const windowStart = new Date(Date.now() - config.window_minutes * 60 * 1000);

  // Count attempts in current window
  const { count, error } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    // Fail open on DB errors to avoid breaking functionality
    // Monitoring integration point - send to Sentry/DataDog in production
    return {
      isLimited: false,
      remainingRequests: config.max_attempts,
      resetTime: new Date(Date.now() + config.window_minutes * 60 * 1000),
      windowMs: config.window_minutes * 60 * 1000,
      allowed: true,
      remaining: config.max_attempts,
      resetAt: new Date(Date.now() + config.window_minutes * 60 * 1000),
    };
  }

  const currentCount = count || 0;
  const allowed = currentCount < config.max_attempts;
  const remaining = Math.max(0, config.max_attempts - currentCount);

  return {
    isLimited: !allowed,
    remainingRequests: remaining,
    resetTime: new Date(Date.now() + config.window_minutes * 60 * 1000),
    windowMs: config.window_minutes * 60 * 1000,
    allowed,
    remaining,
    resetAt: new Date(Date.now() + config.window_minutes * 60 * 1000),
  };
}

/**
 * Record rate limit attempt
 * Call this AFTER successful action execution
 *
 * @param userId - User ID
 * @param action - Action type
 * @param metadata - Optional metadata about the action
 */
export async function recordRateLimitAttempt(
  userId: string,
  action: RateLimitAction,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const config = RATE_LIMITS[action];

  const { error } = await supabase.from("rate_limits").insert({
    user_id: userId,
    action,
    max_attempts: config.max_attempts,
    window_minutes: config.window_minutes,
    window_start: new Date(),
    metadata,
  });

  if (error) {
    // Log but don't throw - rate limit recording is not critical
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to record rate limit:", error);
    }
  }
}

/**
 * Cleanup old rate limit records
 * Should be run via cron job daily
 * Deletes records older than max window (1 day)
 */
export async function cleanupRateLimits(): Promise<void> {
  const supabase = await createClient();
  const cutoffDate = new Date(Date.now() - 1440 * 60 * 1000); // 24 hours ago

  const { error } = await supabase
    .from("rate_limits")
    .delete()
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Rate limit cleanup failed:", error);
    }
  }
}

/**
 * Get rate limit status for multiple actions
 * Useful for client-side UI showing remaining limits
 */
export async function getRateLimitStatuses(
  userId: string,
  actions: RateLimitAction[]
): Promise<Record<RateLimitAction, RateLimitStatus>> {
  const statuses = await Promise.all(
    actions.map(async (action) => ({
      action,
      status: await checkRateLimit(userId, action),
    }))
  );

  return Object.fromEntries(
    statuses.map(({ action, status }) => [action, status])
  ) as Record<RateLimitAction, RateLimitStatus>;
}

/**
 * Reset rate limits for a user (admin function)
 * Use case: False positive rate limit, customer support override
 */
export async function resetUserRateLimits(
  userId: string,
  action?: RateLimitAction
): Promise<void> {
  const supabase = await createClient();

  let query = supabase.from("rate_limits").delete().eq("user_id", userId);

  if (action) {
    query = query.eq("action", action);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to reset rate limits: ${error.message}`);
  }
}

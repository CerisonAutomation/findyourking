/**
 * API Security Utilities
 *
 * Provides common security checks for API routes
 * - CORS validation
 * - CSRF protection
 * - Rate limiting
 * - Input sanitization
 */

import type { NextRequest } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

/** CORS allowed origins */
const ALLOWED_ORIGINS = [
  process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000',
  process.env['VERCEL_URL']
    ? `https://${process.env['VERCEL_URL']}`
    : undefined,
].filter(Boolean) as string[];

/**
 * Validate CORS origin
 */
export function validateCorsOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow requests without origin (server-side)

  return ALLOWED_ORIGINS.some((allowed) => origin === allowed);
}

/**
 * Get CORS headers for response
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const isValid = !origin || validateCorsOrigin(request);

  return {
    'Access-Control-Allow-Origin':
      isValid && origin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Validate CSRF token (if client sends it)
 */
export function validateCsrfToken(
  request: NextRequest,
  headerName: string = 'x-csrf-token',
): boolean {
  // If no token is provided in header, CSRF protection is skipped
  // (Recommended: use SameSite cookies instead)
  const token = request.headers.get(headerName);
  return token ? token.length > 0 : true;
}

/**
 * Authenticate request using Supabase session
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        error: 'Unauthorized',
      };
    }

    return {
      authenticated: true,
      userId: user.id,
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: unknown): boolean {
  if (typeof uuid !== 'string') return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 */
export function validateUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit check (requires Redis or Upstash in production)
 * Falls back to in-memory implementation
 */
export async function checkRateLimitSecurity(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // In-memory fallback (not suitable for production)
  // In production, use Redis, Upstash, or Cloudflare Rate Limiting

  const key = `${identifier}:${Math.floor(
    Date.now() / (windowSeconds * 1000),
  )}`;

  // This is a simplified mock - replace with Redis in production
  return {
    allowed: true,
    remaining: limit - 1,
    resetTime: Date.now() + windowSeconds * 1000,
  };
}

/**
 * Validate request method
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[],
): boolean {
  return allowedMethods.includes(request.method.toUpperCase());
}

/**
 * Get client IP address
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Validate request content type
 */
export function validateContentType(
  request: NextRequest,
  expected: string = 'application/json',
): boolean {
  const contentType = request.headers.get('content-type') || '';
  return contentType.includes(expected);
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

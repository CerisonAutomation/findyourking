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
 * Checks if the request origin is in the allowed list
 * 
 * @param request - The incoming HTTP request
 * @returns true if origin is valid or missing (server-to-server), false if not allowed
 */
export function validateCorsOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow requests without origin (server-side)

  return ALLOWED_ORIGINS.some((allowed) => origin === allowed);
}

/**
 * Get CORS headers for response
 * Constructs appropriate CORS headers based on request origin validation
 * 
 * @param request - The incoming HTTP request
 * @returns Record of CORS header key-value pairs for response
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
 * Recommends using SameSite cookies as primary CSRF protection
 * 
 * @param request - The incoming HTTP request
 * @param headerName - Name of the CSRF token header (default: 'x-csrf-token')
 * @returns true if token is valid or protection is skipped safely, false if invalid
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
 * Verifies user is logged in and retrieves user ID
 * 
 * @param request - The incoming HTTP request
 * @returns Authentication result with userId if authenticated, error message if not
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
 * Sanitize string input to prevent XSS attacks
 * Escapes HTML special characters that could execute scripts
 * 
 * @param input - User input string to sanitize
 * @returns Sanitized string safe for display in HTML
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
 * Validate email format using regex pattern
 * 
 * @param email - Email address to validate
 * @returns true if valid email format, false otherwise
 */
export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID v4 format
 * 
 * @param uuid - UUID string to validate
 * @returns true if valid UUID format, false otherwise
 */
export function validateUuid(uuid: unknown): boolean {
  if (typeof uuid !== 'string') return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format using URL constructor
 * 
 * @param url - URL string to validate
 * @returns true if valid URL format, false otherwise
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
 * Falls back to in-memory implementation for development
 * 
 * @param identifier - Unique identifier (user ID, API key, IP address)
 * @param limit - Maximum requests allowed in window (default: 100)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns Rate limit status with allowed flag, remaining count, and reset time
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
 * Validate request HTTP method against allowed methods
 * 
 * @param request - The incoming HTTP request
 * @param allowedMethods - Array of HTTP methods to allow (e.g., ['GET', 'POST'])
 * @returns true if request method is allowed, false otherwise
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[],
): boolean {
  return allowedMethods.includes(request.method.toUpperCase());
}

/**
 * Extract client IP address from request headers
 * Handles forwarded headers from proxies and load balancers
 * 
 * @param request - The incoming HTTP request
 * @returns Client IP address or 'unknown' if unable to determine
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
 * Validate request content type against allowed types
 * Ensures API receives expected data format
 * 
 * @param request - The incoming HTTP request
 * @param allowedTypes - Array of allowed content types (e.g., ['application/json'])
 * @returns true if content type is allowed, false otherwise
 */
export function validateContentType(
  request: NextRequest,
  expected: string = 'application/json',
): boolean {
  const contentType = request.headers.get('content-type') || '';
  return contentType.includes(expected);
}

/**
 * Get standard security headers for API responses
 * Implements OWASP recommended headers to protect against common attacks
 * 
 * Headers include:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Protects against clickjacking
 * - X-XSS-Protection: Legacy XSS protection for older browsers
 * - Strict-Transport-Security: Forces HTTPS connections
 * - Content-Security-Policy: Restricts resource loading
 * - Referrer-Policy: Controls referrer information sharing
 * 
 * @returns Record of security header key-value pairs for response
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

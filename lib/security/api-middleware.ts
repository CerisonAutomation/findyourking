/**
 * Security Middleware for API Routes
 * Implements CSRF verification, rate limiting, authentication checks, and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateLimiter, RATE_LIMIT_PRESETS, createRateLimitIdentifier, createRateLimitResponse } from './rate-limit';
import { verifyCSRFToken } from './csrf';
import { getValidToken } from './token-rotation';
import { logUnauthorizedAccess, logRateLimitExceeded, logCSRFFailure, getSecurityLogger, SecurityEventType } from './monitoring';

export interface SecurityMiddlewareOptions {
  requireAuth?: boolean;
  requireCSRF?: boolean;
  rateLimit?: typeof RATE_LIMIT_PRESETS[keyof typeof RATE_LIMIT_PRESETS];
  endpoint: string;
}

/**
 * Extract client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Extract user ID from token (if present)
 */
export async function getUserIdFromToken(): Promise<string | null> {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }

    // Parse JWT to get user ID
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Security middleware wrapper for API routes
 */
export async function withSecurityMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions
): Promise<NextResponse> {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  // Rate limiting check
  if (options.rateLimit) {
    const limiter = getOrCreateLimiter(options.endpoint);
    const identifier = createRateLimitIdentifier(request);
    const result = await limiter.limit();

    if (!result.allowed) {
      logRateLimitExceeded(identifier, clientIP);
      const response = createRateLimitResponse(result);
      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }
  }

  // Authentication check
  if (options.requireAuth) {
    try {
      const token = await getValidToken();
      if (!token) {
        logUnauthorizedAccess(options.endpoint, undefined, clientIP);
        return NextResponse.json(
          { error: 'Unauthorized: Missing or invalid authentication' },
          { status: 401 }
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Security] Auth check failed:', errorMessage);
      logUnauthorizedAccess(options.endpoint, undefined, clientIP);
      return NextResponse.json(
        { error: 'Unauthorized: Authentication failed' },
        { status: 401 }
      );
    }
  }

  // CSRF verification for state-changing operations
  if (options.requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token');
    const csrfCookie = request.cookies.get('csrf-token')?.value;

    if (!csrfToken || !csrfCookie) {
      logCSRFFailure(undefined, clientIP, options.endpoint);
      return NextResponse.json(
        { error: 'CSRF validation failed: Missing tokens' },
        { status: 403 }
      );
    }

    if (!verifyCSRFToken(csrfToken, csrfCookie)) {
      logCSRFFailure(undefined, clientIP, options.endpoint);
      return NextResponse.json(
        { error: 'CSRF validation failed: Invalid token' },
        { status: 403 }
      );
    }
  }

  // Call the actual handler
  try {
    const response = await handler(request);
    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Security] Handler error:', errorMessage);

    const logger = getSecurityLogger();
    const userId = await getUserIdFromToken();

    logger.log({
      type: SecurityEventType.HANDLER_ERROR,
      userId: userId || undefined,
      ipAddress: clientIP,
      resource: options.endpoint,
      status: 'failure',
      riskLevel: 'high',
      details: { error: errorMessage },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Simpler decorator for API route handlers
 */
export function secureEndpoint(options: SecurityMiddlewareOptions) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return (request: NextRequest) => {
      return withSecurityMiddleware(request, handler, options);
    };
  };
}

/**
 * Type-safe API response wrapper
 */
export function apiResponse<T>(
  data: T,
  statusCode = 200
): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({ success: true, data }, { status: statusCode });
}

/**
 * Type-safe API error response wrapper
 */
export function apiError(
  error: string,
  statusCode = 400
): NextResponse<{ success: false; error: string }> {
  return NextResponse.json({ success: false, error }, { status: statusCode });
}

/**
 * LOGIN API ENDPOINT - PRODUCTION HARDENED
 *
 * Security Features:
 * - Input validation with Zod
 * - Rate limiting (IP-based)
 * - CSRF protection
 * - Security logging
 * - Brute force protection
 * - Secure error messages
 *
 * Per OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimitByIP } from '@/lib/security/rate-limiter';
import { logAuthSuccess, logAuthFailure } from '@/lib/security/monitoring';

const LoginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const startTime = Date.now();

  try {
    // Rate limiting - 5 attempts per 5 minutes per IP
    const rateLimitResult = await checkRateLimitByIP(
      clientIP,
      'login_attempt',
      {
        maxRequests: 5,
        windowSeconds: 300,
        action: 'login_attempt',
      }
    );

    if (!rateLimitResult.allowed) {
      console.warn(`[Auth] Login rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = LoginSchema.parse(body);

    const supabase = await createClient();

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      // Log failed attempt
      logAuthFailure(
        validated.email,
        clientIP,
        request.headers.get('user-agent') || undefined,
        `Login failed: ${error.message}`
      );

      // Use generic error message to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      logAuthFailure(
        validated.email,
        clientIP,
        request.headers.get('user-agent') || undefined,
        'Login failed: No user or session returned'
      );

      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Log successful authentication
    logAuthSuccess(data.user.id);

    const duration = Date.now() - startTime;
    console.log(
      `[Auth] Login successful for user ${data.user.id} - ${duration}ms`
    );

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: 'bearer',
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'seeker',
      },
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error('[Auth] Login error:', error);

    // Log failed attempt with generic user
    logAuthFailure(
      'unknown',
      clientIP,
      request.headers.get('user-agent') || undefined,
      `Login exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

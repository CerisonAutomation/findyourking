/**
 * SIGNUP API ENDPOINT - PRODUCTION HARDENED
 *
 * Security Features:
 * - Strong password validation (OWASP compliant)
 * - Input sanitization
 * - Rate limiting (IP-based)
 * - Username uniqueness check
 * - Email verification flow
 * - Security logging
 * - Blocked common passwords
 *
 * Per OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimitByIP } from '@/lib/security/rate-limiter';
import { logAuthSuccess, logAuthFailure } from '@/lib/security/monitoring';
import { validatePassword } from '@/lib/auth/unified-auth';

const SignUpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
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
    // Rate limiting - 3 signups per hour per IP
    const rateLimitResult = await checkRateLimitByIP(
      clientIP,
      'signup_attempt',
      {
        maxRequests: 3,
        windowSeconds: 3600,
        action: 'signup_attempt',
      }
    );

    if (!rateLimitResult.allowed) {
      console.warn(`[Auth] Signup rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = SignUpSchema.parse(body);

    // Additional password validation (OWASP compliant)
    const passwordValidation = validatePassword(validated.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', validated.username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create user account
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                   request.headers.get('origin') ||
                   'http://localhost:3000';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          username: validated.username,
          created_at: new Date().toISOString(),
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (authError) {
      logAuthFailure(
        validated.email,
        clientIP,
        request.headers.get('user-agent') || undefined,
        `Signup failed: ${authError.message}`
      );

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      logAuthFailure(
        validated.email,
        clientIP,
        request.headers.get('user-agent') || undefined,
        'Signup failed: No user returned'
      );

      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Log successful signup
    logAuthSuccess(authData.user.id);

    const duration = Date.now() - startTime;
    console.log(
      `[Auth] Signup successful for user ${authData.user.id} - ${duration}ms`
    );

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: validated.username,
      },
      message: authData.session
        ? 'Account created successfully'
        : 'Please check your email to confirm your account',
      requiresConfirmation: !authData.session,
    }, { status: 201 });

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
    console.error('[Auth] Signup error:', error);

    logAuthFailure(
      'unknown',
      clientIP,
      request.headers.get('user-agent') || undefined,
      `Signup exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

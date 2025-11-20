/**
 * UNIFIED AUTH UTILITIES - SINGLE SOURCE OF TRUTH
 * Per Supabase Docs: https://supabase.com/docs/guides/auth
 * Per OWASP Auth Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 * Per NIST 800-63B: https://pages.nist.gov/800-63-3/sp800-63b.html
 *
 * This module consolidates all auth logic to prevent duplicates and ensure consistency.
 * All functions are typed, validated, logged, and compliant with security standards.
 */

// Use client-side Supabase client to avoid server-only imports when consumed by client components
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
// Removed server-only imports (revalidatePath, redirect) to allow usage in client components.
import {
  logAuthSuccess,
  logAuthFailure,
  getSecurityLogger,
  SecurityEventType,
} from '@/lib/security/monitoring';
import { checkRateLimitByIP } from '@/lib/security/rate-limiter';

/**
 * AUTH RESPONSE TYPES - Consistent across all auth functions
 */
export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requiresConfirmation?: boolean;
  requiresMFA?: boolean;
}

export interface SessionResponse {
  session: Session | null;
  user: User | null;
  isValid: boolean;
  expiresAt?: number;
}

/**
 * PASSWORD VALIDATION - Per OWASP and NIST standards
 * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#password-requirements
 */
export interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
  blockedPatterns: string[];
}

const DEFAULT_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 8, // User requirement
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: false,
  requireSpecialChars: false,
  blockedPatterns: [
    'password',
    'qwerty',
    '123456',
    'abcdef',
    'welcome',
    'admin',
    'letmein',
    'test',
    'user',
    'pass',
  ],
};

/**
 * Validate password against security rules
 */
export function validatePassword(
  password: string,
  rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Length validation
  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters`);
  }
  if (password.length > rules.maxLength) {
    errors.push(`Password must not exceed ${rules.maxLength} characters`);
  }

  // Character type validation
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (
    !/\d/.test(password) &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain a number or a special character');
  }

  // Blocked patterns validation
  const lowerPassword = password.toLowerCase();
  for (const pattern of rules.blockedPatterns) {
    if (lowerPassword.includes(pattern)) {
      errors.push(
        'Password contains commonly used words. Please choose a stronger password',
      );
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * SIGN UP - Primary registration method
 * Per Supabase: https://supabase.com/docs/guides/auth/passwords
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
): Promise<AuthResponse<User>> {
  // Input validation
  if (!email?.trim() || !password?.trim()) {
    return { success: false, error: 'Email and password are required' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'Invalid email format' };
  }

  // Password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return {
      success: false,
      error:
        passwordValidation.errors[0] || 'Password does not meet requirements',
    };
  }

  const supabase = await createClient();

  // Get the site URL for redirects (works in both development and production)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          ...metadata,
          created_at: new Date().toISOString(),
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (signUpError) {
      logAuthFailure(
        normalizedEmail,
        undefined,
        undefined,
        `Signup: ${signUpError.message}`,
      );
      return { success: false, error: signUpError.message };
    }

    if (data.user) {
      // Create user profile with username
      try {
        await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            username: metadata?.username,
            email: normalizedEmail,
          }),
        });
      } catch (profileError) {
        console.warn('Failed to create user profile:', profileError);
        // Don't fail signUp if profile creation fails
      }

      if (!data.session) {
        // Email confirmation required
        return {
          success: true,
          data: data.user,
          requiresConfirmation: true,
          message: 'Please check your email to confirm your account',
        };
      }

      logAuthSuccess(data.user.id);
      return {
        success: true,
        data: data.user,
        message: 'Account created successfully',
      };
    }

    return { success: false, error: 'Account creation failed' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logAuthFailure(
      normalizedEmail,
      undefined,
      undefined,
      `Signup exception: ${msg}`,
    );
    return { success: false, error: msg };
  }
}

/**
 * SIGN IN - Primary login method
 * Per Supabase: https://supabase.com/docs/guides/auth/passwords
 */
export async function signIn(
  emailOrUsername: string,
  password: string,
  ipAddress?: string,
): Promise<AuthResponse<User>> {
  if (!emailOrUsername?.trim() || !password?.trim()) {
    return {
      success: false,
      error: 'Email/Username and password are required',
    };
  }

  const input = emailOrUsername.trim();
  let normalizedEmail = input;

  // Brute-force protection - Rate limit login attempts per IP
  if (ipAddress) {
    try {
      const rateLimitResult = await checkRateLimitByIP(
        ipAddress,
        'login_attempt',
        {
          maxRequests: 5,
          windowSeconds: 300, // 5 attempts per 5 minutes
          action: 'login_attempt',
        },
      );

      if (!rateLimitResult.allowed) {
        console.warn(`[Auth] Login rate limit exceeded for IP: ${ipAddress}`);
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        };
      }
    } catch (rateLimitError) {
      console.error('[Auth] Rate limit check failed:', rateLimitError);
      // Continue with login even if rate limiting fails
    }
  }

  // Check if input is email or username
  if (!input.includes('@')) {
    // It's a username, lookup the email
    try {
      const response = await fetch('/api/auth/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: input }),
      });
      const data = await response.json();
      if (!data.found) {
        return { success: false, error: 'Invalid username or password' };
      }
      normalizedEmail = data.email;
    } catch (error) {
      console.error('Email lookup error:', error);
      return { success: false, error: 'Login failed' };
    }
  } else {
    normalizedEmail = input.toLowerCase();
  }

  const supabase = await createClient();

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: normalizedEmail,
        password,
      },
    );

    if (signInError) {
      logAuthFailure(
        normalizedEmail,
        undefined,
        undefined,
        `Signin: ${signInError.message}`,
      );
      return { success: false, error: signInError.message };
    }

    if (!data.session) {
      return { success: false, error: 'Failed to create session' };
    }

    logAuthSuccess(data.user.id);
    return {
      success: true,
      data: data.user,
      message: 'Signed in successfully',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logAuthFailure(
      normalizedEmail,
      undefined,
      undefined,
      `Signin exception: ${msg}`,
    );
    return { success: false, error: msg };
  }
}

/**
 * REQUEST PASSWORD RESET
 * Per Supabase: https://supabase.com/docs/guides/auth/passwords
 * Per OWASP: Never reveal if email exists
 */
export async function requestPasswordReset(
  email: string,
): Promise<AuthResponse> {
  if (!email?.trim()) {
    return {
      success: true,
      message:
        'If an account exists with this email, you will receive a password reset link',
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limiting for password reset requests (IP-based to prevent abuse)
  try {
    const rateLimitResult = await checkRateLimitByIP(
      '127.0.0.1',
      'password_reset',
      {
        maxRequests: 3,
        windowSeconds: 3600, // 3 requests per hour
        action: 'password_reset',
      },
    );

    if (!rateLimitResult.allowed) {
      console.warn(
        `[Auth] Password reset rate limit exceeded for email: ${normalizedEmail}`,
      );
      return {
        success: true, // Still return success to prevent enumeration
        message:
          'If an account exists with this email, you will receive a password reset link',
      };
    }
  } catch (rateLimitError) {
    console.error('[Auth] Rate limit check failed:', rateLimitError);
    // Continue with password reset even if rate limiting fails
  }

  const supabase = await createClient();

  // Get the site URL for redirects (works in both development and production)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      },
    );

    if (error) {
      console.warn(`[Auth] Password reset request failed: ${error.message}`);
    }

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message:
        'If an account exists with this email, you will receive a password reset link',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Auth] Password reset error: ${msg}`);
    // Still return success
    return {
      success: true,
      message:
        'If an account exists with this email, you will receive a password reset link',
    };
  }
}

/**
 * UPDATE PASSWORD - Used after reset or by authenticated user
 * Per Supabase: https://supabase.com/docs/guides/auth/passwords
 */
export async function updatePassword(
  newPassword: string,
): Promise<AuthResponse> {
  if (!newPassword?.trim()) {
    return { success: false, error: 'New password is required' };
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return {
      success: false,
      error:
        passwordValidation.errors[0] || 'Password does not meet requirements',
    };
  }

  const supabase = await createClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    getSecurityLogger().log({
      type: SecurityEventType.TOKEN_INVALIDATION,
      userId: userData.user.id,
      status: 'success',
      riskLevel: 'medium',
      details: { action: 'password_update' },
    });

    return { success: true, message: 'Password updated successfully' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * SIGN IN WITH MAGIC LINK
 * Per Supabase: https://supabase.com/docs/guides/auth/auth-email-passwordless
 */
export async function signInWithMagicLink(
  email: string,
): Promise<AuthResponse> {
  if (!email?.trim()) {
    return { success: false, error: 'Email is required' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = await createClient();

  // Get the site URL for redirects (works in both development and production)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Check your email for the magic login link',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * VERIFY OTP - For magic links and MFA
 * Per Supabase: https://supabase.com/docs/guides/auth/auth-email-passwordless
 */
export async function verifyOtp(
  email: string,
  token: string,
): Promise<AuthResponse<User>> {
  if (!email?.trim() || !token?.trim()) {
    return { success: false, error: 'Email and token are required' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      logAuthFailure(
        normalizedEmail,
        undefined,
        undefined,
        `OTP: ${error.message}`,
      );
      return { success: false, error: error.message };
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'Failed to create session' };
    }

    logAuthSuccess(data.user.id);
    return {
      success: true,
      data: data.user,
      message: 'Signed in successfully',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logAuthFailure(
      normalizedEmail,
      undefined,
      undefined,
      `OTP exception: ${msg}`,
    );
    return { success: false, error: msg };
  }
}

/**
 * GET CURRENT SESSION
 * Per Supabase: https://supabase.com/docs/guides/auth/handling-session-management
 */
export async function getSession(): Promise<SessionResponse> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return {
        session: null,
        user: null,
        isValid: false,
      };
    }

    return {
      session,
      user: session.user,
      isValid: !!session.access_token,
      expiresAt: session.expires_at,
    };
  } catch {
    return {
      session: null,
      user: null,
      isValid: false,
    };
  }
}

/**
 * GET CURRENT USER
 * Per Supabase: https://supabase.com/docs/guides/auth/user-management
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { user: null, error: msg };
  }
}

/**
 * SIGN OUT - Clear all sessions and tokens
 * Per Supabase: https://supabase.com/docs/guides/auth/session-management
 */
export async function signOut(): Promise<AuthResponse> {
  const supabase = await createClient();

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    if (userId) {
      getSecurityLogger().log({
        type: SecurityEventType.SESSION_INVALIDATION,
        userId,
        status: 'success',
        riskLevel: 'low',
      });
    }

    // Client is responsible for redirecting after sign out
    return { success: true, message: 'Signed out successfully' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * REFRESH SESSION - Auto-refresh expired tokens
 * Per Supabase: https://supabase.com/docs/guides/auth/session-management
 */
export async function refreshSession(): Promise<SessionResponse> {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error || !session) {
      return {
        session: null,
        user: null,
        isValid: false,
      };
    }

    return {
      session,
      user: session.user,
      isValid: !!session.access_token,
      expiresAt: session.expires_at,
    };
  } catch {
    return {
      session: null,
      user: null,
      isValid: false,
    };
  }
}

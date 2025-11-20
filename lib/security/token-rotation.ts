/**
 * Token Rotation and Refresh Utility
 * Implements automatic JWT refresh with rotation to prevent token hijacking
 * Reference: https://tools.ietf.org/html/rfc6749#section-6
 */

import { createClient } from '@/lib/supabase/server';
import { Session, User } from '@supabase/supabase-js';

export interface TokenRotationConfig {
  refreshThreshold: number; // Milliseconds before expiry to refresh
  maxTokenAge: number; // Maximum age of a token before forced refresh
  rotationInterval: number; // How often to rotate tokens
}

const DEFAULT_CONFIG: TokenRotationConfig = {
  refreshThreshold: 5 * 60 * 1000, // Refresh 5 minutes before expiry
  maxTokenAge: 60 * 60 * 1000, // Max 1 hour
  rotationInterval: 30 * 60 * 1000, // Rotate every 30 minutes
};

/**
 * Get current session and user
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user || null;
}

/**
 * Check if token needs refresh
 */
export function shouldRefreshToken(
  session: Session,
  config: TokenRotationConfig = DEFAULT_CONFIG
): boolean {
  if (!session?.expires_at) {
    return true;
  }

  const expiryTime = session.expires_at * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;

  return timeUntilExpiry < config.refreshThreshold;
}

/**
 * Refresh session and rotate tokens
 */
export async function refreshSessionToken(): Promise<{ success: boolean; session: Session | null; error?: string }> {
  const supabase = await createClient();

  try {
    const {
      data: { session: refreshedSession },
      error,
    } = await supabase.auth.refreshSession();

    if (error || !refreshedSession) {
      console.error('Token refresh failed:', error?.message);
      return {
        success: false,
        session: null,
        error: error?.message || 'Failed to refresh session',
      };
    }

    // Log token rotation for audit purposes
    console.info('[Security] Token refreshed and rotated', {
      userId: refreshedSession.user?.id,
      timestamp: new Date().toISOString(),
      oldExpiry: new Date((refreshedSession.expires_at || 0) * 1000),
    });

    return {
      success: true,
      session: refreshedSession,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Security] Token refresh error:', errorMessage);
    return {
      success: false,
      session: null,
      error: errorMessage,
    };
  }
}

/**
 * Validate token expiry and auto-refresh if needed
 */
export async function ensureValidToken(
  config: TokenRotationConfig = DEFAULT_CONFIG
): Promise<{ valid: boolean; session: Session | null }> {
  const session = await getSession();

  if (!session) {
    return { valid: false, session: null };
  }

  if (shouldRefreshToken(session, config)) {
    const result = await refreshSessionToken();
    return { valid: result.success, session: result.session };
  }

  return { valid: true, session };
}

/**
 * Get token with automatic refresh if needed
 */
export async function getValidToken(
  config: TokenRotationConfig = DEFAULT_CONFIG
): Promise<string | null> {
  const { valid, session } = await ensureValidToken(config);

  if (!valid || !session?.access_token) {
    return null;
  }

  return session.access_token;
}

/**
 * Sign out and clear all tokens
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error.message);
      return { success: false, error: error.message };
    }

    console.info('[Security] User signed out and tokens cleared', {
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Security] Sign out error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Export config for use in hooks
 */
export { DEFAULT_CONFIG as TOKEN_ROTATION_CONFIG };

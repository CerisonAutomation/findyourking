/**
 * UNIFIED AUTH CONTEXT - SINGLE SOURCE OF TRUTH FOR CLIENT STATE
 * 
 * CRITICAL ARCHITECTURE CHANGE:
 * - BEFORE: Context fetched session on mount (duplicate refresh point with middleware)
 * - AFTER: Context ONLY subscribes to auth state changes (middleware handles refresh)
 * 
 * This eliminates race conditions and ensures consistent session state.
 * Per Supabase SSR Guide: https://supabase.com/docs/guides/auth/server-side-rendering
 * 
 * ARCHITECTURE:
 * 1. User loads page
 * 2. Middleware runs (lib/supabase/middleware.ts) → refreshes token via getClaims()
 * 3. Client loads with AuthProvider → subscribes to changes only
 * 4. If token refreshed, listener fires → updates UI
 * 5. If user signs out/in → listener fires → updates UI
 * 
 * RESULT: Single source of truth for session (middleware), context is state listener only
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  sessionExpiresIn: number | null; // minutes until expiry
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  /**
   * Sign out the current user
   */
  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        // Even if sign out fails, clear local state
        console.warn('[AuthContext] Sign out error, clearing local state:', error);
      }

      // Always clear local state regardless of API response
      setUser(null);
      setSession(null);
      setSessionExpiresAt(null);
      setError(null);

      // Navigate to auth page
      router.push('/auth');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign out';
      setError(msg);
      console.error('[AuthContext] Sign out error:', err);

      // Still clear state even on error
      setUser(null);
      setSession(null);
      setSessionExpiresAt(null);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  /**
   * Check if session is expired and sign out if needed
   */
  const checkSessionExpiry = useCallback(async () => {
    if (sessionExpiresAt && Date.now() >= sessionExpiresAt * 1000) {
      console.log('[AuthContext] Session expired, signing out...');
      await handleSignOut();
    }
  }, [sessionExpiresAt, handleSignOut]);

  /**
   * Initialize auth state by subscribing to changes.
   *
   * CRITICAL: We do NOT fetch the session here.
   * The middleware (lib/supabase/middleware.ts) handles session refresh on EVERY request.
   * We ONLY subscribe to changes from Supabase auth state.
   *
   * This ensures:
   * - Single source of truth: Middleware is responsible for token refresh
   * - No race conditions: Client never overwrites middleware's session
   * - Consistent state: All updates go through one refresh point
   *
   * Per Supabase docs: https://supabase.com/docs/guides/auth/server-side-rendering
   */
  useEffect(() => {
    let isActive = true;
    let refreshTimer: NodeJS.Timeout | null = null;

    // Subscribe to auth state changes
    // This listener fires when:
    // - User signs in/out
    // - Token is refreshed (by middleware or other)
    // - Session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isActive) return;

        // Update session state
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        setSessionExpiresAt(newSession?.expires_at ?? null);
        setLoading(false);

        // Clear any existing refresh timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }

        // Handle specific events for logging
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] Auth state changed:', event, {
            hasSession: !!newSession,
            expiresAt: newSession?.expires_at,
            userId: newSession?.user?.id
          });
        }

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            // Schedule automatic token refresh 5 minutes before expiry
            if (newSession?.expires_at) {
              const expiresAt = newSession.expires_at * 1000; // Convert to milliseconds
              const refreshAt = expiresAt - (5 * 60 * 1000); // 5 minutes before expiry
              const timeUntilRefresh = refreshAt - Date.now();

              if (timeUntilRefresh > 0) {
                refreshTimer = setTimeout(async () => {
                  if (isActive) {
                    try {
                      console.log('[AuthContext] Auto-refreshing token...');
                      await supabase.auth.refreshSession();
                    } catch (error) {
                      console.error('[AuthContext] Token refresh failed:', error);
                      // Force sign out on refresh failure
                      await supabase.auth.signOut();
                    }
                  }
                }, timeUntilRefresh);
              }
            }
            setError(null);
            break;

          case 'SIGNED_OUT':
            setError(null);
            // Clear refresh timer on sign out
            if (refreshTimer) {
              clearTimeout(refreshTimer);
              refreshTimer = null;
            }
            break;

          default:
            break;
        }
      }
    );

    return () => {
      isActive = false;
      subscription?.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [supabase]);

  /**
   * Periodic session expiry check
   * Runs every minute to ensure expired sessions are cleaned up
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [checkSessionExpiry]);

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      console.log('[AuthContext] Session refreshed manually');
    } catch (error) {
      console.error('[AuthContext] Session refresh failed:', error);
      throw error;
    }
  }, [supabase]);

  /**
   * Clear error messages
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculate minutes until session expiry
  const sessionExpiresIn = sessionExpiresAt
    ? Math.max(0, Math.floor((sessionExpiresAt * 1000 - Date.now()) / (1000 * 60)))
    : null;

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut: handleSignOut,
    clearError,
    refreshSession,
    isAuthenticated: !!user && !!session,
    sessionExpiresAt,
    sessionExpiresIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

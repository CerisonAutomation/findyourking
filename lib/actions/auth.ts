"use server";

/**
 * LEGACY AUTH WRAPPER - Delegates to unified-auth.ts
 * 
 * This file maintains backward compatibility while routing all auth
 * operations through the centralized, audited unified-auth module.
 * 
 * All new auth logic should be added to lib/auth/unified-auth.ts
 * This file should eventually be removed (after UI migration).
 */

import {
  signUp as unifiedSignUp,
  signIn as unifiedSignIn,
  requestPasswordReset as unifiedRequestPasswordReset,
  updatePassword as unifiedUpdatePassword,
  signInWithMagicLink as unifiedSignInWithMagicLink,
  verifyOtp as unifiedVerifyOtp,
  signOut as unifiedSignOut,
  getCurrentUser as unifiedGetCurrentUser,
  validatePassword,
} from '@/lib/auth/unified-auth';

// =====================================================
// LEGACY WRAPPERS - Backward compatibility
// =====================================================

/**
 * @deprecated Use signUp from lib/auth/unified-auth.ts instead
 */
export async function signUpWithPassword(
  email: string,
  password: string
) {
  const response = await unifiedSignUp(email, password, {
    role: 'authenticated',
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  if (response.requiresConfirmation) {
    return {
      success: true,
      data: response.data,
      requiresConfirmation: true,
      message: response.message,
    };
  }

  return {
    success: true,
    data: response.data,
    message: response.message,
  };
}

/**
 * @deprecated Use signIn from lib/auth/unified-auth.ts instead
 */
export async function signInWithPassword(email: string, password: string) {
  const response = await unifiedSignIn(email, password);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  return {
    success: true,
    data: response.data,
    message: response.message,
  };
}

/**
 * @deprecated Use requestPasswordReset from lib/auth/unified-auth.ts instead
 */
export async function requestPasswordReset(email: string) {
  return await unifiedRequestPasswordReset(email);
}

/**
 * @deprecated Use updatePassword from lib/auth/unified-auth.ts instead
 */
export async function updatePassword(newPassword: string) {
  return await unifiedUpdatePassword(newPassword);
}

/**
 * @deprecated Use signInWithMagicLink from lib/auth/unified-auth.ts instead
 */
export async function signInWithMagicLink(email: string) {
  return await unifiedSignInWithMagicLink(email);
}

/**
 * @deprecated Use verifyOtp from lib/auth/unified-auth.ts instead
 */
export async function verifyOtp(email: string, token: string) {
  const response = await unifiedVerifyOtp(email, token);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  return {
    success: true,
    data: response.data,
    message: response.message,
  };
}

/**
 * @deprecated Use signOut from lib/auth/unified-auth.ts instead
 */
export async function signOut() {
  try {
    await unifiedSignOut();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to sign out';
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * @deprecated Use getCurrentUser from lib/auth/unified-auth.ts instead
 */
export async function getCurrentUser() {
  return await unifiedGetCurrentUser();
}

// Re-export utilities
export { validatePassword };

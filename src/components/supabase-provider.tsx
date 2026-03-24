'use client';

/**
 * This file is intentionally minimal.
 * Auth state is managed by UserProvider in hooks/use-user.tsx.
 * SupabaseProvider is kept as a re-export shim for any legacy imports.
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** @deprecated Use useUser() from hooks/use-user instead */
export function SupabaseListener({ serverAccessToken: _ }: { serverAccessToken?: string }) {
  return null;
}

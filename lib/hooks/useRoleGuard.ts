'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export type UserRole = 'seeker' | 'provider' | 'admin' | 'king';

export function useRoleGuard(allowedRoles: UserRole[], redirectTo = '/dashboard') {
  const { user, loading } = useAuth();
  const router = useRouter();

  const userRole = (user?.user_metadata?.role as UserRole) || 'seeker';
  const hasAccess = allowedRoles.includes(userRole);

  useEffect(() => {
    if (!loading && user && !hasAccess) {
      router.push(redirectTo);
    }
  }, [user, loading, hasAccess, router, redirectTo]);

  return {
    user,
    userRole,
    hasAccess,
    loading,
    isAuthenticated: !!user,
  };
}

export function useRoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = (user.user_metadata?.role as UserRole) || 'seeker';
      router.push(`/dashboard/@${role}`);
    }
  }, [user, loading, router]);

  return { loading };
}
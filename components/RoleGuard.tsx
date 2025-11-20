'use client';

import { useAuth } from '@/contexts/auth-context';
import { isExtendedUser } from '@/lib/types';
import { ReactNode } from 'react';
import Link from 'next/link';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuth();

  // Get role from user metadata with type-safe access
  // Per Supabase Auth docs: https://supabase.com/docs/guides/auth/managing-user-data
  const userRole = isExtendedUser(user) ? user.user_metadata.role || 'seeker' : 'seeker';

  if (!allowedRoles.includes(userRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white max-w-md">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            This page is only for {allowedRoles.join(' or ')} users.
          </p>
          <Link href="/dashboard" className="text-pink-500 hover:text-pink-400 font-medium">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

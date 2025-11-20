'use client';

import { ReactNode } from 'react';
import { useRoleGuard, UserRole } from '@/lib/hooks/useRoleGuard';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

interface RoleLayoutProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  title: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export function RoleLayout({
  children,
  allowedRoles,
  title,
  description,
  showBackButton = true,
  backHref = '/dashboard'
}: RoleLayoutProps) {
  const { hasAccess, loading, userRole } = useRoleGuard(allowedRoles);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white max-w-md">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            This page is only for {allowedRoles.join(' or ')} users. Your current role is {userRole}.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-400 font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {showBackButton && (
          <div className="mb-6">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{title}</h1>
          {description && (
            <p className="text-gray-400 text-lg">{description}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Dashboard Layout with Parallel Routes
 * Per Next.js 15 docs: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes
 * 
 * Parallel routes allow simultaneous rendering of multiple pages in the same layout.
 * Used here for role-based dashboard rendering with modal support.
 */

interface DashboardLayoutProps {
  children: ReactNode;
  seeker: ReactNode;
  provider: ReactNode;
  admin: ReactNode;
  king: ReactNode;
  modal: ReactNode;
}

export default async function DashboardLayout({
  children,
  seeker,
  provider,
  admin,
  king,
  modal,
}: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get role from profiles table (single source of truth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();

  // Determine role from user metadata or profile
  const userMetadata = user.user_metadata as { role?: string } | undefined;
  const userRole = userMetadata?.role || 'seeker';

  // Render appropriate slot based on role
  let roleContent: ReactNode;
  
  switch (userRole) {
    case 'admin':
      roleContent = admin;
      break;
    case 'provider':
      roleContent = provider;
      break;
    case 'king':
      roleContent = king;
      break;
    case 'seeker':
    default:
      roleContent = seeker;
  }

  return (
    <>
      {roleContent}
      {modal}
    </>
  );
}
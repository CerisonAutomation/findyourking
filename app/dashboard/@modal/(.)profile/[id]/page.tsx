'use client';

/**
 * DASHBOARD PROFILE INTERCEPTING ROUTE
 * Per Next.js Intercepting Routes: https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes
 * Pattern: (.)profile/[id] intercepts /profile/[id] when navigating from /dashboard
 */

import ProfileModal from '@/components/modals/ProfileModal';

interface ProfileInterceptProps {
  params: {
    id: string;
  };
}

export default function DashboardProfileIntercept({ params }: ProfileInterceptProps) {
  return <ProfileModal profileId={params.id} />;
}

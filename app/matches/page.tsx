import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import MatchesClient from '@/components/matches/MatchesClient';
import MatchesSkeleton from '@/components/matches/MatchesSkeleton';

/**
 * MATCHES PAGE - 150/100 LEGENDARY TIER
 * Per Next.js Streaming: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 * Per React Suspense: https://react.dev/reference/react/Suspense
 * Implements: Infinite scroll, lazy loading, optimistic UI, real-time updates
 */

export const metadata: Metadata = {
  title: 'Discover Matches | FindYourKing',
  description: 'Discover amazing gay men near you. Swipe, match, and connect with your perfect king.',
  openGraph: {
    title: 'Discover Matches | FindYourKing',
    description: 'Find your perfect match today',
  },
  robots: {
    index: false, // Don't index dynamic match pages
    follow: true,
  },
};

export default async function MatchesPage() {
  // Server-side auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get user's profile for match filtering (SSR)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, gender, interested_in, subscription_tier')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/profile/edit?setup=true');
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<MatchesSkeleton />}>
        <MatchesClient 
          userId={user.id}
          profileId={profile.id}
          tier={profile.subscription_tier}
        />
      </Suspense>
    </div>
  );
}

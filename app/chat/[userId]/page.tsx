import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChatContainer } from '@/app/features/chat/components';
import ChatConversationSkeleton from '@/components/chat/ChatConversationSkeleton';

/**
 * CHAT CONVERSATION PAGE - 150/100 ZENITH LEGENDARY TIER
 * Per Next.js App Router: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
 * Per Supabase Auth: https://supabase.com/docs/guides/auth/server-side
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime
 * 
 * Features: Real-time chat with photos, albums, voice, geolocation, GIFs, reactions, games
 */

export const metadata: Metadata = {
  title: 'Chat | FindYourKing',
  description: 'Private conversation with your match',
  robots: { index: false, follow: false },
};

interface ChatConversationPageProps {
  params: {
    userId: string;
  };
}

export default async function ChatConversationPage({ params }: ChatConversationPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const { userId } = params;

  // CRITICAL: Verify match exists and is active before allowing chat
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, status, is_ai')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
    .eq('status', 'active')
    .single();

  if (matchError || !match) {
    notFound();
  }

  // Get other user's profile with RLS security
  const { data: otherUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, username, avatar_url, is_online, last_seen, latitude, longitude')
    .eq('user_id', userId)
    .single();

  if (profileError || !otherUserProfile) {
    notFound();
  }

  // Calculate distance if both users have geolocation
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('latitude, longitude')
    .eq('user_id', user.id)
    .single();

  let distance: number | undefined;
  if (
    currentProfile?.latitude &&
    currentProfile?.longitude &&
    otherUserProfile.latitude &&
    otherUserProfile.longitude
  ) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth radius in km
    const dLat = ((otherUserProfile.latitude - currentProfile.latitude) * Math.PI) / 180;
    const dLon = ((otherUserProfile.longitude - currentProfile.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentProfile.latitude * Math.PI) / 180) *
        Math.cos((otherUserProfile.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance = Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  return (
    <div className="h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<ChatConversationSkeleton />}>
        <ChatContainer
          matchId={match.id}
          currentUserId={user.id}
          otherUser={{
            id: otherUserProfile.user_id,
            name: otherUserProfile.full_name || otherUserProfile.username || 'User',
            avatar_url: otherUserProfile.avatar_url,
            is_online: otherUserProfile.is_online || false,
            last_seen: otherUserProfile.last_seen,
            distance,
          }}
        />
      </Suspense>
    </div>
  );
}



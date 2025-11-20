import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import ChatListClient from '@/components/chat/ChatListClient';
import ChatListSkeleton from '@/components/chat/ChatListSkeleton';

/**
 * CHAT LIST PAGE - 150/100 LEGENDARY TIER
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime
 * Features: Real-time updates, unread counts, search, infinite scroll
 */

export const metadata: Metadata = {
  title: 'Messages | FindYourKing',
  description: 'View your conversations and connect with your matches in real-time.',
  robots: { index: false, follow: false },
};

interface ChatWithUser {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
  };
}

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  // Fetch initial chat conversations with unread counts (SSR)
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id,
      user1_id,
      user2_id,
      matched_at,
      messages!inner(
        content,
        created_at,
        is_read,
        from_user_id
      )
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq('status', 'active')
    .order('matched_at', { ascending: false })
    .limit(20);

  // Transform data for client
  const chats: ChatWithUser[] = await Promise.all(
    (matches || []).map(async (match) => {
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      
      // Get other user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, is_online')
        .eq('user_id', otherUserId)
        .single();

      // Get last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Count unread messages
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .eq('to_user_id', user.id)
        .eq('is_read', false);

      return {
        id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        last_message: lastMessage?.content,
        last_message_at: lastMessage?.created_at,
        unread_count: unreadCount || 0,
        other_user: profile || {
          id: otherUserId,
          full_name: 'Unknown',
          avatar_url: null,
          is_online: false,
        },
      };
    })
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<ChatListSkeleton />}>
        <ChatListClient initialChats={chats} userId={user.id} />
      </Suspense>
    </div>
  );
}

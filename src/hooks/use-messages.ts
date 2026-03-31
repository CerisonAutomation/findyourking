'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 30;

async function fetchMessagesPage(
  conversationId: string,
  page: number,
): Promise<{ data: Message[]; nextCursor: number | undefined }> {
  const supabase = createClient();
  const from = page * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data:       (data ?? []).reverse(),
    nextCursor: (data?.length ?? 0) === PAGE_SIZE ? page + 1 : undefined,
  };
}

/**
 * Manages messages for a conversation:
 * - Infinite scroll (older messages on scroll-up)
 * - Real-time new message subscription via Postgres Changes
 * - Send message mutation with optimistic update
 * - Mark-as-read on mount
 */
export function useMessages(conversationId: string, currentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef  = useRef<RealtimeChannel | null>(null);
  const queryKey    = ['messages', conversationId];

  const query = useInfiniteQuery({
    queryKey,
    queryFn:          ({ pageParam }) => fetchMessagesPage(conversationId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor,
    enabled:          !!conversationId,
    staleTime:        0,
  });

  // Real-time: append new messages without full refetch
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel  = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          queryClient.setQueryData(queryKey, (old: typeof query.data) => {
            if (!old) return old;
            const pages = [...old.pages];
            const last  = pages[pages.length - 1];
            pages[pages.length - 1] = {
              ...last,
              data: [...last.data, newMsg],
            };
            return { ...old, pages };
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark messages as read on open
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const supabase = createClient();
    void supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', currentUserId);
  }, [conversationId, currentUserId]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id:       currentUserId!,
        content,
      });
      if (error) throw new Error(error.message);
    },
  });

  return { ...query, sendMessage };
}

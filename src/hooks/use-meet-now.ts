'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { MeetNowCard } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

async function fetchMeetNowPage(page: number): Promise<{
  data: MeetNowCard[];
  nextCursor: number | undefined;
}> {
  const supabase = createClient();
  const from = page * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('meet_now_cards')
    .select('*')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data:       data ?? [],
    nextCursor: (data?.length ?? 0) === PAGE_SIZE ? page + 1 : undefined,
  };
}

/**
 * Fetches active meet-now cards with infinite scroll.
 * Subscribes to Postgres Changes for real-time inserts/deletes.
 */
export function useMeetNow() {
  const queryClient  = useQueryClient();
  const channelRef   = useRef<RealtimeChannel | null>(null);

  const query = useInfiniteQuery({
    queryKey:        ['meet-now'],
    queryFn:         ({ pageParam }) => fetchMeetNowPage(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor,
    staleTime:       30_000,
  });

  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel('meet-now-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meet_now_cards' },
        () => { void queryClient.invalidateQueries({ queryKey: ['meet-now'] }); },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meet_now_cards' },
        () => { void queryClient.invalidateQueries({ queryKey: ['meet-now'] }); },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'meet_now_cards' },
        () => { void queryClient.invalidateQueries({ queryKey: ['meet-now'] }); },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [queryClient]);

  return query;
}

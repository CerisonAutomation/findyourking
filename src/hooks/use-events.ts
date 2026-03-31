'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { EventWithMeta, EventFilters } from '@/lib/types';

const PAGE_SIZE = 20;

async function fetchEventsPage(
  filters: EventFilters,
  page: number,
): Promise<{ data: EventWithMeta[]; nextCursor: number | undefined }> {
  const supabase = createClient();
  const from     = page * PAGE_SIZE;
  const to       = from + PAGE_SIZE - 1;

  let query = supabase
    .from('events')
    .select(`
      *,
      host:profiles!events_host_id_fkey(user_id, display_name, avatar_url, is_verified),
      rsvp_count:event_rsvps(count)
    `)
    .eq('is_public', true)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .range(from, to);

  if (filters.categories.length > 0) {
    query = query.in('category', filters.categories);
  }
  if (filters.dateFrom) {
    query = query.gte('start_at', filters.dateFrom.toISOString());
  }
  if (filters.dateTo) {
    query = query.lte('start_at', filters.dateTo.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return {
    data:       (data ?? []) as unknown as EventWithMeta[],
    nextCursor: (data?.length ?? 0) === PAGE_SIZE ? page + 1 : undefined,
  };
}

export function useEvents(filters: EventFilters) {
  return useInfiniteQuery({
    queryKey:         ['events', filters],
    queryFn:          ({ pageParam }) => fetchEventsPage(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor,
    staleTime:        60_000,
  });
}

export function useRsvp(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'going' | 'maybe' | 'declined' }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          { event_id: eventId, user_id: userId, status },
          { onConflict: 'event_id,user_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

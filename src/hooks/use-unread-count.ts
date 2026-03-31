'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Returns the count of unread messages for the current user.
 * Subscribes to Postgres Changes so the badge updates in real-time
 * without polling.
 */
export function useUnreadCount(userId: string | undefined): number {
  const [count, setCount]   = useState(0);
  const queryClient         = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    async function fetchCount() {
      const { count: c } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId!);
      setCount(c ?? 0);
    }

    void fetchCount();

    const channel = supabase
      .channel(`unread:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => { void fetchCount(); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return count;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to Supabase Realtime Presence on `global_presence` channel.
 * Tracks the current user and returns a Set of all online user IDs.
 * Cleans up channel on unmount to prevent memory leaks.
 */
export function usePresence(currentUserId: string | undefined): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const channel  = supabase.channel('global_presence', {
      config: { presence: { key: currentUserId } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids   = new Set(
          Object.values(state)
            .flat()
            .map((p) => p.user_id)
            .filter(Boolean),
        );
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentUserId]);

  return onlineIds;
}

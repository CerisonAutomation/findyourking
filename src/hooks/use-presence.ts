'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to Supabase Realtime presence and returns a Set of online user IDs.
 * Only mounts when a current user ID is provided.
 */
export function usePresence(currentUserId: string | undefined): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const channel = supabase.channel('global_presence', {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set(
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

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  return onlineIds;
}

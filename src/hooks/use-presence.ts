import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

/**
 * Tracks real-time online presence for a given user.
 * Subscribes to the global presence channel and self-tracks.
 * Returns a Set of online user IDs.
 */
export function usePresence(userId: string | undefined): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel('presence:global', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set(
          Object.values(state)
            .flat()
            .map((p) => p.user_id),
        );
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineIds;
}

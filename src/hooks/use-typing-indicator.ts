'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const TYPING_THROTTLE_MS = 2_000;
const TYPING_EXPIRE_MS   = 3_500;

/**
 * Broadcasts and listens for typing presence on a conversation channel.
 * Returns:
 *  - isTyping: boolean — true if the OTHER user is currently typing
 *  - broadcastTyping: () => void — call on every keystroke
 */
export function useTypingIndicator(
  conversationId: string | null,
  myUserId:        string | undefined,
) {
  const [isTyping, setIsTyping] = useState(false);
  const channelRef              = useRef<RealtimeChannel | null>(null);
  const lastBroadcastRef        = useRef(0);
  const expireTimerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || !myUserId) return;
    const supabase = createClient();
    const channel  = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: { userId: string } }) => {
        if (payload.userId === myUserId) return;
        setIsTyping(true);
        if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
        expireTimerRef.current = setTimeout(() => setIsTyping(false), TYPING_EXPIRE_MS);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, myUserId]);

  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastBroadcastRef.current < TYPING_THROTTLE_MS) return;
    lastBroadcastRef.current = now;
    void channelRef.current?.send({
      type:    'broadcast',
      event:   'typing',
      payload: { userId: myUserId },
    });
  }, [myUserId]);

  return { isTyping, broadcastTyping };
}

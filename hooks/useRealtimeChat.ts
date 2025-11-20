'use client';

/**
 * ENHANCED REALTIME CHAT HOOK
 * Based on @supabase/realtime-js best practices
 *
 * Features:
 * - Connection state management
 * - Automatic reconnection with exponential backoff
 * - Offline message queue
 * - Presence tracking
 * - Typing indicators
 * - Read receipts
 * - Error recovery
 *
 * Per Supabase Realtime docs: https://supabase.com/docs/guides/realtime/postgres-changes
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { realtimeConnectionManager, type ConnectionState, type ChannelState } from '@/lib/realtime/connection-manager';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  match_id?: string;
  content: string;
  attachment_url?: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: number;
}

interface UseRealtimeChatOptions {
  matchId?: string;
  userId?: string;
  currentUserId?: string;
  limit?: number;
  enablePresence?: boolean;
  enableTypingIndicators?: boolean;
}

export function useRealtimeChat({
  matchId,
  userId,
  currentUserId,
  limit = 50,
  enablePresence = true,
  enableTypingIndicators = true,
}: UseRealtimeChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [channelState, setChannelState] = useState<ChannelState>('closed');
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelName = `chat:${matchId || userId}`;

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          ...(matchId && { matchId }),
          ...(userId && { userId }),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/chat/messages?${params}`);
        const data = await response.json();

        if (response.ok) {
          setMessages(data.messages.reverse()); // Oldest first for display
        } else {
          setError(data.error || 'Failed to load messages');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load messages';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    if (matchId || userId) {
      loadMessages();
    }
  }, [matchId, userId, limit]);

  // Setup realtime subscription with connection manager
  useEffect(() => {
    if (!matchId && !userId) return;

    let mounted = true;

    async function setupChannel() {
      try {
        // Subscribe to connection state changes
        const unsubscribeState = realtimeConnectionManager.onStateChange((state) => {
          if (mounted) setConnectionState(state);
        });

        // Subscribe to channel state changes
        const unsubscribeChannelState = realtimeConnectionManager.onChannelStateChange(
          channelName,
          (state) => {
            if (mounted) setChannelState(state);
          }
        );

        // Get or create channel using connection manager
        const channel = await realtimeConnectionManager.getChannel(channelName, {
          config: {
            broadcast: { self: false, ack: false },
            presence: enablePresence ? { key: currentUserId || '' } : undefined,
          },
        });

        if (!channel || !mounted) {
          return;
        }

        channelRef.current = channel;

        // Subscribe to new messages (INSERT)
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: matchId ? `match_id=eq.${matchId}` : `to_user_id=eq.${userId}`,
          },
          (payload) => {
            if (!mounted) return;

            const newMessage = payload.new as Message;
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Mark as read if not from current user
            if (newMessage.from_user_id !== currentUserId && currentUserId) {
              markMessageAsRead(newMessage.id);
            }
          }
        );

        // Subscribe to message updates (read receipts, reactions)
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: matchId ? `match_id=eq.${matchId}` : `to_user_id=eq.${userId}`,
          },
          (payload) => {
            if (!mounted) return;

            const updatedMessage = payload.new as Message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          }
        );

        // Subscribe to typing indicators via presence
        if (enableTypingIndicators && enablePresence) {
          channel.on('presence', { event: 'sync' }, () => {
            if (!mounted) return;

            const state = channel.presenceState();
            const typing: TypingIndicator[] = [];

            Object.values(state).forEach((presences: any) => {
              presences.forEach((presence: any) => {
                if (presence.typing && presence.userId !== currentUserId) {
                  typing.push({
                    userId: presence.userId,
                    userName: presence.userName || 'User',
                    isTyping: presence.typing,
                    timestamp: Date.now(),
                  });
                }
              });
            });

            setTypingUsers(typing);
          });
        }

        // Cleanup function
        return () => {
          mounted = false;
          unsubscribeState();
          unsubscribeChannelState();
        };
      } catch (err) {
        if (mounted) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to setup channel';
          setError(errorMsg);
          setConnectionState('error');
        }
      }
    }

    setupChannel();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [matchId, userId, currentUserId, enablePresence, enableTypingIndicators, channelName]);

  // Mark a single message as read
  const markMessageAsRead = useCallback(
    async (messageId: string) => {
      const supabase = createClient();

      try {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', messageId);
      } catch (err) {
        console.error('Failed to mark message as read:', err);
      }
    },
    []
  );

  // Mark multiple messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    const supabase = createClient();

    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', messageIds);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id)
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, []);

  // Send message with queue support
  const sendMessage = useCallback(
    async (content: string, toUserId: string) => {
      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            toUserId,
            content,
            messageType: 'text',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Clear typing indicator
        if (channelRef.current && currentUserId) {
          await channelRef.current.track({
            userId: currentUserId,
            typing: false,
          });
          setIsTyping(false);
        }

        return { success: true, message: data.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        return { success: false, error: message };
      }
    },
    [matchId, currentUserId]
  );

  // Update typing indicator
  const updateTypingStatus = useCallback(
    async (typing: boolean, userName?: string) => {
      if (!channelRef.current || !currentUserId || !enableTypingIndicators) return;

      try {
        await channelRef.current.track({
          userId: currentUserId,
          userName: userName || 'User',
          typing,
        });

        setIsTyping(typing);

        // Auto-clear typing after 3 seconds
        if (typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            if (channelRef.current && currentUserId) {
              channelRef.current.track({
                userId: currentUserId,
                typing: false,
              });
              setIsTyping(false);
            }
          }, 3000);
        }
      } catch (err) {
        console.error('Failed to update typing status:', err);
      }
    },
    [currentUserId, enableTypingIndicators]
  );

  // Retry connection
  const retryConnection = useCallback(async () => {
    if (!matchId && !userId) return;

    setError(null);
    await realtimeConnectionManager.removeChannel(channelName);

    // Channel will be recreated by the effect
  }, [matchId, userId, channelName]);

  return {
    messages,
    loading,
    error,
    connectionState,
    channelState,
    typingUsers,
    isTyping,
    sendMessage,
    markAsRead,
    updateTypingStatus,
    retryConnection,
    isConnected: connectionState === 'connected',
    pendingMessageCount: realtimeConnectionManager.getPendingMessageCount(channelName),
  };
}

'use client';

/**
 * CHAT HOOK - COMPLETE CHAT LOGIC
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime
 * Per React Hooks: https://react.dev/reference/react/hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ChatMessage, ChatUser, TypingUser } from '../types';

interface UseChatOptions {
  matchId: string;
  currentUserId: string;
  otherUser: ChatUser;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  typingUsers: TypingUser[];
  sendMessage: (content: string, attachments?: any) => Promise<void>;
  sendTypingIndicator: () => void;
  markAsRead: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
}

export function useChat({
  matchId,
  currentUserId,
  otherUser,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [matchId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;

      setMessages(data || []);

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter((m) => m.to_user_id === currentUserId && !m.is_read)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup realtime subscription with broadcast
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${matchId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: currentUserId },
        },
      })
      // Listen for broadcast events from database triggers
      .on('broadcast', { event: 'messages' }, (payload) => {
        const { type, record } = payload.payload;

        if (type === 'INSERT') {
          const newMsg = record as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Auto-mark as read if from other user
          if (newMsg.from_user_id !== currentUserId) {
            markAsRead(newMsg.id);
          }
        } else if (type === 'UPDATE') {
          const updated = record as ChatMessage;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updated.id ? updated : msg)),
          );
        } else if (type === 'DELETE') {
          setMessages((prev) => prev.filter((msg) => msg.id !== record.id));
        }
      })
      // Typing indicators via broadcast
      .on('broadcast', { event: 'typing_indicators' }, (payload) => {
        const { type, record } = payload.payload;

        if (type === 'INSERT' || type === 'UPDATE') {
          if (record.is_typing && record.user_id !== currentUserId) {
            setTypingUsers((prev) => {
              const existing = prev.find((t) => t.userId === record.user_id);
              if (existing) {
                return prev.map((t) =>
                  t.userId === record.user_id
                    ? { ...t, timestamp: Date.now() }
                    : t,
                );
              } else {
                return [
                  ...prev,
                  {
                    userId: record.user_id,
                    userName: otherUser.name,
                    timestamp: Date.now(),
                  },
                ];
              }
            });
          } else {
            // Remove typing indicator
            setTypingUsers((prev) =>
              prev.filter((t) => t.userId !== record.user_id),
            );
          }
        }
      })
      // Location shares
      .on('broadcast', { event: 'location_shares' }, (payload) => {
        const { type, record } = payload.payload;

        if (type === 'INSERT') {
          // Handle location share notification
          console.log('Location shared:', record);
          // Could trigger a notification or UI update
        }
      })
      // Voice messages
      .on('broadcast', { event: 'voice_messages' }, (payload) => {
        const { type, record } = payload.payload;

        if (type === 'INSERT') {
          // Update message with voice metadata
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === record.message_id
                ? {
                    ...msg,
                    attachment_metadata: {
                      ...msg.attachment_metadata,
                      ...record,
                    },
                  }
                : msg,
            ),
          );
        }
      })
      // Message reactions
      .on('broadcast', { event: 'message_reactions' }, (payload) => {
        const { record } = payload.payload;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === record.id
              ? { ...msg, reactions: record.reactions }
              : msg,
          ),
        );
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          channel.track({
            userId: currentUserId,
            userName: 'You',
            online: true,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [matchId, currentUserId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachments?: any) => {
      try {
        const messageData: any = {
          match_id: matchId,
          from_user_id: currentUserId,
          to_user_id: otherUser.id,
          content: content || '',
        };

        if (attachments) {
          messageData.attachment_type = attachments.type;
          messageData.attachment_urls = attachments.urls;
          messageData.attachment_metadata = attachments.metadata || {};
          if (attachments.locationData) {
            messageData.location_data = attachments.locationData;
            messageData.message_type = 'location';
          }
          if (attachments.expires_at) {
            messageData.expires_at = attachments.expires_at;
          }
        }

        const { error: insertError } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Clear typing indicator via database (broadcast trigger will handle realtime)
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('match_id', matchId)
          .eq('user_id', currentUserId);
      } catch (err) {
        console.error('Failed to send message:', err);
        throw err;
      }
    },
    [matchId, currentUserId, otherUser.id, supabase],
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    try {
      // Insert/update typing indicator in database
      const { error } = await supabase.from('typing_indicators').upsert({
        match_id: matchId,
        user_id: currentUserId,
        is_typing: true,
        last_updated: new Date().toISOString(),
      });

      if (error) throw error;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await supabase
            .from('typing_indicators')
            .delete()
            .eq('match_id', matchId)
            .eq('user_id', currentUserId);
        } catch (err) {
          console.error('Failed to clear typing indicator:', err);
        }
      }, 3000);
    } catch (err) {
      console.error('Failed to send typing indicator:', err);
    }
  }, [matchId, currentUserId, supabase]);

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', messageId)
          .eq('to_user_id', currentUserId);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    [currentUserId, supabase],
  );

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const message = messages.find((m) => m.id === messageId);
        if (!message) return;

        const reactions = message.reactions || {};
        const userIds = reactions[emoji] || [];

        if (!userIds.includes(currentUserId)) {
          userIds.push(currentUserId);
          reactions[emoji] = userIds;

          await supabase
            .from('messages')
            .update({ reactions })
            .eq('id', messageId);
        }
      } catch (err) {
        console.error('Failed to add reaction:', err);
      }
    },
    [messages, currentUserId, supabase],
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)
          .eq('from_user_id', currentUserId);
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    },
    [currentUserId, supabase],
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      try {
        await supabase
          .from('messages')
          .update({
            content: newContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', messageId)
          .eq('from_user_id', currentUserId);
      } catch (err) {
        console.error('Failed to edit message:', err);
      }
    },
    [currentUserId, supabase],
  );

  return {
    messages,
    isLoading,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    addReaction,
    deleteMessage,
    editMessage,
  };
}

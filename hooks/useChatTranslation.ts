'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Locale } from '@/i18n';
import { 
  translateMessages, 
  ChatMessage as ChatMessageType,
  TranslationResult 
} from '@/lib/services/chat-translation.service';

interface UseChatTranslationOptions {
  matchId?: string;
  otherUserId?: string;
  autoTranslate?: boolean;
}

export function useChatTranslation({
  matchId,
  otherUserId,
  autoTranslate = true,
}: UseChatTranslationOptions) {
  const locale = useLocale() as Locale;
  const supabase = createClient();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [translations, setTranslations] = useState<Map<string, TranslationResult>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (matchId) {
        query = query.eq('match_id', matchId);
      } else if (otherUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
                      .or(`from_user_id.eq.${otherUserId},to_user_id.eq.${otherUserId}`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const chatMessages: ChatMessageType[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        language: msg.language as Locale | undefined,
        timestamp: new Date(msg.created_at),
        userId: msg.from_user_id,
      }));

      setMessages(chatMessages);

      if (autoTranslate) {
        const translationMap = await translateMessages(chatMessages, locale);
        setTranslations(translationMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, otherUserId, locale, autoTranslate, supabase]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${matchId || otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: matchId ? `match_id=eq.${matchId}` : undefined,
        },
        async (payload) => {
          const newMessage: ChatMessageType = {
            id: payload.new.id,
            content: payload.new.content,
            language: payload.new.language as Locale | undefined,
            timestamp: new Date(payload.new.created_at),
            userId: payload.new.from_user_id,
          };

          setMessages(prev => [...prev, newMessage]);

          if (autoTranslate && newMessage.language !== locale) {
            const translationMap = await translateMessages([newMessage], locale);
            setTranslations(prev => new Map([...prev, ...translationMap]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, otherUserId, locale, autoTranslate, fetchMessages, supabase]);

  const sendMessage = async (content: string, language: Locale = locale) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          language,
          from_user_id: user.id,
          to_user_id: otherUserId,
          match_id: matchId,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  return {
    messages,
    translations,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}

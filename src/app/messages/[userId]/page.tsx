'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, Paperclip, Send, Loader2, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { UserProfile, Message } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function fetchInitialMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => transformToCamel<Message>(row));
}

async function fetchOrCreateConversation(
  myId: string,
  otherId: string,
): Promise<string> {
  const supabase = createClient();
  // Look for existing
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_one.eq.${myId},participant_two.eq.${otherId}),` +
      `and(participant_one.eq.${otherId},participant_two.eq.${myId})`,
    )
    .single();
  if (data?.id) return data.id;
  // Create new
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_one: myId, participant_two: otherId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return created.id;
}

async function fetchOtherUser(otherUserUid: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', otherUserUid)
    .single();
  return data ? transformToCamel<UserProfile>(data) : null;
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherUserUid } = use(params);
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Resolve or create conversation
  useEffect(() => {
    if (!user?.id || !otherUserUid) return;
    fetchOrCreateConversation(user.id, otherUserUid)
      .then(setConversationId)
      .catch(() => toast.error('Could not open conversation'));
  }, [user?.id, otherUserUid]);

  const { data: otherUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ['chatUser', otherUserUid],
    queryFn: () => fetchOtherUser(otherUserUid),
    enabled: !!otherUserUid,
  });

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchInitialMessages(conversationId!),
    enabled: !!conversationId,
  });

  // Realtime subscription — Postgres changes (more reliable than broadcast for persistence)
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = transformToCamel<Message>(payload.new as Record<string, unknown>);
          queryClient.setQueryData(['messages', conversationId], (old: Message[]) =>
            old ? [...old, newMsg] : [newMsg],
          );
        },
      )
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, supabase, queryClient]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || !user || !conversationId) return;
    setIsSending(true);
    setNewMessage('');
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    } catch {
      toast.error('Failed to send message');
      setNewMessage(content); // restore
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [newMessage, user, conversationId, supabase]);

  const displayName = otherUser?.displayName ?? otherUser?.id?.slice(0, 8) ?? '...';
  const initials = displayName.charAt(0).toUpperCase();

  if (!user || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin size-8 text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Crown className="size-10 opacity-30" />
        <p className="font-semibold">King not found</p>
        <Link href="/messages"><Button variant="outline"><ArrowLeft className="mr-2 size-4" />Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 p-3 border-b shrink-0 bg-card/80 backdrop-blur">
        <Link href="/messages" className="md:hidden" aria-label="Back to messages">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <Avatar className="size-9">
          <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{otherUser.role ?? 'king'}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="More options"><MoreVertical /></Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
        {isMessagesLoading ? (
          <div className="flex justify-center pt-10"><Loader2 className="animate-spin size-6 text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Crown className="size-10 opacity-20" />
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : ''}`}>
                {!isMine && (
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${isMine ? 'text-right' : ''}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.createdAt ? formatDistanceToNowStrict(new Date(msg.createdAt as string)) + ' ago' : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <footer className="p-3 border-t bg-card/80 backdrop-blur shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSendMessage(); }}
          className="flex items-center gap-2"
          aria-label="Send message"
        >
          <Button variant="ghost" size="icon" type="button" aria-label="Attach file" disabled>
            <Paperclip className="size-4 text-muted-foreground" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Your message…"
            className="flex-1 h-10"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); } }}
            aria-label="Message input"
            maxLength={2000}
            autoFocus
          />
          <Button
            size="icon" className="h-10 w-10 shrink-0" type="submit"
            disabled={isSending || !newMessage.trim() || !conversationId}
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}

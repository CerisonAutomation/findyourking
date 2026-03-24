'use client';

import { use, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, Paperclip, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { UserProfile, Message } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient, transformToCamel } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function fetchInitialMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)  // ✅ snake_case
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching messages', error);
    return [];
  }
  return (data ?? []).map((row) => transformToCamel<Message>(row));
}

async function fetchOtherUser(otherUserUid: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', otherUserUid)           // ✅ snake_case
    .single();
  if (error) {
    console.error('Failed to fetch other user profile', error);
    return null;
  }
  return data ? transformToCamel<UserProfile>(data) : null;
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  // Next.js 15: params is a Promise
  const { userId: otherUserUid } = use(params);
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Deterministic conversation ID — same for both participants
  const conversationId = user ? [user.id, otherUserUid].sort().join('_') : null;

  const { data: otherUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ['chatUser', otherUserUid],
    queryFn: () => fetchOtherUser(otherUserUid),
    enabled: !!otherUserUid,
  });

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchInitialMessages(conversationId!),
    enabled: !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`chat:${conversationId}`);
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        queryClient.setQueryData(
          ['messages', conversationId],
          (old: Message[] | undefined) =>
            old ? [...old, payload.payload as Message] : [payload.payload as Message]
        );
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user, supabase, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !channelRef.current || !conversationId) return;
    setIsSending(true);

    const messagePayload = {
      sender_id: user.id,                     // ✅ snake_case
      content: newMessage.trim(),
      conversation_id: conversationId,         // ✅ snake_case
    };

    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(messagePayload)
        .select()
        .single();
      if (error) throw error;

      const finalMessage = transformToCamel<Message>(data);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: finalMessage,
      });
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!user || isProfileLoading || isMessagesLoading) {
    return (
      <div className="flex items-center justify-center h-full" aria-live="polite" aria-label="Loading chat">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <p className="text-lg font-semibold">User not found</p>
        <Link href="/messages">
          <Button variant="outline"><ArrowLeft className="mr-2 size-4" />Back to Messages</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-3 border-b shrink-0 bg-card md:bg-transparent">
        <Link href="/messages" className="md:hidden" aria-label="Back to messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <Avatar>
          <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={otherUser.id ?? ''} />
          <AvatarFallback>{(otherUser.id ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-bold text-lg">{otherUser.id}</h2>
        </div>
        <Button variant="ghost" size="icon" aria-label="More options">
          <MoreVertical />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" role="log" aria-live="polite" aria-label="Messages">
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${
              msg.senderId === user.id ? 'justify-end' : ''
            }`}
          >
            {msg.senderId !== user.id && (
              <Avatar className="size-8">
                <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={otherUser.id ?? ''} />
                <AvatarFallback>{(otherUser.id ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-xs md:max-w-md ${msg.senderId === user.id ? 'text-right' : ''}`}>
              <div
                className={`p-3 rounded-lg ${
                  msg.senderId === user.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 px-1">
                {formatDistanceToNowStrict(new Date(msg.createdAt))} ago
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-3 border-t bg-card md:bg-background shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="relative"
        >
          <Input
            placeholder="Your message..."
            className="pr-24"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            aria-label="Message input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" type="button" aria-label="Attach file">
              <Paperclip className="size-5 text-muted-foreground" />
            </Button>
            <Button
              size="icon"
              className="bg-accent hover:bg-accent/90"
              type="submit"
              disabled={isSending || !newMessage.trim()}
              aria-label="Send message"
            >
              {isSending ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
}

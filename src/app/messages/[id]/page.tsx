'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, Paperclip, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { UserProfile, Message } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function fetchInitialMessages(conversationId: string): Promise<Message[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('created_at', { ascending: true });
    if (error) {
        console.error("Error fetching messages", error);
        return [];
    }
    return data as Message[];
}

async function fetchOtherUser(otherUserUID: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('userId', otherUserUID)
        .single();
    if (error) {
        console.error('Failed to fetch other user profile', error);
        return null;
    }
    return data as UserProfile;
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const otherUserUID = params.id;
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const conversationId = user ? [user.id, otherUserUID].sort().join('_') : null;

  const { data: otherUser, isLoading: isProfileLoading } = useQuery({
      queryKey: ['chatUser', otherUserUID],
      queryFn: () => fetchOtherUser(otherUserUID),
      enabled: !!otherUserUID,
  });

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => fetchInitialMessages(conversationId!),
      enabled: !!conversationId,
  });
  
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`chat:${conversationId}`);

    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
            return oldData ? [...oldData, payload.payload as Message] : [payload.payload as Message];
        });
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
    if (newMessage.trim() === '' || !user || !channelRef.current || !conversationId) return;
    
    setIsSending(true);
    
    const messagePayload = {
      sender_id: user.id,
      content: newMessage.trim(),
      conversationId: conversationId,
    };
    
    setNewMessage('');
    
    try {
      const { data, error } = await supabase.from('messages').insert(messagePayload).select().single();
      if(error) throw error;
      const finalMessage = data as Message;

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
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  if (!otherUser) {
    return <div className="p-6 flex items-center justify-center h-full">User not found.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-3 border-b shrink-0 bg-card md:bg-transparent">
        <Link href="/messages" className="md:hidden">
            <Button variant="ghost" size="icon">
                <ArrowLeft />
            </Button>
        </Link>
        <Avatar>
          <AvatarImage src={otherUser.avatarUrl ?? undefined} />
          <AvatarFallback>{otherUser.id.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-bold text-lg">{otherUser.id}</h2>
          {/* Typing indicator would go here */}
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages?.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_id === user.id ? 'justify-end' : ''}`}>
                {msg.sender_id !== user.id && (
                    <Avatar className="size-8">
                        <AvatarImage src={otherUser.avatarUrl ?? undefined} />
                        <AvatarFallback>{otherUser.id.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                <div className={`max-w-xs md:max-w-md ${msg.sender_id === user.id ? 'text-right' : ''}`}>
                    <div className={`p-3 rounded-lg ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none'}`}>
                        <p className="text-sm">{msg.content}</p>
                    </div>
                     <p className="text-xs text-muted-foreground mt-1 px-1">
                      {formatDistanceToNowStrict(new Date(msg.created_at))} ago
                    </p>
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <footer className="p-3 border-t bg-card md:bg-background shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
          <Input 
            placeholder="Your message..." 
            className="pr-24"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" type='button'>
              <Paperclip className="size-5 text-muted-foreground" />
            </Button>
            <Button size="icon" className='bg-accent hover:bg-accent/90' type="submit" disabled={isSending}>
              {isSending ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
}

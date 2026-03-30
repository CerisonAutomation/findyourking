'use client';

import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/use-user';
import type { UserProfile } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

type EnrichedConversation = {
  id: string;
  otherUser: UserProfile;
  lastMessage: { content: string; created_at: string };
  isOnline?: boolean;
};

async function fetchConversations(userId?: string): Promise<EnrichedConversation[]> {
  if (!userId) return [];
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_conversations_with_details', {
    p_user_id: userId,
  });
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  return (data as Array<{
    conversation_id: string;
    other_user_id: string;
    other_user_display_name: string;
    other_user_avatar_url: string | null;
    last_message_content: string | null;
    last_message_at: string | null;
  }>).map((c) => ({
    id: c.conversation_id,
    otherUser: {
      userId: c.other_user_id,
      id: c.other_user_display_name,
      avatarUrl: c.other_user_avatar_url,
    } as UserProfile,
    lastMessage: {
      content: c.last_message_content ?? 'Tap to start chatting...',
      created_at: c.last_message_at ?? new Date(0).toISOString(),
    },
  }));
}

function ConversationList() {
  const { user } = useUser();
  const pathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, unknown>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user?.id),
    enabled: !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase.channel('presence:global');

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-2">
      {conversations
        ?.sort(
          (a, b) =>
            new Date(b.lastMessage.created_at).getTime() -
            new Date(a.lastMessage.created_at).getTime(),
        )
        .map((convo) => {
          if (!convo.otherUser.userId) return null;
          const isActive = pathname.includes(convo.otherUser.userId);
          const isOnline = !!onlineUsers[convo.otherUser.userId];

          return (
            <Link
              key={convo.id}
              href={`/messages/${convo.otherUser.userId}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors',
                isActive && 'bg-muted',
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={convo.otherUser.avatarUrl ?? undefined}
                    alt={convo.otherUser.id ?? ''}
                  />
                  <AvatarFallback>
                    {(convo.otherUser.id ?? 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold truncate">{convo.otherUser.id}</h3>
                  {convo.lastMessage?.created_at && (
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNowStrict(new Date(convo.lastMessage.created_at))} ago
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {convo.lastMessage?.content}
                </p>
              </div>
            </Link>
          );
        })}
    </div>
  );
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = /^\/messages\/.+$/.test(pathname);

  return (
    <div
      className={cn(
        'h-full grid',
        isChatPage ? 'grid-cols-1 md:grid-cols-[300px_1fr]' : 'md:grid-cols-[300px_1fr]',
      )}
    >
      <aside
        className={cn('h-full md:flex flex-col border-r', isChatPage ? 'hidden' : 'flex')}
      >
        <div className="p-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input placeholder="Search messages..." className="pl-9" />
          </div>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <ConversationList />
        </ScrollArea>
      </aside>
      <main className={cn('bg-background', !isChatPage && 'hidden md:block')}>
        {children}
      </main>
    </div>
  );
}

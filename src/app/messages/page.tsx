'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { createClient, transformToCamel } from '@/lib/supabase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MessageSquarePlus, Search, Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';

interface RpcConversationRow {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  unread_count: number;
}

interface Conversation {
  id: string;
  otherUser: Pick<UserProfile, 'userId' | 'id' | 'avatarUrl'>;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
}

async function fetchConversations(userId: string): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_user_conversations', {
    p_user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as RpcConversationRow[]).map((c) => ({
    id: c.conversation_id,
    otherUser: {
      userId: c.other_user_id,
      id: c.other_user_name,
      avatarUrl: c.other_user_avatar,
    },
    lastMessage: c.last_message_content
      ? { content: c.last_message_content, createdAt: c.last_message_created_at! }
      : null,
    unreadCount: c.unread_count ?? 0,
  }));
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-1 px-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-10 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function MessagesPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [search, setSearch] = useState('');

  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
    onError: (err: Error) => toast.error('Could not load conversations', { description: err.message }),
  } as Parameters<typeof useQuery>[0]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      c.otherUser.id?.toLowerCase().includes(q) ||
      c.lastMessage?.content.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (isUserLoading || isLoading) return <ConversationListSkeleton />;

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Chats</h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search conversations…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search conversations"
          />
        </div>
      </header>

      {error ? (
        <div className="flex-1 flex items-center justify-center text-destructive text-sm p-8">
          Failed to load conversations. Pull to refresh.
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 p-8"
          role="status"
          aria-label="No conversations"
        >
          <MessageSquarePlus className="size-16 opacity-40" />
          <h2 className="text-xl font-semibold">
            {search ? 'No results found' : 'No Conversations Yet'}
          </h2>
          <p className="max-w-xs text-sm">
            {search
              ? 'Try a different name or message.'
              : 'Your conversations will appear here. Start a chat from a profile.'}
          </p>
        </div>
      ) : (
        <nav
          className="flex-1 overflow-y-auto"
          aria-label="Conversation list"
        >
          <ul role="list">
            {filtered.map((convo) => (
              <li key={convo.id}>
                <Link
                  href={`/messages/${convo.otherUser.userId}`}
                  aria-label={`Chat with ${convo.otherUser.id}${
                    convo.unreadCount > 0 ? `, ${convo.unreadCount} unread` : ''
                  }`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors',
                    convo.unreadCount > 0 && 'bg-primary/5'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={convo.otherUser.avatarUrl ?? undefined}
                        alt={convo.otherUser.id ?? ''}
                      />
                      <AvatarFallback>
                        {(convo.otherUser.id ?? 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online dot — statically rendered; presence is handled via Realtime in chat view */}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3
                        className={cn(
                          'truncate text-sm',
                          convo.unreadCount > 0 ? 'font-bold' : 'font-medium'
                        )}
                      >
                        {convo.otherUser.id}
                      </h3>
                      {convo.lastMessage && (
                        <time className="text-xs text-muted-foreground whitespace-nowrap ml-2 shrink-0">
                          {formatDistanceToNowStrict(
                            new Date(convo.lastMessage.createdAt),
                            { addSuffix: false }
                          )}
                        </time>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm truncate',
                          convo.unreadCount > 0
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {convo.lastMessage?.content ?? 'No messages yet'}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

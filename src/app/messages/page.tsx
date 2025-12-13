'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquarePlus, Users } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface Conversation {
  id: string;
  otherUser: UserProfile;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
}

function ConversationListSkeleton() {
    return (
      <div className="space-y-2 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-2 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

export default function MessagesPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setIsLoading(true);

      // Use RPC call to get conversation list for the user
      const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        
        const convos = data.map((c: any) => ({
            id: c.conversation_id,
            otherUser: {
                userId: c.other_user_id,
                id: c.other_user_name, // Assuming the rpc returns the username as id
                avatarUrl: c.other_user_avatar
            },
            lastMessage: c.last_message_content ? {
                content: c.last_message_content,
                createdAt: c.last_message_created_at
            } : null
        }))
        setConversations(convos as Conversation[]);
      }
      setIsLoading(false);
    };

    fetchConversations();
  }, [user]);

  if (isLoading || isUserLoading) {
    return <ConversationListSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
        <header className="p-4 border-b">
            <h1 className="text-2xl font-bold">Chats</h1>
        </header>
        
      {conversations.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 p-8">
            <MessageSquarePlus className="size-16" />
            <h2 className="text-xl font-semibold">No Conversations Yet</h2>
            <p className="max-w-xs">
                Your conversations will appear here. Start a new chat from a user's profile.
            </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <Link href={`/messages/${convo.otherUser.userId}`} key={convo.id} className="block hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={convo.otherUser.avatarUrl || undefined} />
                  <AvatarFallback>{convo.otherUser.id?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold truncate">{convo.otherUser.id}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {convo.lastMessage?.content ?? 'No messages yet'}
                  </p>
                </div>
                {convo.lastMessage && 
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </time>
                }
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

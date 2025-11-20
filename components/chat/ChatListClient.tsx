'use client';

/**
 * CHAT LIST CLIENT - 150/100 WITH REALTIME
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime/postgres-changes
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Search, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ChatWithUser {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
  };
}

interface ChatListClientProps {
  initialChats: ChatWithUser[];
  userId: string;
}

export default function ChatListClient({ initialChats, userId }: ChatListClientProps) {
  const [chats, setChats] = useState<ChatWithUser[]>(initialChats);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Real-time subscription for new messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Update chat list when new message arrives
          const newMessage = payload.new as any;
          
          setChats((prev) => {
            const updated = prev.map((chat) => {
              if (chat.id === newMessage.match_id) {
                return {
                  ...chat,
                  last_message: newMessage.content,
                  last_message_at: newMessage.created_at,
                  unread_count: newMessage.to_user_id === userId 
                    ? chat.unread_count + 1 
                    : chat.unread_count,
                };
              }
              return chat;
            });

            // Sort by most recent
            return updated.sort((a, b) => {
              const aTime = new Date(a.last_message_at || 0).getTime();
              const bTime = new Date(b.last_message_at || 0).getTime();
              return bTime - aTime;
            });
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) =>
      chat.other_user.full_name?.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (chats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No conversations yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start swiping to find matches and begin conversations!
          </p>
          <Link
            href="/matches"
            className="inline-block bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:from-pink-600 hover:to-red-600 transition-all"
          >
            Start Swiping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </p>
      </header>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {filteredChats.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No conversations found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.other_user.id}`}
                className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src={chat.other_user.avatar_url || '/default-avatar.png'}
                    alt={chat.other_user.full_name || 'User'}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {chat.other_user.is_online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  )}
                  {chat.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {chat.unread_count > 9 ? '9+' : chat.unread_count}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 ml-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {chat.other_user.full_name || 'Unknown'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatTime(chat.last_message_at)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${
                    chat.unread_count > 0 
                      ? 'text-gray-900 dark:text-white font-semibold' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {chat.last_message || 'Start your conversation!'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PHOTO & ALBUM SHARING ENHANCEMENT
 * Per Supabase Storage: https://supabase.com/docs/guides/storage
 */

interface MessageAttachment {
  type: 'image' | 'album';
  urls: string[];
  thumbnail?: string;
}

// Add to ChatWithUser interface
interface EnhancedChatWithUser extends ChatWithUser {
  last_attachment?: MessageAttachment;
  has_shared_album?: boolean;
}

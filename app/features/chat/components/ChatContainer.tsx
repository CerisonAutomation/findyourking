'use client';

/**
 * CHAT CONTAINER - MAIN CHAT COMPONENT
 * Per Radix UI: https://www.radix-ui.com/primitives/docs/overview/introduction
 * Per shadcn/ui: https://ui.shadcn.com/docs
 */

import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import type { ChatUser } from '../types';
import { Loader2 } from 'lucide-react';

interface ChatContainerProps {
  matchId: string;
  currentUserId: string;
  otherUser: ChatUser;
}

export function ChatContainer({ matchId, currentUserId, otherUser }: ChatContainerProps) {
  const {
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
  } = useChat({ matchId, currentUserId, otherUser });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500">Failed to load chat: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <ChatHeader user={otherUser} />

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onAddReaction={addReaction}
        onDeleteMessage={deleteMessage}
        onEditMessage={editMessage}
      />

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 pb-2">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={sendTypingIndicator}
        matchId={matchId}
        currentUserId={currentUserId}
      />
    </div>
  );
}

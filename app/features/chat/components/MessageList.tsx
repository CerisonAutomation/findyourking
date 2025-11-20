'use client';

/**
 * MESSAGE LIST - SCROLLABLE MESSAGE DISPLAY
 * Per React: https://react.dev/reference/react-dom/components
 */

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
}

export function MessageList({
  messages,
  currentUserId,
  onAddReaction,
  onDeleteMessage,
  onEditMessage,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showHeader = !prevMessage || prevMessage.from_user_id !== message.from_user_id;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.from_user_id === currentUserId}
            showHeader={showHeader}
            onAddReaction={onAddReaction}
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

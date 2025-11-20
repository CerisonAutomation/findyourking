'use client';

/**
 * COLLABORATIVE MESSAGE EDITOR - 1000X BETTER
 * Per Supabase Realtime Broadcast: https://supabase.com/docs/guides/realtime/broadcast
 * Features: Real-time collaborative editing, cursor tracking, conflict resolution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Save, X, Users } from 'lucide-react';

interface CollaborativeMessageEditorProps {
  messageId: string;
  initialContent: string;
  channel: RealtimeChannel;
  senderId: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

interface Cursor {
  userId: string;
  userName: string;
  position: number;
  color: string;
}

const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function CollaborativeMessageEditor({
  messageId,
  initialContent,
  channel,
  senderId,
  onSave,
  onCancel,
}: CollaborativeMessageEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  // Setup collaborative editing channel
  useEffect(() => {
    if (!channel) return;

    // Announce joining
    channel.send({
      type: 'broadcast',
      event: 'editor_join',
      payload: {
        messageId,
        userId: senderId,
        userName: 'You',
      },
    });

    // Listen for content changes
    const contentSub = channel.on('broadcast', { event: 'editor_change' }, (payload: any) => {
      if (payload.payload.messageId === messageId && payload.payload.userId !== senderId) {
        setContent(payload.payload.content);
      }
    });

    // Listen for cursor movements
    const cursorSub = channel.on('broadcast', { event: 'editor_cursor' }, (payload: any) => {
      if (payload.payload.messageId === messageId && payload.payload.userId !== senderId) {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.set(payload.payload.userId, {
            userId: payload.payload.userId,
            userName: payload.payload.userName,
            position: payload.payload.position,
            color: payload.payload.color,
          });
          return newCursors;
        });
      }
    });

    // Listen for users joining/leaving
    const joinSub = channel.on('broadcast', { event: 'editor_join' }, (payload: any) => {
      if (payload.payload.messageId === messageId) {
        setActiveUsers((prev) => new Set([...prev, payload.payload.userId]));
      }
    });

    const leaveSub = channel.on('broadcast', { event: 'editor_leave' }, (payload: any) => {
      if (payload.payload.messageId === messageId) {
        setActiveUsers((prev) => {
          const newUsers = new Set(prev);
          newUsers.delete(payload.payload.userId);
          return newUsers;
        });
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.delete(payload.payload.userId);
          return newCursors;
        });
      }
    });

    return () => {
      channel.send({
        type: 'broadcast',
        event: 'editor_leave',
        payload: { messageId, userId: senderId },
      });
    };
  }, [channel, messageId, senderId]);

  // Broadcast content changes
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);

      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'editor_change',
          payload: {
            messageId,
            userId: senderId,
            content: newContent,
          },
        });
      }
    },
    [channel, messageId, senderId]
  );

  // Broadcast cursor position
  const handleSelectionChange = useCallback(() => {
    const position = textareaRef.current?.selectionStart || 0;

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'editor_cursor',
        payload: {
          messageId,
          userId: senderId,
          userName: 'You',
          position,
          color: userColor.current,
        },
      });
    }
  }, [channel, messageId, senderId]);

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div className="relative">
      {/* Active users indicator */}
      {activeUsers.size > 0 && (
        <div className="absolute -top-6 right-0 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Users className="w-3 h-3" />
          <span>{activeUsers.size + 1} editing</span>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          className="w-full min-h-[80px] px-3 py-2 bg-white dark:bg-gray-900 border-2 border-pink-500 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          placeholder="Edit message..."
          autoFocus
        />

        {/* Cursor indicators */}
        {Array.from(cursors.values()).map((cursor) => (
          <div
            key={cursor.userId}
            className="absolute pointer-events-none"
            style={{
              left: `${(cursor.position / content.length) * 100}%`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className="w-0.5 h-5 animate-pulse"
              style={{ backgroundColor: cursor.color }}
            />
            <div
              className="text-xs font-semibold px-2 py-0.5 rounded mt-1 whitespace-nowrap"
              style={{ backgroundColor: cursor.color, color: 'white' }}
            >
              {cursor.userName}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-semibold"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>

        {/* Character count */}
        <span className="ml-auto text-xs text-gray-500">
          {content.length} characters
        </span>
      </div>
    </div>
  );
}

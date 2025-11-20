'use client';

/**
 * MESSAGE BUBBLE - INDIVIDUAL MESSAGE DISPLAY
 * Per shadcn/ui: https://ui.shadcn.com/docs/components
 */

import { useState } from 'react';
import Image from 'next/image';
import { Check, CheckCheck, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import type { ChatMessage } from '../types';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showHeader: boolean;
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

export function MessageBubble({
  message,
  isOwn,
  showHeader,
  onAddReaction,
  onDelete,
  onEdit,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isExpired = message.expires_at && new Date(message.expires_at) < new Date();

  const handleSaveEdit = async () => {
    if (editContent.trim() !== message.content) {
      await onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Timestamp */}
        {showHeader && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}

        {/* Message Content */}
        <div className="relative group">
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
          >
            {/* Voice Message */}
            {message.attachment_type === 'voice' && message.attachment_urls?.[0] && (
              <audio controls className="max-w-full">
                <source src={message.attachment_urls[0]} type="audio/webm" />
              </audio>
            )}

            {/* GIF Message */}
            {message.attachment_type === 'gif' && message.attachment_urls?.[0] && (
              <div className="relative w-64 h-48 rounded-lg overflow-hidden">
                <Image
                  src={message.attachment_urls[0]}
                  alt={message.attachment_metadata?.thumbnail_url || 'GIF'}
                  fill
                  className="object-cover"
                  sizes="256px"
                  unoptimized // GIFs need unoptimized for animation
                />
              </div>
            )}

            {/* Location Message */}
            {message.message_type === 'location' && message.location && (
              <div className="space-y-2">
                <div className="relative w-64 h-32 rounded-lg overflow-hidden">
                  <Image
                    src={message.location.static_map_url || '/placeholder-map.png'}
                    alt="Location"
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                </div>
                <div className="text-xs opacity-75">
                  📍 {message.location.place_name || message.location.address || `${message.location.latitude.toFixed(4)}, ${message.location.longitude.toFixed(4)}`}
                </div>
              </div>
            )}

            {/* Image Message */}
            {message.attachment_type === 'image' && message.attachment_urls?.[0] && !isExpired && (
              <div className="relative w-64 h-48 rounded-lg overflow-hidden">
                <Image
                  src={message.attachment_urls[0]}
                  alt="Photo"
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              </div>
            )}

            {/* Expired Photo */}
            {message.attachment_type === 'image' && isExpired && (
              <div className="text-sm opacity-75">📸 Photo expired</div>
            )}

            {/* Text Content */}
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 bg-white/20 rounded border-none focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }}
                    className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              message.content && <p className="text-sm wrap-break-word">{message.content}</p>
            )}

            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(message.reactions).map(([emoji, users]) => (
                  <span
                    key={emoji}
                    className="text-xs bg-white/20 px-2 py-1 rounded-full"
                  >
                    {emoji} {users.length}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-8">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[120px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1"
                  sideOffset={5}
                >
                  {/* React */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none">
                        React
                      </DropdownMenu.Item>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="flex gap-1">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => onAddReaction(message.id, emoji)}
                            className="text-2xl hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Edit (own messages only) */}
                  {isOwn && (
                    <DropdownMenu.Item
                      onSelect={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </DropdownMenu.Item>
                  )}

                  {/* Delete (own messages only) */}
                  {isOwn && (
                    <DropdownMenu.Item
                      onSelect={() => onDelete(message.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Read Receipt */}
        {isOwn && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 px-3">
            {message.is_read ? (
              <CheckCheck className="w-3 h-3 text-blue-500" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

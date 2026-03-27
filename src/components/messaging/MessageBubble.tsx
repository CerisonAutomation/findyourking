'use client';

import React from 'react';
import {cn} from '@/lib/utils';
import {Check, CheckCheck, Smile} from 'lucide-react';

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        type: 'text' | 'image' | 'audio' | 'gif';
        created_at: string;
        is_read: boolean;
        reactions?: { emoji: string; user_id: string }[];
        media_url?: string | null;
    };
    isOwn: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string | null;
    onReactionClick?: () => void;
    className?: string;
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export function MessageBubble({
                                  message,
                                  isOwn,
                                  showAvatar = false,
                                  senderName,
                                  senderAvatar,
                                  onReactionClick,
                                  className,
                              }: MessageBubbleProps) {
    const hasReactions = message.reactions && message.reactions.length > 0;

    return (
        <div
            className={cn(
                'flex gap-2 mb-2',
                isOwn ? 'justify-end' : 'justify-start',
                className
            )}
        >
            {/* Avatar for other user */}
            {!isOwn && (
                <div className="flex-shrink-0 w-8">
                    {showAvatar && (
                        <div
                            className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600">
                            {senderAvatar ? (
                                <img
                                    src={senderAvatar}
                                    alt={senderName || ''}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div
                                    className="flex h-full items-center justify-center text-white text-xs font-semibold">
                                    {senderName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div
                className={cn(
                    'flex flex-col max-w-[75%]',
                    isOwn ? 'items-end' : 'items-start'
                )}
            >
                {/* Sender name */}
                {!isOwn && showAvatar && senderName && (
                    <span className="text-xs text-muted-foreground mb-1 ml-1">{senderName}</span>
                )}

                {/* Message bubble */}
                <div className="relative group">
                    <div
                        className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm break-words',
                            isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md',
                            message.type === 'image' && 'p-1 overflow-hidden'
                        )}
                    >
                        {message.type === 'image' && message.media_url ? (
                            <img
                                src={message.media_url}
                                alt="Shared image"
                                className="rounded-xl max-w-xs max-h-64 object-cover"
                            />
                        ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                    </div>

                    {/* Reaction button */}
                    <button
                        onClick={onReactionClick}
                        className={cn(
                            'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-background border border-border shadow-sm',
                            isOwn ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'
                        )}
                    >
                        <Smile className="h-3.5 w-3.5 text-muted-foreground"/>
                    </button>
                </div>

                {/* Reactions */}
                {hasReactions && (
                    <div className="flex gap-0.5 mt-0.5 ml-1">
                        {message.reactions!.map((reaction, index) => (
                            <span
                                key={`${reaction.emoji}-${index}`}
                                className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs"
                            >
                <span>{reaction.emoji}</span>
              </span>
                        ))}
                    </div>
                )}

                {/* Time and read status */}
                <div
                    className={cn(
                        'flex items-center gap-1 mt-0.5',
                        isOwn ? 'justify-end mr-1' : 'justify-start ml-1'
                    )}
                >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
                    {isOwn && (
                        <span className="text-muted-foreground">
              {message.is_read ? (
                  <CheckCheck className="h-3 w-3 text-blue-500"/>
              ) : (
                  <Check className="h-3 w-3"/>
              )}
            </span>
                    )}
                </div>
            </div>
        </div>
    );
}

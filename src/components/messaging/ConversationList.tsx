'use client';

import React, {useState} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Archive, Check, CheckCheck, Edit, Pin, Search, VolumeX,} from 'lucide-react';
import {cn} from '@/lib/utils';

interface Conversation {
    id: string;
    recipient: {
        id: string;
        display_name: string;
        avatar_url: string | null;
        is_online: boolean;
    };
    last_message: {
        content: string;
        created_at: string;
        sender_id: string;
        is_read: boolean;
    } | null;
    unread_count: number;
    is_pinned: boolean;
    is_muted: boolean;
}

interface ConversationListProps {
    conversations: Conversation[];
    activeConversationId?: string;
    currentUserId: string;
    onSelectConversation: (conversationId: string) => void;
    className?: string;
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', {weekday: 'short'});
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

export function ConversationList({
                                     conversations,
                                     activeConversationId,
                                     currentUserId,
                                     onSelectConversation,
                                     className,
                                 }: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const filteredConversations = conversations.filter((conv) =>
        conv.recipient.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedConversations = [...filteredConversations].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        if (!a.last_message || !b.last_message) return 0;
        return (
            new Date(b.last_message.created_at).getTime() -
            new Date(a.last_message.created_at).getTime()
        );
    });

    return (
        <div className={cn('flex flex-col h-full bg-background', className)}>
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold">Messages</h2>
                    <Button variant="ghost" size="icon">
                        <Edit className="h-5 w-5"/>
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="pl-10 bg-muted/50"
                    />
                </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
                {sortedConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-muted-foreground"/>
                        </div>
                        <h3 className="font-semibold mb-1">No conversations found</h3>
                        <p className="text-sm text-muted-foreground">
                            {searchQuery ? 'Try a different search term' : 'Start chatting with someone new!'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {sortedConversations.map((conversation) => {
                            const isActive = conversation.id === activeConversationId;
                            const isLastMessageFromMe =
                                conversation.last_message?.sender_id === currentUserId;

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    className={cn(
                                        'flex items-center gap-3 w-full p-4 text-left transition-colors hover:bg-accent/50',
                                        isActive && 'bg-accent',
                                        conversation.unread_count > 0 && !isActive && 'bg-primary/5'
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div
                                            className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600">
                                            {conversation.recipient.avatar_url ? (
                                                <img
                                                    src={conversation.recipient.avatar_url}
                                                    alt={conversation.recipient.display_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className="flex h-full items-center justify-center text-white font-semibold">
                                                    {conversation.recipient.display_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {conversation.recipient.is_online && (
                                            <span
                                                className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500"/>
                                        )}
                                        {conversation.is_muted && (
                                            <span
                                                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-background flex items-center justify-center">
                        <VolumeX className="h-2.5 w-2.5 text-muted-foreground"/>
                      </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="flex items-center gap-1.5">
                                                {conversation.is_pinned && (
                                                    <Pin className="h-3 w-3 text-muted-foreground"/>
                                                )}
                                                <span
                                                    className={cn(
                                                        'font-medium truncate',
                                                        conversation.unread_count > 0 && 'font-semibold'
                                                    )}
                                                >
                          {conversation.recipient.display_name}
                        </span>
                                            </div>
                                            {conversation.last_message && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p
                                                className={cn(
                                                    'text-sm truncate',
                                                    conversation.unread_count > 0
                                                        ? 'text-foreground font-medium'
                                                        : 'text-muted-foreground'
                                                )}
                                            >
                                                {isLastMessageFromMe && (
                                                    <span className="mr-1">
                            {conversation.last_message?.is_read ? (
                                <CheckCheck className="inline h-3.5 w-3.5 text-blue-500"/>
                            ) : (
                                <Check className="inline h-3.5 w-3.5 text-muted-foreground"/>
                            )}
                          </span>
                                                )}
                                                {conversation.last_message?.content || 'No messages yet'}
                                            </p>
                                            {conversation.unread_count > 0 && (
                                                <span
                                                    className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Archived button */}
            <div className="p-3 border-t border-border">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => setShowArchived(!showArchived)}
                >
                    <Archive className="h-4 w-4"/>
                    Archived
                </Button>
            </div>
        </div>
    );
}

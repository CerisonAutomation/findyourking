'use client';

import React, {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
    ArrowLeft,
    Flag,
    Image as ImageIcon,
    Mic,
    MoreVertical,
    Paperclip,
    Phone,
    Send,
    Shield,
    Smile,
    Video,
    X,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {MessageBubble} from './MessageBubble';
import {TypingIndicator} from './TypingIndicator';
import {MessageReactions} from './MessageReactions';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'image' | 'audio' | 'gif';
    created_at: string;
    is_read: boolean;
    reactions?: { emoji: string; user_id: string }[];
    media_url?: string | null;
}

interface ChatWindowProps {
    conversationId: string;
    currentUserId: string;
    recipient: {
        id: string;
        display_name: string;
        avatar_url: string | null;
        is_online: boolean;
    };
    messages: Message[];
    isTyping?: boolean;
    onSendMessage: (content: string, type?: string) => void;
    onBack?: () => void;
    className?: string;
}

export function ChatWindow({
                               conversationId,
                               currentUserId,
                               recipient,
                               messages,
                               isTyping = false,
                               onSendMessage,
                               onBack,
                               className,
                           }: ChatWindowProps) {
    const [messageInput, setMessageInput] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages, isTyping]);

    const handleSend = () => {
        const trimmed = messageInput.trim();
        if (!trimmed) return;
        onSendMessage(trimmed, 'text');
        setMessageInput('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn('flex flex-col h-full bg-background', className)}>
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
                )}

                {/* Avatar */}
                <div className="relative">
                    <div
                        className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600">
                        {recipient.avatar_url ? (
                            <img
                                src={recipient.avatar_url}
                                alt={recipient.display_name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-white font-semibold">
                                {recipient.display_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {recipient.is_online && (
                        <span
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"/>
                    )}
                </div>

                {/* Name and status */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{recipient.display_name}</h3>
                    <p
                        className={cn(
                            'text-xs',
                            recipient.is_online ? 'text-green-500' : 'text-muted-foreground'
                        )}
                    >
                        {recipient.is_online ? 'Online' : 'Offline'}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <Phone className="h-5 w-5"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <Video className="h-5 w-5"/>
                    </Button>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowActions(!showActions)}
                        >
                            <MoreVertical className="h-5 w-5"/>
                        </Button>
                        {showActions && (
                            <div
                                className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg z-20">
                                <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                                    <Shield className="h-4 w-4"/>
                                    Safety Tools
                                </button>
                                <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                                    <Flag className="h-4 w-4"/>
                                    Report User
                                </button>
                                <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                                    <X className="h-4 w-4"/>
                                    Block User
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Today
          </span>
                </div>

                {messages.map((message, index) => {
                    const isOwn = message.sender_id === currentUserId;
                    const showAvatar =
                        !isOwn &&
                        (index === 0 || messages[index - 1].sender_id !== message.sender_id);

                    return (
                        <div key={message.id} className="relative group">
                            <MessageBubble
                                message={message}
                                isOwn={isOwn}
                                showAvatar={showAvatar}
                                senderName={isOwn ? undefined : recipient.display_name}
                                senderAvatar={isOwn ? undefined : recipient.avatar_url}
                                onReactionClick={() => setSelectedMessageId(message.id)}
                            />
                        </div>
                    );
                })}

                {isTyping && (
                    <TypingIndicator userName={recipient.display_name}/>
                )}

                <div ref={messagesEndRef}/>
            </div>

            {/* Input area */}
            <div className="border-t border-border p-3 bg-background">
                <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Paperclip className="h-5 w-5"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0 hidden sm:flex">
                        <ImageIcon className="h-5 w-5"/>
                    </Button>

                    <div className="flex-1 relative">
                        <Input
                            ref={inputRef}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="pr-10 min-h-[44px] resize-none"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        >
                            <Smile className="h-4 w-4"/>
                        </Button>
                    </div>

                    {messageInput.trim() ? (
                        <Button size="icon" className="shrink-0" onClick={handleSend}>
                            <Send className="h-4 w-4"/>
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <Mic className="h-5 w-5"/>
                        </Button>
                    )}
                </div>
            </div>

            {/* Reactions picker */}
            {selectedMessageId && (
                <MessageReactions
                    messageId={selectedMessageId}
                    onSelect={(emoji) => {
                        console.log('React with', emoji, 'to', selectedMessageId);
                        setSelectedMessageId(null);
                    }}
                    onClose={() => setSelectedMessageId(null)}
                />
            )}
        </div>
    );
}

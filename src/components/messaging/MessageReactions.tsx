'use client';

import React, {useState} from 'react';
import {cn} from '@/lib/utils';

interface MessageReactionsProps {
    messageId: string;
    onSelect: (emoji: string) => void;
    onClose: () => void;
    className?: string;
}

const quickReactions = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'];

export function MessageReactions({
                                     messageId,
                                     onSelect,
                                     onClose,
                                     className,
                                 }: MessageReactionsProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose}/>

            {/* Reaction picker */}
            <div
                className={cn(
                    'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-popover border border-border shadow-lg p-2 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-200',
                    className
                )}
            >
                {quickReactions.map((emoji, index) => (
                    <button
                        key={emoji}
                        onClick={() => handleSelect(emoji)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onMouseLeave={() => setSelectedIndex(null)}
                        className={cn(
                            'flex items-center justify-center h-10 w-10 rounded-full transition-all duration-150 hover:bg-accent',
                            selectedIndex === index && 'scale-125 bg-accent'
                        )}
                    >
                        <span className="text-xl">{emoji}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

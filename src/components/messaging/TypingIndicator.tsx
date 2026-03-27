'use client';

import React from 'react';
import {cn} from '@/lib/utils';

interface TypingIndicatorProps {
    userName: string;
    className?: string;
}

export function TypingIndicator({userName, className}: TypingIndicatorProps) {
    return (
        <div className={cn('flex items-center gap-2 mb-2', className)}>
            {/* Avatar */}
            <div className="flex-shrink-0 w-8">
                <div
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </span>
                </div>
            </div>

            {/* Typing bubble */}
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
          <span
              className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{animationDelay: '0ms', animationDuration: '1s'}}
          />
                    <span
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{animationDelay: '150ms', animationDuration: '1s'}}
                    />
                    <span
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{animationDelay: '300ms', animationDuration: '1s'}}
                    />
                </div>
            </div>

            {/* Label */}
            <span className="text-xs text-muted-foreground">{userName} is typing...</span>
        </div>
    );
}

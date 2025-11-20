'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  children: ReactNode;
  isUser: boolean;
  timestamp?: string;
  className?: string;
}

export function MessageBubble({
  children,
  isUser,
  timestamp,
  className
}: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        isUser
          ? "bg-pink-500 text-white"
          : "bg-slate-700 text-gray-100",
        className
      )}>
        <div className="text-sm">{children}</div>
        {timestamp && (
          <div className="text-xs opacity-70 mt-1">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}
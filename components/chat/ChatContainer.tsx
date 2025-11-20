'use client';

import { ReactNode, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  children: ReactNode;
  className?: string;
  autoScroll?: boolean;
}

export function ChatContainer({
  children,
  className,
  autoScroll = true
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [children, autoScroll]);

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700",
      className
    )}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
'use client';

import { useState, useCallback } from 'react';

interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

export function useAIChat(boyfriendId: string | null) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!boyfriendId || !content.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/boyfriend/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, boyfriendId }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          aiResponse += chunk;

          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.sender === 'ai' && lastMsg.id === 'streaming') {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: aiResponse },
              ];
            }
            return [
              ...prev,
              {
                id: 'streaming',
                sender: 'ai',
                content: aiResponse,
                created_at: new Date().toISOString(),
              },
            ];
          });
        }
      }
    } catch {
      // Error state updated
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [boyfriendId]);

  const loadMessages = useCallback(async () => {
    // Implementation for loading existing messages
    // This would typically fetch from database
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    loadMessages,
    setMessages,
  };
}
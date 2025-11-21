'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Heart, Settings, Sparkles } from 'lucide-react';
import { ChatContainer, MessageBubble, ChatInput } from '@/components/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function AIBoyfriendPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [boyfriendId, setBoyfriendId] = useState<string | null>(null);
  const [boyfriendName, setBoyfriendName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const loadMessages = useCallback(async (bfId: string) => {
    const supabase = createClient();
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('boyfriend_id', bfId)
      .eq('archived', false)
      .single();

    if (conversations) {
      const { data: msgs } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversations.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (msgs) setMessages(msgs);
    }
  }, []);

  const loadBoyfriend = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push('/auth');
      return;
    }

    // Check if boyfriendId is passed in URL params (from match notification)
    const urlBoyfriendId = searchParams.get('boyfriendId');
    
    if (urlBoyfriendId) {
      // Load specific boyfriend
      const { data: boyfriend, error: bfError } = await supabase
        .from('ai_boyfriends')
        .select('*')
        .eq('id', urlBoyfriendId)
        .single();

      if (!bfError && boyfriend) {
        setBoyfriendId(boyfriend.id);
        setBoyfriendName(boyfriend.name);
        await loadMessages(boyfriend.id);
        return;
      }
    }

    // Otherwise load user's active boyfriend
    const { data: boyfriend, error: bfError } = await supabase
      .from('ai_boyfriends')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .single();

    if (bfError && bfError.code !== 'PGRST116') {
      return;
    }

    if (boyfriend) {
      setBoyfriendId(boyfriend.id);
      setBoyfriendName(boyfriend.name);
      await loadMessages(boyfriend.id);
    } else {
      router.push('/boyfriend/personality');
    }
  }, [router, loadMessages, searchParams]);

  useEffect(() => {
    loadBoyfriend();
  }, [loadBoyfriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(messageText: string) {
    if (!messageText.trim() || !boyfriendId || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/boyfriend/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, boyfriendId }),
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

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant' && lastMsg.id === 'streaming') {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: aiResponse },
              ];
            }
            return [
              ...prev,
              {
                id: 'streaming',
                role: 'assistant',
                content: aiResponse,
                created_at: new Date().toISOString(),
              },
            ];
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Success - boyfriend created
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I had trouble responding. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{boyfriendName}</h1>
            <p className="text-sm text-gray-400">Your AI Boyfriend</p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Link href="/boyfriend/personality">
            <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
          </Link>
        </button>
      </div>

      <ChatContainer className="flex-1 m-6 mb-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-pink-500/50" />
            <p className="text-lg mb-2">
              Start a conversation with {boyfriendName}
            </p>
            <p className="text-sm">
              Your AI boyfriend is here to chat, listen, and support you
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            isUser={msg.role === 'user'}
            timestamp={new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            className={
              msg.role === 'user'
                ? 'bg-linear-to-br from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 backdrop-blur-xl text-white border border-white/10'
            }
          >
            {msg.content}
          </MessageBubble>
        ))}
      </ChatContainer>

      <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
        <ChatInput
          onSendMessage={sendMessage}
          placeholder="Type your message..."
          disabled={loading}
          loading={loading}
        />
      </div>
    </div>
  );
}

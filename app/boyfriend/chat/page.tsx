'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Heart, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  boyfriend_id: string;
  title?: string;
  last_message_at: string;
  total_messages: number;
}

interface Boyfriend {
  id: string;
  name: string;
  avatar_url?: string;
  voice_preference: string;
}

export default function BoyfriendChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [boyfriend, setBoyfriend] = useState<Boyfriend | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user's boyfriend and conversations
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        // Get user's active boyfriend
        const { data: bf, error: bfError } = await supabase
          .from('ai_boyfriends')
          .select('id, name, avatar_url, voice_preference')
          .eq('user_id', user.id)
          .eq('active', true)
          .single();

        if (bfError || !bf) {
          router.push('/boyfriend');
          return;
        }

        setBoyfriend(bf);

        // Get conversations for this boyfriend
        const { data: convs, error: convError } = await supabase
          .from('ai_conversations')
          .select('id, boyfriend_id, title, last_message_at, total_messages')
          .eq('boyfriend_id', bf.id)
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('last_message_at', { ascending: false});

        if (!convError && convs) {
          setConversations(convs);
          // Auto-select the most recent conversation or create new one
          if (convs.length > 0) {
            setCurrentConversation(convs[0]);
            loadMessages(convs[0].id);
          } else {
            await createNewConversation(bf.id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router, supabase]);

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from('ai_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && msgs) {
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async (boyfriendId: string) => {
    if (!user) return null;
    
    try {
      const { data: conv, error } = await supabase
        .from('ai_conversations')
        .insert({
          boyfriend_id: boyfriendId,
          user_id: user.id,
          title: `Chat with ${boyfriend?.name || 'AI Boyfriend'}`,
        })
        .select()
        .single();

      if (!error && conv) {
        setCurrentConversation(conv);
        setConversations(prev => [conv, ...prev]);
        return conv;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentConversation || !boyfriend || sending) return;

    setSending(true);
    const userMessage = message.trim();
    setMessage('');

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Add AI message placeholder
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMessage]);

    try {

      // Send to API
      const response = await fetch('/api/boyfriend/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boyfriendId: boyfriend.id,
          message: userMessage,
        }),
      });

      if (response.ok) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              aiResponse += chunk;

              // Update the AI message in real-time
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId ? { ...msg, content: aiResponse } : msg
                )
              );
            }
          } finally {
            reader.releaseLock();
          }
        }

        // Update conversation in list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === currentConversation.id
              ? { ...conv, last_message_at: new Date().toISOString(), total_messages: conv.total_messages + 2 }
              : conv
          )
        );
      } else {
        // Handle error response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        console.error('Chat error:', errorMessage);
        // Remove temp message and show error
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      }
    } catch (error) {
      console.error('Send message error:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async () => {
    if (!boyfriend) return;
    await createNewConversation(boyfriend.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!boyfriend) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Boyfriend Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">You need to create a boyfriend first to start chatting.</p>
            <Button onClick={() => router.push('/boyfriend')}>
              Create Boyfriend
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Conversations Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Chats</CardTitle>
                    <Button onClick={startNewChat} size="sm" variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2 p-4">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setCurrentConversation(conv);
                          loadMessages(conv.id);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentConversation?.id === conv.id
                            ? 'bg-pink-100 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={boyfriend.avatar_url} />
                            <AvatarFallback>{boyfriend.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conv.title || `Chat ${conv.total_messages} messages`}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(conv.last_message_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={boyfriend.avatar_url} />
                      <AvatarFallback>{boyfriend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{boyfriend.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {currentConversation?.total_messages || 0} messages
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Heart className="w-5 h-5 text-pink-500" />
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start your conversation with {boyfriend.name}!</p>
                      <p className="text-sm mt-2">Say hello and get to know each other.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder={`Message ${boyfriend.name}...`}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim() || sending}
                      className="bg-pink-500 hover:bg-pink-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {sending && (
                    <p className="text-xs text-gray-500 mt-2">
                      {boyfriend.name} is typing...
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
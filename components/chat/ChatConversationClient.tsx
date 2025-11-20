'use client';

/**
 * CHAT CONVERSATION CLIENT - UNIFIED LEGENDARY CHAT
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime
 * Per Radix UI Primitives: https://www.radix-ui.com/primitives
 * Per shadcn/ui: https://ui.shadcn.com/docs/components/avatar
 * 
 * Features: Real-time messages, typing indicators, read receipts, 
 * photo sharing, voice messages, reactions, location sharing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Send, Mic, Image as ImageIcon, MapPin, Smile, Paperclip, MoreVertical, Check, CheckCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  match_id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  attachment_type?: 'image' | 'voice' | 'video' | 'album' | 'location';
  attachment_urls?: string[];
  attachment_metadata?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  reactions?: Record<string, string[]>;
  created_at: string;
  updated_at?: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface ChatConversationClientProps {
  matchId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_online: boolean;
    bio?: string;
    gender?: string;
  };
  isAI: boolean;
  initialMessages: Message[];
}

export default function ChatConversationClient({
  matchId,
  currentUserId,
  otherUser,
  isAI,
  initialMessages,
}: ChatConversationClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [matchId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
        markMessagesAsRead(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    const realtimeChannel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
          
          if (newMsg.from_user_id !== currentUserId) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updated.id ? updated : msg))
          );
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = realtimeChannel.presenceState();
        const typing: TypingUser[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.typing && presence.userId !== currentUserId) {
              typing.push({
                userId: presence.userId,
                userName: presence.userName,
                timestamp: Date.now(),
              });
            }
          });
        });

        setTypingUsers(typing);
      })
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [matchId, currentUserId]);

  const markMessagesAsRead = async (msgs: Message[]) => {
    const unreadIds = msgs
      .filter((m) => m.to_user_id === currentUserId && !m.is_read)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const handleTyping = useCallback(() => {
    if (!channel) return;

    if (!isTyping) {
      setIsTyping(true);
      channel.track({
        userId: currentUserId,
        userName: 'You',
        typing: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      channel.track({
        userId: currentUserId,
        userName: 'You',
        typing: false,
      });
    }, 3000);
  }, [channel, currentUserId, isTyping]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        from_user_id: currentUserId,
        to_user_id: otherUser.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      if (channel) {
        channel.track({ userId: currentUserId, typing: false });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
    }
  };

  const uploadVoiceMessage = async (audioBlob: Blob) => {
    try {
      setIsSending(true);
      const fileName = `${currentUserId}/${matchId}/${Date.now()}.webm`;

      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      await supabase.from('messages').insert({
        match_id: matchId,
        from_user_id: currentUserId,
        to_user_id: otherUser.id,
        content: '🎤 Voice message',
        attachment_type: 'voice',
        attachment_urls: [urlData.publicUrl],
      });
    } catch (error) {
      console.error('Failed to upload voice message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsSending(true);
      const urls: string[] = [];

      for (const file of Array.from(files)) {
        const fileName = `${currentUserId}/${matchId}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
          .from('chat-photos')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('chat-photos')
          .getPublicUrl(fileName);

        urls.push(urlData.publicUrl);
      }

      await supabase.from('messages').insert({
        match_id: matchId,
        from_user_id: currentUserId,
        to_user_id: otherUser.id,
        content: '📷 Photo',
        attachment_type: 'image',
        attachment_urls: urls,
      });
    } catch (error) {
      console.error('Failed to upload photos:', error);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-linear-to-r from-pink-500 to-purple-600 px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.name} />
              <AvatarFallback className="bg-white text-pink-600">{otherUser.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                {otherUser.name}
                {isAI && <span className="text-xs bg-purple-700 px-2 py-0.5 rounded-full">🤖 AI</span>}
              </h2>
              <p className="text-xs text-pink-100">
                {otherUser.is_online ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-br from-pink-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800">
        {messages.map((msg) => {
          const isMine = msg.from_user_id === currentUserId;
          const isExpired = msg.expires_at && new Date(msg.expires_at) < new Date();

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-2 rounded-2xl shadow-md ${
                    isMine
                      ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {msg.attachment_type === 'voice' && msg.attachment_urls?.[0] && (
                    <audio controls className="max-w-full">
                      <source src={msg.attachment_urls[0]} type="audio/webm" />
                    </audio>
                  )}

                  {msg.attachment_type === 'image' && msg.attachment_urls && !isExpired && (
                    <div className="space-y-2">
                      {msg.attachment_urls.map((url, idx) => (
                        <div key={idx} className="relative w-64 h-48 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt="Photo"
                            fill
                            className="object-cover"
                            sizes="256px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.attachment_type === 'image' && isExpired && (
                    <div className="text-sm opacity-75">📸 Photo expired</div>
                  )}

                  {msg.content && <p className="text-sm whitespace-pre-wrap wrap-break-word">{msg.content}</p>}

                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <span key={emoji} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {emoji} {users.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-1">
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && (
                    <>
                      {msg.is_read ? (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="italic">{otherUser.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-lg">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isRecordingVoice}
            className="text-gray-600 dark:text-gray-400 hover:text-pink-500"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            disabled={isSending}
            className={`text-gray-600 dark:text-gray-400 hover:text-pink-500 ${isRecordingVoice ? 'text-red-500 animate-pulse' : ''}`}
          >
            <Mic className="w-5 h-5" />
          </Button>

          {!isRecordingVoice && (
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-pink-500 focus:border-pink-500"
            />
          )}

          {isRecordingVoice && (
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-sm font-semibold">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording...
            </div>
          )}

          {!isRecordingVoice && (
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

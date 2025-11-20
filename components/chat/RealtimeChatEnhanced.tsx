'use client';

/**
 * REALTIME CHAT - 1000X BETTER THAN COMPETITORS
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime
 * Features: Typing indicators, read receipts, voice messages, reactions, expiring photos
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Send, Mic, Image as ImageIcon, Smile, MoreVertical, Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  attachment_type?: 'image' | 'voice' | 'video' | 'album';
  attachment_urls?: string[];
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  reactions?: Record<string, string[]>; // emoji -> user_ids[]
  created_at: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface RealtimeChatProps {
  matchId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    is_online: boolean;
  };
}

export default function RealtimeChatEnhanced({ matchId, currentUserId, otherUser }: RealtimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const supabase = createClient();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [matchId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
      scrollToBottom();
      markMessagesAsRead(data);
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    const realtimeChannel = supabase
      .channel(`chat:${matchId}`)
      // New messages
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
          scrollToBottom();
          
          // Mark as read if from other user
          if (newMsg.from_user_id !== currentUserId) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      // Read receipts
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
      // Typing indicators
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

  // Mark messages as read
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

  // Handle typing indicator
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

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      channel.track({
        userId: currentUserId,
        userName: 'You',
        typing: false,
      });
    }, 3000);
  }, [channel, currentUserId, isTyping]);

  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      from_user_id: currentUserId,
      to_user_id: otherUser.id,
      content: newMessage,
    });

    if (!error) {
      setNewMessage('');
      if (channel) {
        channel.track({ userId: currentUserId, typing: false });
      }
    }
  };

  // Voice recording
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
    const fileName = `${currentUserId}/${matchId}/${Date.now()}.webm`;

    const { data, error } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBlob);

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      await supabase.from('messages').insert({
        match_id: matchId,
        from_user_id: currentUserId,
        to_user_id: otherUser.id,
        content: 'Voice message',
        attachment_type: 'voice',
        attachment_urls: [urlData.publicUrl],
      });
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const reactions = message.reactions || {};
    const userIds = reactions[emoji] || [];

    if (!userIds.includes(currentUserId)) {
      userIds.push(currentUserId);
      reactions[emoji] = userIds;

      await supabase
        .from('messages')
        .update({ reactions })
        .eq('id', messageId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.from_user_id === currentUserId;
          const isExpired = msg.expires_at && new Date(msg.expires_at) < new Date();

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Message bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  {/* Voice message */}
                  {msg.attachment_type === 'voice' && msg.attachment_urls?.[0] && (
                    <audio controls className="max-w-full">
                      <source src={msg.attachment_urls[0]} type="audio/webm" />
                    </audio>
                  )}

                  {/* Image message */}
                  {msg.attachment_type === 'image' && msg.attachment_urls?.[0] && !isExpired && (
                    <div className="relative w-64 h-48 rounded-lg overflow-hidden">
                      <Image
                        src={msg.attachment_urls[0]}
                        alt="Photo"
                        fill
                        className="object-cover"
                        sizes="256px"
                      />
                    </div>
                  )}

                  {/* Expired photo placeholder */}
                  {msg.attachment_type === 'image' && isExpired && (
                    <div className="text-sm opacity-75">📸 Photo expired</div>
                  )}

                  {/* Text content */}
                  {msg.content && <p className="text-sm">{msg.content}</p>}

                  {/* Reactions */}
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

                {/* Timestamp & Read receipt */}
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
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

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{otherUser.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500">
            <Smile className="w-6 h-6" />
          </button>

          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500">
            <ImageIcon className="w-6 h-6" />
          </button>

          <button
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            className={`p-2 ${isRecordingVoice ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'} hover:text-pink-500`}
          >
            <Mic className="w-6 h-6" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

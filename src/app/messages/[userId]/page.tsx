'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, MoreVertical, Paperclip, Send, Loader2, Crown,
  Pencil, Trash2, Smile, CheckCheck, Check, ImagePlus, X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { uploadMessageImage } from '@/lib/storage';
import type { UserProfile, Message } from '@/lib/types';

// ─── Extended Message type (includes reactions + read_at) ─────────────────
type ChatMessage = Message & {
  reactions?: Record<string, string[]>; // emoji → [userId[]]
  readAt?:    string | null;
  imageUrl?:  string | null;
  editedAt?:  string | null;
};

const EMOJI_PALETTE = ['❤️', '😂', '🔥', '👑', '😍', '💪', '🙌', '😘'];

async function fetchInitialMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) return [];
  return (data ?? []).map((row) => transformToCamel<ChatMessage>(row));
}

async function fetchOrCreateConversation(myId: string, otherId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_one.eq.${myId},participant_two.eq.${otherId}),` +
      `and(participant_one.eq.${otherId},participant_two.eq.${myId})`,
    )
    .single();
  if (data?.id) return data.id;
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_one: myId, participant_two: otherId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return created.id;
}

async function fetchOtherUser(otherUserUid: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', otherUserUid)
    .single();
  return data ? transformToCamel<UserProfile>(data) : null;
}

// ─── Mark messages as read ────────────────────────────────────────────────
async function markRead(conversationId: string, userId: string) {
  const supabase = createClient();
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: otherUserUid } = use(params);
  const { user }                 = useUser();
  const [newMessage, setNewMessage]         = useState('');
  const [isSending, setIsSending]           = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editText, setEditText]             = useState('');
  const [uploading, setUploading]           = useState(false);
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [imageFile, setImageFile]           = useState<File | null>(null);

  const channelRef   = useRef<RealtimeChannel | null>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient  = useQueryClient();
  const supabase     = createClient();

  // Resolve / create conversation
  useEffect(() => {
    if (!user?.id || !otherUserUid) return;
    fetchOrCreateConversation(user.id, otherUserUid)
      .then((id) => { setConversationId(id); })
      .catch(() => toast.error('Could not open conversation'));
  }, [user?.id, otherUserUid]);

  // Typing indicator
  const { isTyping, broadcastTyping } = useTypingIndicator(conversationId, user?.id);

  const { data: otherUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ['chatUser', otherUserUid],
    queryFn:  () => fetchOtherUser(otherUserUid),
    enabled:  !!otherUserUid,
  });

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn:  () => fetchInitialMessages(conversationId!),
    enabled:  !!conversationId,
  });

  // Mark read on open
  useEffect(() => {
    if (conversationId && user?.id) void markRead(conversationId, user.id);
  }, [conversationId, user?.id]);

  // Realtime: INSERT / UPDATE / DELETE
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`chat:${conversationId}:v2`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = transformToCamel<ChatMessage>(payload.new as Record<string, unknown>);
          queryClient.setQueryData(['messages', conversationId], (old: ChatMessage[] = []) =>
            old.some((m) => m.id === msg.id) ? old : [...old, msg],
          );
          if (msg.senderId !== user.id) void markRead(conversationId, user.id);
        },
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = transformToCamel<ChatMessage>(payload.new as Record<string, unknown>);
          queryClient.setQueryData(['messages', conversationId], (old: ChatMessage[] = []) =>
            old.map((m) => m.id === msg.id ? msg : m),
          );
        },
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData(['messages', conversationId], (old: ChatMessage[] = []) =>
            old.filter((m) => m.id !== payload.old.id),
          );
        },
      )
      .subscribe();
    channelRef.current = channel;
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, user, supabase, queryClient]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if ((!content && !imageFile) || !user || !conversationId) return;
    setIsSending(true);
    let uploadedUrl: string | null = null;
    try {
      if (imageFile) {
        setUploading(true);
        uploadedUrl = await uploadMessageImage(imageFile, user.id);
        setImageFile(null);
        setImagePreview(null);
        setUploading(false);
      }
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id:       user.id,
        content:         content || null,
        image_url:       uploadedUrl,
      });
      if (error) throw error;
      setNewMessage('');
    } catch {
      toast.error('Failed to send');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [newMessage, imageFile, user, conversationId, supabase]);

  // ── Edit ──────────────────────────────────────────────────────────────
  const handleEdit = useCallback(async (msgId: string) => {
    const text = editText.trim();
    if (!text) return;
    const { error } = await supabase
      .from('messages')
      .update({ content: text, edited_at: new Date().toISOString() })
      .eq('id', msgId)
      .eq('sender_id', user!.id);
    if (error) toast.error('Could not edit message');
    setEditingId(null);
    setEditText('');
  }, [editText, user, supabase]);

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (msgId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', msgId)
      .eq('sender_id', user!.id);
    if (error) toast.error('Could not delete message');
  }, [user, supabase]);

  // ── React ─────────────────────────────────────────────────────────────
  const handleReact = useCallback(async (msgId: string, emoji: string) => {
    if (!user?.id) return;
    // Optimistic: toggle via DB upsert/delete on a message_reactions table
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', msgId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single();
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji });
    }
    // Refresh messages to pull reaction counts (trigger updates messages.reactions JSONB via DB function)
    void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
  }, [user, supabase, queryClient, conversationId]);

  // ── Image picker ───────────────────────────────────────────────────────
  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const displayName = otherUser?.displayName ?? otherUser?.id?.slice(0, 8) ?? '...';
  const initials    = displayName.charAt(0).toUpperCase();

  if (!user || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Crown className="size-10 opacity-30" />
        <p className="font-semibold">King not found</p>
        <Link href="/messages"><Button variant="outline"><ArrowLeft className="mr-2 size-4" />Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 p-3 border-b shrink-0 bg-card/80 backdrop-blur">
        <Link href="/messages" className="md:hidden" aria-label="Back">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <Link href={`/profile/${otherUserUid}`}>
          <Avatar className="size-9">
            <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="text-primary animate-pulse">typing…</span>
            ) : (
              otherUser.role ?? 'king'
            )}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="More"><MoreVertical /></Button>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isMessagesLoading ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="animate-spin size-6 text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Crown className="size-10 opacity-20" />
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine   = msg.senderId === user.id;
            const isEditing = editingId === msg.id;
            const reactionEntries = Object.entries(msg.reactions ?? {});

            return (
              <div
                key={msg.id}
                className={cn('group flex items-end gap-2', isMine && 'flex-row-reverse')}
              >
                {/* Avatar (theirs) */}
                {!isMine && (
                  <Avatar className="size-7 shrink-0 mb-1">
                    <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}

                <div className={cn('flex flex-col max-w-[72%]', isMine && 'items-end')}>
                  {/* Bubble */}
                  {isEditing ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); void handleEdit(msg.id); }}
                      className="flex gap-1"
                    >
                      <Input
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        maxLength={2000}
                      />
                      <Button size="icon" className="h-8 w-8" type="submit"><Check className="size-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" type="button"
                        onClick={() => { setEditingId(null); setEditText(''); }}>
                        <X className="size-3" />
                      </Button>
                    </form>
                  ) : (
                    <div
                      className={cn(
                        'relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm',
                      )}
                    >
                      {/* Image attachment */}
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          className="rounded-lg mb-1.5 max-w-[240px] max-h-[320px] object-cover cursor-pointer"
                          loading="lazy"
                          onClick={() => window.open(msg.imageUrl!, '_blank')}
                        />
                      )}
                      {msg.content && <span>{msg.content}</span>}
                      {msg.editedAt && (
                        <span className="ml-1.5 text-[9px] opacity-50">(edited)</span>
                      )}

                      {/* Action buttons (hover) */}
                      <div className={cn(
                        'absolute -top-6 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                        isMine ? 'right-0' : 'left-0',
                      )}>
                        {/* React */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="React">
                              <Smile className="size-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-1.5 flex gap-1">
                            {EMOJI_PALETTE.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => void handleReact(msg.id, emoji)}
                                className="text-lg hover:scale-125 transition-transform"
                                aria-label={`React ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>

                        {/* Edit / Delete (mine only) */}
                        {isMine && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Message options">
                                <MoreVertical className="size-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => { setEditingId(msg.id); setEditText(msg.content ?? ''); }}
                              >
                                <Pencil className="mr-2 size-3" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => void handleDelete(msg.id)}
                              >
                                <Trash2 className="mr-2 size-3" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  {reactionEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {reactionEntries.map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => void handleReact(msg.id, emoji)}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors',
                            users.includes(user.id)
                              ? 'bg-primary/20 border-primary/40'
                              : 'bg-muted border-border hover:bg-muted/80',
                          )}
                          aria-label={`${emoji} ${users.length}`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-medium">{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp + read receipt */}
                  <div className={cn('flex items-center gap-1 mt-0.5', isMine && 'flex-row-reverse')}>
                    <time className="text-[10px] text-muted-foreground">
                      {msg.createdAt
                        ? formatDistanceToNowStrict(new Date(msg.createdAt as string)) + ' ago'
                        : ''}
                    </time>
                    {isMine && (
                      msg.readAt
                        ? <CheckCheck className="size-3 text-primary" aria-label="Read" />
                        : <Check className="size-3 text-muted-foreground" aria-label="Sent" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Image preview strip */}
      {imagePreview && (
        <div className="px-4 pb-1 shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-lg border" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-white flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <footer className="p-3 border-t bg-card/80 backdrop-blur shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSend(); }}
          className="flex items-center gap-2"
          aria-label="Send message"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImagePick}
            aria-label="Attach image"
          />
          <Button
            variant="ghost" size="icon" type="button"
            aria-label="Attach image"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4 text-muted-foreground" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Your message…"
            className="flex-1 h-10"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              broadcastTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
            }}
            aria-label="Message input"
            maxLength={2000}
            autoFocus
          />
          <Button
            size="icon" className="h-10 w-10 shrink-0" type="submit"
            disabled={isSending || uploading || (!newMessage.trim() && !imageFile) || !conversationId}
            aria-label="Send message"
          >
            {(isSending || uploading)
              ? <Loader2 className="animate-spin size-4" />
              : <Send className="size-4" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}

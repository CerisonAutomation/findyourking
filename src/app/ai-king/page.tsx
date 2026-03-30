'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Crown, Send, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

// Emotion-mapped video clips already in the repo
const EMOTION_CLIPS: Record<string, string> = {
  happy:    '/ai-king/happy.mp4',
  surprise: '/ai-king/suprise.mp4',
  tilt:     '/ai-king/tilt.mp4',
  walking:  '/ai-king/walking.mp4',
  default:  '/ai-king/dogai.mp4',
};

function detectEmotion(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(great|perfect|amazing|wonderful|love|yes|absolutely)\b/.test(lower)) return 'happy';
  if (/\b(oh|wow|really|interesting|surprising|wait)\b/.test(lower)) return 'surprise';
  if (/\b(hmm|think|consider|perhaps|maybe|curious)\b/.test(lower)) return 'tilt';
  if (/\b(let me|searching|looking|finding|fetching)\b/.test(lower)) return 'walking';
  return 'default';
}

export default function AiKingPage() {
  const { user } = useUser();
  const [muted, setMuted] = useState(true);
  const [currentClip, setCurrentClip] = useState(EMOTION_CLIPS.default);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    onFinish: (msg) => {
      const emotion = detectEmotion(msg.content);
      const clip = EMOTION_CLIPS[emotion];
      if (clip !== currentClip) {
        setCurrentClip(clip);
        videoRef.current?.load();
        void videoRef.current?.play();
      }
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleMute = useCallback(() => {
    setMuted((v) => {
      if (videoRef.current) videoRef.current.muted = !v;
      return !v;
    });
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-4 p-4">
      {/* Avatar panel */}
      <div className="relative flex-shrink-0 w-full lg:w-72 h-48 lg:h-auto rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={currentClip}
          autoPlay
          loop
          muted={muted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="AI King avatar"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-yellow-400" />
            <span className="text-white text-sm font-semibold">The Oracle</span>
          </div>
          <Button
            variant="ghost" size="icon" className="size-8 text-white hover:bg-white/20"
            onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex flex-col flex-1 min-h-0 rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <Crown className="size-5 text-yellow-400" />
          <div>
            <h1 className="font-semibold text-sm">The Oracle</h1>
            <p className="text-xs text-muted-foreground">Your AI King concierge</p>
          </div>
        </div>

        <ScrollArea className="flex-1" ref={scrollRef as React.RefObject<React.ComponentRef<typeof ScrollArea>>}>
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center space-y-2 py-8">
                <Crown className="size-10 mx-auto text-yellow-400/60" />
                <p className="text-sm text-muted-foreground">Greetings, King. How may I serve you today?</p>
              </div>
            )}
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
                  <Avatar className="size-7 shrink-0">
                    {isUser ? (
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src="/ai-king/dogai.mp4" alt="Oracle" />
                        <AvatarFallback className="bg-yellow-500 text-black text-xs"><Crown className="size-3" /></AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className={cn(
                    'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm',
                    isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm',
                  )}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="size-7"><AvatarFallback className="bg-yellow-500 text-black text-xs"><Crown className="size-3" /></AvatarFallback></Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-destructive text-center">The Oracle is temporarily unavailable. Try again.</p>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-3 border-t"
          aria-label="Chat with Oracle"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask the Oracle…"
            className="flex-1 h-10"
            maxLength={1000}
            disabled={isLoading}
            aria-label="Your message"
          />
          <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

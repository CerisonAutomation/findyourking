'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Crown,
  Send,
  User,
  MapPin,
  Scaling,
  Briefcase,
  Paintbrush,
  Sparkle,
  BookText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Logo } from '@/components/logo';
import {
  OnboardingState,
  onboardKing,
} from '@/ai/flows/onboarding-flow';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase-client';

const initialOnboardingState: OnboardingState = {
  id: null,
  age: null,
  location: null,
  height: null,
  job: null,
  style: null,
  vibe: null,
  interests: [],
  bio: null,
};

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>(initialOnboardingState);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInitialMessage = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await onboardKing({
        userId: user.id,
        message: 'Begin onboarding.',
        currentState: initialOnboardingState,
      });
      setMessages([{ role: 'assistant', content: response.response }]);
      setOnboardingState(response.updatedState);
    } catch (e) {
      console.error(e);
      toast.error('The AI King is unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(user) handleInitialMessage();
  }, [user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await onboardKing({
        userId: user.id,
        message: input,
        currentState: onboardingState,
      });

      if (response.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.response },
        ]);
      }
      if (response.updatedState) {
        setOnboardingState(response.updatedState);
      }
    } catch (error) {
      console.error('Onboarding Error:', error);
      toast.error('AI Error', { description: 'Could not process response.' });
      setMessages((prev) =>
        prev.filter((msg) => msg.content !== userMessage.content)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoronation = async () => {
    if (!user || !onboardingState.id) return;
    setIsSubmitting(true);
    toast.loading('Forging your crown...');
    const supabase = createClient();
    try {
      const profileData = {
        userId: user.id,
        id: onboardingState.id,
        age: onboardingState.age,
        location: onboardingState.location,
        height: onboardingState.height,
        interests: onboardingState.interests,
        bio: onboardingState.bio,
        avatarUrl:
          user.user_metadata.avatar_url ||
          `https://picsum.photos/seed/${user.id}/600/800`,
        onboarded: true,
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'userId' });

      if (error) throw error;

      toast.success('Welcome to the Kingdom!', {
        description: 'Your profile is now live.',
      });
      router.push('/');
    } catch (error: any) {
        console.error('Submission Error:', error);
      toast.error('Submission Error', {
        description: error.message || 'Could not save your profile.',
      });
      setIsSubmitting(false);
    }
  };

  const completedFields = Object.values(onboardingState).filter(
    (value) =>
      value !== null && (Array.isArray(value) ? value.length > 0 : true)
  ).length;
  const totalFields = Object.keys(onboardingState).length;
  const progress = (completedFields / totalFields) * 100;
  const isComplete = progress >= 100;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col h-[85vh]">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Logo />
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="text-left mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              The Coronation Protocol
            </h1>
            <p className="mt-1 text-muted-foreground">
              The AI King will forge your profile through conversation.
            </p>
          </div>

          <Card className="flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-6 space-y-6">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${
                        m.role === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      {m.role === 'assistant' && (
                        <Avatar>
                          <AvatarFallback>
                            <Crown />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-md rounded-lg p-3 ${
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                      {m.role === 'user' && (
                        <Avatar>
                          <AvatarFallback>
                            <User />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                     <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            <Crown />
                          </AvatarFallback>
                        </Avatar>
                        <div className="max-w-md bg-muted rounded-lg p-3 flex items-center">
                            <Loader2 className="animate-spin size-5"/>
                        </div>
                     </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="relative">
                  <Input
                    placeholder="Your reply..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || isComplete}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={isLoading || isComplete}
                  >
                    <Send />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {isComplete && (
             <Button onClick={handleCoronation} disabled={isSubmitting} size="lg" className="mt-4 w-full">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Enter the Kingdom <Crown className="ml-2"/></>}
              </Button>
          )}
        </div>
        <div className="md:col-span-1 flex flex-col h-[85vh]">
          <h2 className="text-xl font-bold tracking-tight mb-4">Royal Decree</h2>
          <Card className="flex-1">
            <CardContent className="p-6 space-y-4 text-sm">
                <div className="flex items-center gap-3"><User className="size-4 text-primary"/><strong className="w-20">King:</strong> <span className="text-muted-foreground">{onboardingState.id || '...'}</span></div>
                <div className="flex items-center gap-3"><Sparkles className="size-4 text-primary"/><strong className="w-20">Age:</strong> <span className="text-muted-foreground">{onboardingState.age || '...'}</span></div>
                <div className="flex items-center gap-3"><MapPin className="size-4 text-primary"/><strong className="w-20">Realm:</strong> <span className="text-muted-foreground">{onboardingState.location || '...'}</span></div>
                <div className="flex items-center gap-3"><Scaling className="size-4 text-primary"/><strong className="w-20">Height:</strong> <span className="text-muted-foreground">{onboardingState.height ? `${onboardingState.height} cm` : '...'}</span></div>
                <div className="flex items-center gap-3"><Briefcase className="size-4 text-primary"/><strong className="w-20">Vocation:</strong> <span className="text-muted-foreground">{onboardingState.job || '...'}</span></div>
                <div className="flex items-center gap-3"><Paintbrush className="size-4 text-primary"/><strong className="w-20">Style:</strong> <span className="text-muted-foreground">{onboardingState.style || '...'}</span></div>
                <div className="flex items-center gap-3"><Sparkle className="size-4 text-primary"/><strong className="w-20">Vibe:</strong> <span className="text-muted-foreground">{onboardingState.vibe || '...'}</span></div>
                
                <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-3"><BookText className="size-4 text-primary"/><strong>Proclamation:</strong></div>
                    <p className="text-muted-foreground text-xs pl-7">{onboardingState.bio || 'The AI King will craft this based on your dialogue.'}</p>
                </div>

                <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-3"><Crown className="size-4 text-primary"/><strong>Passions:</strong></div>
                    <div className="flex flex-wrap gap-2 pl-7">
                        {onboardingState.interests.length > 0 ? onboardingState.interests.map(interest => (
                            <Badge key={interest} variant="secondary">{interest}</Badge>
                        )) : <p className="text-muted-foreground text-xs">Awaiting your word...</p>}
                    </div>
                </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

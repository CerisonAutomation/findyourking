'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Zap, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUser } from '@/hooks/use-user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, transformToCamel } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { MeetNowCard as MeetNowCardComponent } from '@/components/meet-now-card';
import type { MeetNowCard, UserProfile } from '@/lib/types';

const meetNowSchema = z.object({
  activity: z
    .string()
    .min(3, 'Be more descriptive.')
    .max(50, 'Max 50 characters.'),
  location: z
    .string()
    .min(3, 'Where at?')
    .max(50, 'Max 50 characters.'),
  time: z.string().min(1, 'Please pick a time.'),
});

type MeetNowFormValues = z.infer<typeof meetNowSchema>;

async function fetchMeetNowCards(): Promise<MeetNowCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meet_now_cards')
    .select('*')
    .order('created_at', { ascending: false }) // ✅ snake_case
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => transformToCamel<MeetNowCard>(row));
}

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId) // ✅ snake_case
    .single();
  if (error) return null;
  return transformToCamel<UserProfile>(data);
}

function MeetNowFeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full h-40 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function MeetNowPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [watchActivity, setWatchActivity] = useState('');
  const [watchLocation, setWatchLocation] = useState('');

  const { data: cards = [], isLoading: cardsLoading, error: cardsError } = useQuery({
    queryKey: ['meetNowCards'],
    queryFn: fetchMeetNowCards,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user,
  });

  const form = useForm<MeetNowFormValues>({
    resolver: zodResolver(meetNowSchema),
    defaultValues: { activity: '', location: '', time: '' },
  });

  const postMutation = useMutation({
    mutationFn: async (values: MeetNowFormValues) => {
      if (!user || !userProfile) throw new Error('Not authenticated');

      // Guard: max 3 active cards per user
      const userCards = cards.filter((c) => c.userId === user.id);
      if (userCards.length >= 3) throw new Error('You can only have 3 active cards at a time.');

      const supabase = createClient();
      const { error } = await supabase.from('meet_now_cards').insert({
        user_id: user.id,                          // ✅ snake_case
        user_name: userProfile.id ?? 'A King',     // ✅ snake_case
        user_avatar: userProfile.avatarUrl ?? null, // ✅ snake_case
        activity: values.activity,
        location: values.location,
        time: values.time,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Card Posted!', { description: 'Your Meet Now card is live.' });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['meetNowCards'] });
    },
    onError: (err: Error) => {
      toast.error('Could not post card', { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('meet_now_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user!.id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: ['meetNowCards'] });
      const previous = queryClient.getQueryData<MeetNowCard[]>(['meetNowCards']);
      queryClient.setQueryData<MeetNowCard[]>(
        ['meetNowCards'],
        (old) => (old ?? []).filter((c) => c.id !== cardId)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(['meetNowCards'], ctx?.previous);
      toast.error('Could not delete card');
    },
    onSuccess: () => toast.success('Card removed'),
  });

  const activityValue = form.watch('activity');
  const locationValue = form.watch('location');

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <header className="flex items-center gap-2 mb-6">
        <Zap className="text-primary shrink-0" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight">Meet Now</h1>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-1">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => postMutation.mutate(v))}
              className="space-y-4 p-5 border rounded-lg bg-card"
              aria-label="Create a Meet Now card"
            >
              <h2 className="text-lg font-semibold">Create a spontaneous plan</h2>

              <FormField
                control={form.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grabbing a coffee" maxLength={50} {...field} />
                    </FormControl>
                    <FormDescription className="text-right text-xs">
                      {(field.value ?? '').length}/50
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Downtown" maxLength={50} {...field} />
                    </FormControl>
                    <FormDescription className="text-right text-xs">
                      {(field.value ?? '').length}/50
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={postMutation.isPending || !user}
              >
                <PlusCircle className="mr-2 size-4" />
                {postMutation.isPending ? 'Posting…' : 'Post Card'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Feed */}
        <div
          className="md:col-span-2 space-y-4"
          aria-live="polite"
          aria-label="Meet Now cards feed"
        >
          {cardsLoading && <MeetNowFeedSkeleton />}

          {cardsError && (
            <div className="text-destructive text-sm p-4 border border-destructive/30 rounded-lg">
              Failed to load cards. Please refresh.
            </div>
          )}

          {!cardsLoading && !cardsError && cards.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <Zap className="size-12 mb-4 opacity-40" />
              <h3 className="text-xl font-semibold">The Realm is Quiet</h3>
              <p className="text-sm">No one is meeting now. Be the first to post a card!</p>
            </div>
          )}

          {cards.map((card) => (
            <div key={card.id} className="relative group">
              <MeetNowCardComponent card={card} />
              {user && card.userId === user.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(card.id)}
                  disabled={deleteMutation.isPending}
                  aria-label="Delete card"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

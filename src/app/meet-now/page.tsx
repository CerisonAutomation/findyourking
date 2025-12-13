'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { MeetNowCard as MeetNowCardComponent } from '@/components/meet-now-card';
import type { MeetNowCard, UserProfile } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';

const meetNowSchema = z.object({
  activity: z.string().min(3, 'Be more descriptive.').max(50, 'Too long.'),
  location: z.string().min(3, 'Where at?').max(50, 'Too long.'),
  time: z.string().min(2, 'When?').max(30, 'Too long.'),
});

async function fetchMeetNowCards(): Promise<MeetNowCard[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('meet_now_cards')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching cards', error);
        return [];
    }
    return data as MeetNowCard[];
}

async function fetchUserProfile(userId?: string): Promise<UserProfile | null> {
    if (!userId) return null;
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('userId', userId)
        .single();
    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
    return data;
}

export default function MeetNowPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cards, isLoading: cardsLoading } = useQuery({
      queryKey: ['meetNowCards'],
      queryFn: fetchMeetNowCards,
  });

  const { data: userProfile } = useQuery({
      queryKey: ['userProfile', user?.id],
      queryFn: () => fetchUserProfile(user?.id),
      enabled: !!user,
  });


  const form = useForm<z.infer<typeof meetNowSchema>>({
    resolver: zodResolver(meetNowSchema),
    defaultValues: {
      activity: '',
      location: '',
      time: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof meetNowSchema>) => {
    if (!user || !userProfile) return;
    setIsSubmitting(true);
    try {
      const cardData = {
        ...values,
        userId: user.id,
        userName: userProfile.id || 'A King',
        userAvatar: userProfile.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`,
      };
      const { error } = await supabase.from('meet_now_cards').insert(cardData);

      if (error) throw error;
      
      toast.success('Card Posted!', { description: 'Your Meet Now card is live.' });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ['meetNowCards'] });
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Could not post your card.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <header className="flex items-center gap-2 mb-6">
        <Zap className="text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Meet Now</h1>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Side: Form */}
        <div className="md:col-span-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 border rounded-lg bg-card">
              <h2 className="text-lg font-semibold">Create a spontaneous plan</h2>
              <FormField
                control={form.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grabbing a coffee" {...field} />
                    </FormControl>
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
                      <Input placeholder="e.g., Downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Next hour" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                Post Card
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Side: Feed */}
        <div className="md:col-span-2 space-y-4">
            {cardsLoading && (
                Array.from({ length: 3 }).map((_, i) => (
                     <div key={i} className="w-full h-56 rounded-lg bg-card animate-pulse" />
                ))
            )}
            {cards && cards.length === 0 && !cardsLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <Zap className="size-16 mb-4" />
                    <h3 className="text-xl font-semibold">The Realm is Quiet</h3>
                    <p>No one is meeting now. Be the first to post a card!</p>
                </div>
            )}
            {cards?.map((card) => (
                <MeetNowCardComponent key={card.id} card={card} />
            ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { allInterests } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';

const accountFormSchema = z.object({
  id: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(30, { message: 'Name must not be longer than 30 characters.' }),
  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(280, 'Bio must be less than 280 characters'),
  height: z.coerce
    .number()
    .int()
    .positive()
    .min(100, "Are you sure you're that short?")
    .max(250, "Are you sure you're that tall?"),
  location: z.string().min(2, 'Location is required'),
  interests: z
    .array(z.string())
    .min(1, 'Select at least one interest')
    .max(5, { message: 'You can select up to 5 interests.' }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  user: User;
  profile: UserProfile | null;
}

export function AccountForm({ user, profile }: AccountFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      id: profile?.id ?? '',
      bio: profile?.bio ?? '',
      height: profile?.height ?? 0,
      location: profile?.location ?? '',
      interests: (profile?.interests as string[]) ?? [],
    },
    mode: 'onChange',
  });

  async function onSubmit(data: AccountFormValues) {
    const toastId = toast.loading('Updating profile...');
    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        updated_at: new Date().toISOString(),
        id: data.id,
        bio: data.bio,
        height: data.height,
        location: data.location,
        interests: data.interests,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      toast.error('Error updating profile', { id: toastId, description: error.message });
    } else {
      toast.success('Profile updated successfully!', { id: toastId });
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" autoComplete="name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed to other users.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length ?? 0}/280 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="180"
                    min={100}
                    max={250}
                    autoComplete="off"
                    {...field}
                  />
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
                  <Input
                    placeholder="e.g., New York, NY"
                    autoComplete="address-level2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interests</FormLabel>
              <FormDescription>Select up to 5 interests.</FormDescription>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Interests">
                {allInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={field.value.includes(interest) ? 'default' : 'secondary'}
                    className="cursor-pointer select-none transition-colors"
                    role="checkbox"
                    aria-checked={field.value.includes(interest)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') e.currentTarget.click();
                    }}
                    onClick={() => {
                      const current = field.value ?? [];
                      const next = current.includes(interest)
                        ? current.filter((i) => i !== interest)
                        : [...current, interest];
                      if (next.length <= 5) {
                        field.onChange(next);
                      } else {
                        toast.warning('Too many interests', {
                          description: 'You can only select up to 5 interests.',
                        });
                      }
                    }}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Update profile
        </Button>
      </form>
    </Form>
  );
}

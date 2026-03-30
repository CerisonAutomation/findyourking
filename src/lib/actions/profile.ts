'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100).optional(),
  bio: z.string().max(1000).optional(),
  age: z.number().int().min(18).max(120).optional(),
  location: z.string().max(255).optional(),
  height: z.number().int().min(100).max(250).optional(),
  interests: z.array(z.string()).max(20).optional(),
  tribes: z.array(z.string()).max(10).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  hourlyRate: z.string().optional(),
  onboarded: z.boolean().optional(),
  role: z.enum(['seeker', 'provider']).optional(),
  subscriptionTier: z.enum(['free', 'premium', 'platinum']).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function updateProfile(input: UpdateProfileInput) {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { error: { _root: ['Not authenticated'] } };
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      age: parsed.data.age,
      location: parsed.data.location,
      height: parsed.data.height,
      interests: parsed.data.interests,
      tribes: parsed.data.tribes,
      avatar_url: parsed.data.avatarUrl,
      hourly_rate: parsed.data.hourlyRate,
      onboarded: parsed.data.onboarded,
      role: parsed.data.role,
      subscription_tier: parsed.data.subscriptionTier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) return { error: { _root: [error.message] } };

  revalidatePath('/profile');
  revalidatePath('/discover');
  return { success: true };
}

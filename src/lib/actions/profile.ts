'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  age: z.number().int().min(18).max(120).optional(),
  tribes: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  hourlyRate: z.number().positive().optional(),
  location: z.string().max(255).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export type ActionResult =
  | { success: true }
  | { success: false; error: Record<string, string[]> };

/**
 * Server Action — update the current user's profile.
 * Validates input with Zod, requires an authenticated session.
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: { _form: ['Unauthorized'] } };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      age: parsed.data.age,
      tribes: parsed.data.tribes,
      interests: parsed.data.interests,
      hourly_rate: parsed.data.hourlyRate,
      location: parsed.data.location,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (updateError) {
    return { success: false, error: { _form: [updateError.message] } };
  }

  revalidatePath('/profile');
  revalidatePath('/account');
  return { success: true };
}

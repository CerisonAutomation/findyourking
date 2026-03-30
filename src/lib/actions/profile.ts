'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  age: z.number().int().min(18).max(120).optional(),
  tribes: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function updateProfile(input: UpdateProfileInput) {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: { _form: ['Unauthorized'] } };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      age: parsed.data.age,
      tribes: parsed.data.tribes,
      interests: parsed.data.interests,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (updateError) {
    return { error: { _form: [updateError.message] } };
  }

  revalidatePath('/profile');
  revalidatePath('/account');
  return { success: true };
}

'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ToggleFavoriteSchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function toggleFavorite(targetUserId: string) {
  const parsed = ToggleFavoriteSchema.safeParse({ targetUserId });
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized' };
  if (user.id === targetUserId) return { error: 'Cannot favorite yourself' };

  // Check existing
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('favorited_user_id', targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
    if (error) return { error: error.message };
    revalidatePath('/favorites');
    return { favorited: false };
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, favorited_user_id: targetUserId });
    if (error) return { error: error.message };
    revalidatePath('/favorites');
    return { favorited: true };
  }
}

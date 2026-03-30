'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const FavoriteSchema = z.object({
  targetUserId: z.string().uuid(),
});

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Add a user to the current user's favorites.
 */
export async function addFavorite(targetUserId: string): Promise<ActionResult> {
  const parsed = FavoriteSchema.safeParse({ targetUserId });
  if (!parsed.success) return { success: false, error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { success: false, error: 'Unauthorized' };
  if (user.id === targetUserId) return { success: false, error: 'Cannot favorite yourself' };

  const { error } = await supabase.from('favorites').insert({
    user_id: user.id,
    favorited_user_id: parsed.data.targetUserId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/favorites');
  revalidatePath('/discover');
  return { success: true };
}

/**
 * Remove a user from the current user's favorites.
 */
export async function removeFavorite(
  targetUserId: string,
): Promise<ActionResult> {
  const parsed = FavoriteSchema.safeParse({ targetUserId });
  if (!parsed.success) return { success: false, error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('favorited_user_id', parsed.data.targetUserId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/favorites');
  revalidatePath('/discover');
  return { success: true };
}

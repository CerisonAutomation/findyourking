'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addFavorite(favoritedUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, favorited_user_id: favoritedUserId });

  if (error && error.code !== '23505') {
    return { error: error.message };
  }

  revalidatePath('/favorites');
  return { success: true };
}

export async function removeFavorite(favoritedUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('favorited_user_id', favoritedUserId);

  if (error) return { error: error.message };

  revalidatePath('/favorites');
  return { success: true };
}

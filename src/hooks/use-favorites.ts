'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Favorite } from '@/lib/types';

/** Returns the list of favorited user IDs for the current user. */
export function useFavorites(userId: string | undefined) {
  return useQuery<Favorite[]>({
    queryKey: ['favorites', userId],
    queryFn:  async () => {
      if (!userId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled:   !!userId,
    staleTime: 2 * 60_000,
  });
}

/** Toggles a favorite — adds if not present, removes if present. */
export function useToggleFavorite(currentUserId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!currentUserId) throw new Error('Not authenticated');
      const supabase = createClient();

      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('favorited_user_id', targetUserId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: currentUserId, favorited_user_id: targetUserId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites', currentUserId] });
    },
  });
}

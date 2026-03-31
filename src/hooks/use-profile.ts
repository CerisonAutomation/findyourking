'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

/**
 * Fetches a profile by userId.
 * Returns a stable query that other hooks can share via queryKey.
 */
export function useProfile(userId: string | undefined) {
  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    queryFn:  async () => {
      if (!userId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw new Error(error.message);
      return data as Profile;
    },
    enabled:   !!userId,
    staleTime: 5 * 60_000,
  });
}

/** Updates the authenticated user's own profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Profile>;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

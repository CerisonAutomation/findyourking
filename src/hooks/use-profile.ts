import { useQuery } from '@tanstack/react-query';
import { createClient, transformToCamel } from '@/lib/supabase-client';
import type { UserProfile } from '@/lib/types';

/**
 * Fetches a single user profile by user ID.
 * Deduplicates across all consumers via React Query cache key.
 */
export function useProfile(userId: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data ? transformToCamel<UserProfile>(data) : null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

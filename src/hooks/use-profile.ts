'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { useUser } from './use-user';

async function fetchMyProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data ? transformToCamel<UserProfile>(data) : null;
}

export function useProfile() {
  const { user } = useUser();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

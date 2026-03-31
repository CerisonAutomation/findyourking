'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Booking } from '@/lib/types';

/** Returns all bookings where the user is seeker or provider. */
export function useBookings(userId: string | undefined) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', userId],
    queryFn:  async () => {
      if (!userId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          seeker:profiles!bookings_seeker_id_fkey(user_id, display_name, avatar_url),
          provider:profiles!bookings_provider_id_fkey(user_id, display_name, avatar_url)
        `)
        .or(`seeker_id.eq.${userId},provider_id.eq.${userId}`)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Booking[];
    },
    enabled:   !!userId,
    staleTime: 60_000,
  });
}

/** Creates a new booking. */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .insert(booking);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/** Updates a booking status (confirm, cancel, complete). */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: Booking['status'];
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

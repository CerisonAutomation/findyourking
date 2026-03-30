'use client';

import { useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, CalendarClock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Booking } from '@/lib/types';

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

type BookingWithUsers = Booking & {
  seeker: { id: string; user_id: string } | null;
  provider: { id: string; user_id: string; hourly_rate?: number } | null;
};

const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

async function fetchBookings(userId: string): Promise<{
  bookings: BookingWithUsers[];
  userRole: 'seeker' | 'provider';
}> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const userRole: 'seeker' | 'provider' =
    profile?.role === 'provider' ? 'provider' : 'seeker';

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      seeker:profiles!seeker_id ( id, user_id ),
      provider:profiles!provider_id ( id, user_id, hourly_rate )
    `
    )
    .eq(userRole === 'seeker' ? 'seeker_id' : 'provider_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  return {
    bookings: (data ?? []) as BookingWithUsers[],
    userRole,
  };
}

function BookingCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  );
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
      <CalendarClock className="size-12 opacity-40" />
      <p className="font-medium">{label}</p>
    </div>
  );
}

function BookingCard({
  booking,
  userRole,
  onStatusChange,
}: {
  booking: BookingWithUsers;
  userRole: 'seeker' | 'provider';
  onStatusChange: (id: string, status: BookingStatus) => void;
}) {
  const otherUser = userRole === 'seeker' ? booking.provider : booking.seeker;
  const status = (booking.status ?? 'pending') as BookingStatus;
  const dateStr = typeof booking.date === 'string' ? booking.date : new Date(booking.date).toISOString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold">
            {userRole === 'seeker' ? 'With' : 'From'}{' '}
            {otherUser?.id ?? 'Unknown'}
          </CardTitle>
          <Badge
            variant="outline"
            className={STATUS_CLASSES[status] ?? STATUS_CLASSES.pending}
          >
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-4 shrink-0" />
          <span>
            {new Date(dateStr).toLocaleDateString('en-US', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <span>
            {new Date(dateStr).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true,
            })}
            {booking.duration ? ` · ${booking.duration} min` : ''}
          </span>
        </div>
        {booking.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{booking.location}</span>
          </div>
        )}
        {booking.provider?.hourly_rate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="size-4 shrink-0" />
            <span>${booking.provider.hourly_rate}/hour</span>
          </div>
        )}
        {booking.notes && (
          <p className="text-muted-foreground mt-2 border-t pt-2">{booking.notes}</p>
        )}

        {status === 'pending' && userRole === 'provider' && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => onStatusChange(booking.id, 'confirmed')} aria-label="Accept booking">
              <CheckCircle className="mr-2 size-4" />
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatusChange(booking.id, 'cancelled')} aria-label="Decline booking">
              <XCircle className="mr-2 size-4" />
              Decline
            </Button>
          </div>
        )}

        {status === 'pending' && userRole === 'seeker' && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => onStatusChange(booking.id, 'cancelled')} aria-label="Cancel booking request">
              <XCircle className="mr-2 size-4" />
              Cancel Request
            </Button>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" disabled aria-label="Reschedule (coming soon)">
              <CalendarClock className="mr-2 size-4" />
              Reschedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => fetchBookings(user!.id),
    enabled: !!user,
  });

  const { bookings = [], userRole = 'seeker' } = data ?? {};

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', user?.id] });
      const previous = queryClient.getQueryData(['bookings', user?.id]);
      queryClient.setQueryData<{ bookings: BookingWithUsers[]; userRole: string }>(
        ['bookings', user?.id],
        (old) =>
          old
            ? { ...old, bookings: old.bookings.map((b) => b.id === id ? { ...b, status } : b) }
            : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['bookings', user?.id], ctx?.previous);
      toast.error('Failed to update booking status');
    },
    onSuccess: (_data, { status }) => {
      toast.success(
        status === 'confirmed' ? 'Booking accepted!'
        : status === 'cancelled' ? 'Booking cancelled.'
        : 'Booking updated.'
      );
    },
  });

  const handleStatusChange = useCallback(
    (id: string, status: BookingStatus) => statusMutation.mutate({ id, status }),
    [statusMutation]
  );

  const filter = useCallback(
    (statuses: BookingStatus[]) =>
      bookings.filter((b) => statuses.includes((b.status ?? 'pending') as BookingStatus)),
    [bookings]
  );

  const upcoming = filter(['confirmed', 'in_progress']);
  const pending = filter(['pending']);
  const completed = filter(['completed']);
  const cancelled = filter(['cancelled']);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your appointments and schedules</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-destructive text-sm p-4 border border-destructive/30 rounded-lg">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load bookings. Please refresh.
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-yellow-500 text-white text-[10px] font-bold">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {([
            { value: 'upcoming', items: upcoming, emptyLabel: 'No upcoming bookings' },
            { value: 'pending', items: pending, emptyLabel: 'No pending bookings' },
            { value: 'completed', items: completed, emptyLabel: 'No completed bookings yet' },
            { value: 'cancelled', items: cancelled, emptyLabel: 'No cancelled bookings' },
          ] as const).map(({ value, items, emptyLabel }) => (
            <TabsContent key={value} value={value} className="space-y-4" aria-live="polite">
              {items.length === 0 ? (
                <EmptyTabState label={emptyLabel} />
              ) : (
                items.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    userRole={userRole as 'seeker' | 'provider'}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

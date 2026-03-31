'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useBookings, useUpdateBookingStatus } from '@/hooks/use-bookings';
import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Loader2, CalendarCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking } from '@/lib/types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',    variant: 'secondary',   icon: <Clock className="size-3" /> },
  confirmed:   { label: 'Confirmed',  variant: 'default',     icon: <CheckCircle2 className="size-3" /> },
  in_progress: { label: 'Ongoing',    variant: 'default',     icon: <CalendarCheck className="size-3" /> },
  completed:   { label: 'Completed',  variant: 'outline',     icon: <CheckCircle2 className="size-3" /> },
  cancelled:   { label: 'Cancelled',  variant: 'destructive', icon: <XCircle className="size-3" /> },
};

function BookingCard({ booking, userId }: { booking: Booking & { seeker?: Record<string, string>; provider?: Record<string, string> }; userId: string }) {
  const updateStatus = useUpdateBookingStatus();
  const isProvider   = booking.providerId === userId;
  const other        = isProvider ? booking.seeker : booking.provider;
  const cfg          = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  return (
    <article className="rounded-2xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={other?.avatar_url ?? undefined} />
          <AvatarFallback>{(other?.display_name ?? 'U').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{other?.display_name ?? 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">
            {isProvider ? 'You are the provider' : 'You requested'}
          </p>
        </div>
        <Badge variant={cfg.variant} className="gap-1 shrink-0">
          {cfg.icon}{cfg.label}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground space-y-0.5">
        {booking.date && (
          <p>📅 {format(new Date(booking.date as string), 'EEE, MMM d · h:mm a')}</p>
        )}
        {booking.duration && <p>⏱ {booking.duration}h session</p>}
        {booking.totalPrice && <p>💰 ${Number(booking.totalPrice).toFixed(2)}</p>}
        {booking.notes && <p className="italic">📝 {booking.notes}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isProvider && booking.status === 'pending' && (
          <>
            <Button
              size="sm" className="flex-1"
              onClick={() => updateStatus.mutate(
                { bookingId: booking.id, status: 'confirmed' },
                { onSuccess: () => toast.success('Booking confirmed') },
              )}
              disabled={updateStatus.isPending}
            >
              Accept
            </Button>
            <Button
              size="sm" variant="outline" className="flex-1"
              onClick={() => updateStatus.mutate(
                { bookingId: booking.id, status: 'cancelled' },
                { onSuccess: () => toast.success('Booking declined') },
              )}
              disabled={updateStatus.isPending}
            >
              Decline
            </Button>
          </>
        )}
        {!isProvider && booking.status === 'confirmed' && (
          <Button
            size="sm" variant="destructive" className="flex-1"
            onClick={() => updateStatus.mutate(
              { bookingId: booking.id, status: 'cancelled' },
              { onSuccess: () => toast.success('Booking cancelled') },
            )}
            disabled={updateStatus.isPending}
          >
            Cancel
          </Button>
        )}
        {isProvider && booking.status === 'confirmed' && (
          <Button
            size="sm" className="flex-1"
            onClick={() => updateStatus.mutate(
              { bookingId: booking.id, status: 'completed' },
              { onSuccess: () => toast.success('Marked as complete') },
            )}
            disabled={updateStatus.isPending}
          >
            Mark Complete
          </Button>
        )}
      </div>
    </article>
  );
}

export default function BookingsPage() {
  const { user }                  = useUser();
  const { data: bookings = [], isLoading } = useBookings(user?.id);
  const [tab, setTab]             = useState('upcoming');

  const upcoming  = bookings.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status));
  const past      = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3">
          <h1 className="text-lg font-bold">Bookings</h1>
        </header>

        <div className="px-4 pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="upcoming" className="flex-1">
                Upcoming {upcoming.length > 0 && `(${upcoming.length})`}
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Past {past.length > 0 && `(${past.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4 space-y-3 pb-24">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground text-center">
                  <CalendarCheck className="size-12 opacity-30" />
                  <p className="font-medium">
                    {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
                  </p>
                </div>
              ) : (
                displayed.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b as Booking & { seeker?: Record<string, string>; provider?: Record<string, string> }}
                    userId={user!.id}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

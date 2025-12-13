'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, DollarSign } from 'lucide-react';
import type { Booking } from '@/lib/types';

function BookingCard({ booking, userRole }: { booking: Booking & { seeker?: any; provider?: any }; userRole: 'seeker' | 'provider' }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const otherUser = userRole === 'seeker' ? booking.provider : booking.seeker;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {userRole === 'seeker' ? 'Booking with' : 'Booking from'} {otherUser?.id || 'Unknown'}
          </CardTitle>
          <Badge className={`${getStatusColor(booking.status || 'pending')} text-white`}>
            {(booking.status || 'pending').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(booking.date.toISOString())}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatTime(booking.date.toISOString())} - {booking.duration} minutes</span>
          </div>
          {booking.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{booking.location}</span>
            </div>
          )}
          {booking.provider?.hourlyRate && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>${booking.provider.hourlyRate}/hour</span>
            </div>
          )}
          {booking.notes && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            {booking.status === 'pending' && userRole === 'provider' && (
              <>
                <Button size="sm" variant="default">Accept</Button>
                <Button size="sm" variant="outline">Decline</Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <Button size="sm" variant="outline">Reschedule</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<(Booking & { seeker?: any; provider?: any })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('userId', user.id)
          .single();

        const userRole = profile?.role || 'seeker';

        // Fetch bookings based on role
        let query = supabase
          .from('bookings')
          .select(`
            *,
            seeker:profiles!seeker_id(id),
            provider:profiles!provider_id(id)
          `);

        if (userRole === 'seeker') {
          query = query.eq('seeker_id', user.id);
        } else {
          query = query.eq('provider_id', user.id);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, supabase]);

  const filterBookings = (status: string) => {
    return bookings.filter(booking => booking.status === status);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your appointments and schedules
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {filterBookings('confirmed').map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={bookings[0]?.seekerId === user?.id ? 'seeker' : 'provider'}
              />
            ))}
            {filterBookings('confirmed').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No upcoming bookings
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {filterBookings('pending').map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={bookings[0]?.seekerId === user?.id ? 'seeker' : 'provider'}
              />
            ))}
            {filterBookings('pending').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No pending bookings
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {filterBookings('completed').map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={bookings[0]?.seekerId === user?.id ? 'seeker' : 'provider'}
              />
            ))}
            {filterBookings('completed').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No completed bookings
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="space-y-4">
            {filterBookings('cancelled').map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={bookings[0]?.seekerId === user?.id ? 'seeker' : 'provider'}
              />
            ))}
            {filterBookings('cancelled').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No cancelled bookings
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
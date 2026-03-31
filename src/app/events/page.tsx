import { Suspense } from 'react';
import { EventsHub } from '@/components/events/events-hub';
import { AppLayout } from '@/components/app-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Events',
  description: 'Discover upcoming events, manage your RSVPs, and host your own.',
};

export default function EventsPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading events…</span>
        </div>
      }>
        <EventsHub />
      </Suspense>
    </AppLayout>
  );
}

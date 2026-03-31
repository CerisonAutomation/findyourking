import { Suspense } from 'react';
import { EventsFeed } from '@/components/events/events-feed';
import { AppLayout } from '@/components/app-layout';

export const metadata = {
  title: 'Events',
  description: 'Discover and RSVP to events near you.',
};

export default function EventsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
          <h1 className="text-lg font-bold">Events</h1>
          <p className="text-xs text-muted-foreground">Discover what&apos;s happening near you</p>
        </header>
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Loading events…</span>
          </div>
        }>
          <EventsFeed />
        </Suspense>
      </div>
    </AppLayout>
  );
}

'use client';

import { useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { useEvents, useRsvp } from '@/hooks/use-events';
import { useUser } from '@/hooks/use-user';
import { DEFAULT_EVENT_FILTERS } from '@/lib/types';
import type { EventWithMeta } from '@/lib/types';
import { EVENT_CATEGORY_META } from '@/lib/event-category-meta';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Feed ─────────────────────────────────────────────────────────────────────

export function EventsFeed() {
  const { user } = useUser();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useEvents(DEFAULT_EVENT_FILTERS);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const events = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-destructive">Failed to load events. Please try again.</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">No upcoming events found.</p>
        <p className="text-xs text-muted-foreground">Check back soon or create your own!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} userId={user?.id} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function EventCard({
  event,
  userId,
}: {
  event: EventWithMeta;
  userId: string | undefined;
}) {
  const rsvpMutation = useRsvp(event.id);
  const meta = EVENT_CATEGORY_META[event.category] ?? EVENT_CATEGORY_META.other;
  const { Icon } = meta;

  return (
    <article
      className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-lg"
      aria-label={event.title}
    >
      {/* Cover image or coloured category tile */}
      {event.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={cn(
            'aspect-video w-full flex flex-col items-center justify-center gap-2',
            meta.bgCls,
          )}
        >
          <Icon className={cn('size-10', meta.iconCls)} aria-hidden="true" />
          <span className={cn('text-xs font-semibold tracking-wide uppercase', meta.iconCls)}>
            {meta.label}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{event.title}</h3>
          {/* Coloured category pill */}
          <span
            className={cn(
              'shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
              meta.bgCls,
              meta.iconCls,
              meta.borderCls,
            )}
          >
            <Icon className="size-2.5" aria-hidden="true" />
            {meta.label}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" aria-hidden="true" />
            {format(new Date(event.startAt), 'EEE, MMM d · h:mm a')}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" aria-hidden="true" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" aria-hidden="true" />
            {event.attendeeCount ?? 0} going
          </span>
        </div>

        {userId && (
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              variant={event.myRsvp === 'going' ? 'default' : 'outline'}
              className="flex-1 rounded-full text-xs h-8"
              disabled={rsvpMutation.isPending}
              onClick={() => rsvpMutation.mutate({ userId, status: 'going' })}
            >
              {event.myRsvp === 'going' ? '✓ Going' : 'Going'}
            </Button>
            <Button
              size="sm"
              variant={event.myRsvp === 'maybe' ? 'secondary' : 'outline'}
              className="flex-1 rounded-full text-xs h-8"
              disabled={rsvpMutation.isPending}
              onClick={() => rsvpMutation.mutate({ userId, status: 'maybe' })}
            >
              Maybe
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useEvents, useRsvp } from '@/hooks/use-events';
import { DEFAULT_EVENT_FILTERS } from '@/lib/types';
import type { EventWithMeta, EventCategory } from '@/lib/types';
import { format, isPast } from 'date-fns';
import {
  Plus,
  Loader2,
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  X,
  Check,
  PartyPopper,
  Utensils,
  Wine,
  Trees,
  Trophy,
  Palette,
  Plane,
  Gamepad2,
  Music2,
  Coffee,
  Sparkles,
  Crown,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ─── Category → Icon map (NO emojis anywhere) ────────────────────────────────
const CATEGORY_ICON: Record<string, LucideIcon> = {
  party:    Crown,
  dinner:   Utensils,
  drinks:   Wine,
  outdoor:  Trees,
  sports:   Trophy,
  cultural: Palette,
  travel:   Plane,
  gaming:   Gamepad2,
  music:    Music2,
  casual:   Coffee,
  other:    Sparkles,
};

const CATEGORIES: EventCategory[] = [
  'party', 'dinner', 'drinks', 'outdoor', 'sports',
  'cultural', 'travel', 'gaming', 'music', 'casual', 'other',
];

// ─── Data helpers ─────────────────────────────────────────────────────────────
async function fetchMyRsvps(userId: string): Promise<EventWithMeta[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('event_rsvps')
    .select(`
      status,
      event:events!inner(
        *,
        host:profiles!events_host_id_fkey(user_id, display_name, avatar_url, is_verified),
        rsvp_count:event_rsvps(count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    ...(r.event as unknown as EventWithMeta),
    myRsvp:       r.status as 'going' | 'maybe' | 'declined',
    attendeeCount: (r.event as unknown as { rsvp_count: { count: number }[] }).rsvp_count?.[0]?.count ?? 0,
  }));
}

async function fetchHostedEvents(userId: string): Promise<EventWithMeta[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles!events_host_id_fkey(user_id, display_name, avatar_url, is_verified),
      rsvp_count:event_rsvps(count)
    `)
    .eq('host_id', userId)
    .order('start_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    ...(e as unknown as EventWithMeta),
    attendeeCount: e.rsvp_count?.[0]?.count ?? 0,
  }));
}

interface CreateEventInput {
  title:        string;
  description:  string;
  category:     EventCategory;
  location:     string;
  startAt:      string;
  endAt:        string;
  maxAttendees?: number;
  isPublic:     boolean;
  price?:       number;
}

async function createEvent(input: CreateEventInput & { hostId: string }): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('events').insert({
    host_id:       input.hostId,
    title:         input.title,
    description:   input.description,
    category:      input.category,
    location:      input.location,
    start_at:      input.startAt,
    end_at:        input.endAt || null,
    max_attendees: input.maxAttendees || null,
    is_public:     input.isPublic,
    price:         input.price || null,
  });
  if (error) throw new Error(error.message);
}

async function cancelRsvp(eventId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('event_rsvps').delete()
    .eq('event_id', eventId).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

async function cancelEvent(eventId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('events').update({ is_cancelled: true }).eq('id', eventId);
  if (error) throw new Error(error.message);
}

// ─── CategoryIcon helper ──────────────────────────────────────────────────────
function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[category] ?? Sparkles;
  return <Icon className={className ?? 'size-5'} aria-hidden="true" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function EventsHub() {
  const { user }      = useUser();
  const qc            = useQueryClient();
  const [tab, setTab] = useState('discover');
  const [detailEvent, setDetailEvent] = useState<EventWithMeta | null>(null);
  const [createOpen,  setCreateOpen]  = useState(false);

  const {
    data: discoverData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isDiscoverLoading,
  } = useEvents(DEFAULT_EVENT_FILTERS);
  const discoverEvents = discoverData?.pages.flatMap((p) => p.data) ?? [];

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage();
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const { data: myRsvps = [],  isLoading: isRsvpsLoading  } = useQuery({
    queryKey: ['myRsvps',      user?.id],
    queryFn:  () => fetchMyRsvps(user!.id),
    enabled:  !!user,
  });

  const { data: hosted = [],   isLoading: isHostedLoading } = useQuery({
    queryKey: ['hostedEvents', user?.id],
    queryFn:  () => fetchHostedEvents(user!.id),
    enabled:  !!user,
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: ({ eventId }: { eventId: string }) => cancelRsvp(eventId, user!.id),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['myRsvps', user?.id] }),
    onError:    (e: Error) => toast.error(e.message),
  });

  const cancelEventMutation = useMutation({
    mutationFn: ({ eventId }: { eventId: string }) => cancelEvent(eventId),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['hostedEvents', user?.id] }),
    onError:    (e: Error) => toast.error(e.message),
  });

  const rsvpMutation = useRsvp(detailEvent?.id ?? '');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <div className="flex-1">
          <h1 className="text-lg font-bold">Events</h1>
          <p className="text-xs text-muted-foreground">Discover, RSVP, and host</p>
        </div>
        {user && (
          <Button size="sm" onClick={() => setCreateOpen(true)} aria-label="Create event">
            <Plus className="size-4 mr-1" /> Create
          </Button>
        )}
      </header>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="mx-4 mt-3 shrink-0">
          <TabsTrigger value="discover" className="flex-1">Discover</TabsTrigger>
          <TabsTrigger value="going"    className="flex-1">
            Going{myRsvps.filter((e) => e.myRsvp === 'going').length > 0
              ? ` (${myRsvps.filter((e) => e.myRsvp === 'going').length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="hosting"  className="flex-1">
            Hosting{hosted.length > 0 ? ` (${hosted.length})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* DISCOVER */}
        <TabsContent value="discover" className="flex-1 overflow-y-auto mt-0">
          {isDiscoverLoading ? (
            <Spinner />
          ) : discoverEvents.length === 0 ? (
            <EmptyState
              icon={<PartyPopper className="size-12 opacity-30" />}
              title="No upcoming events"
              subtitle="Be the first to create one!"
              action={user ? <Button size="sm" onClick={() => setCreateOpen(true)}>Create Event</Button> : null}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {discoverEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={user?.id}
                  onOpen={() => setDetailEvent(event)}
                />
              ))}
              <div ref={sentinelRef} className="col-span-full h-4" aria-hidden="true" />
              {isFetchingNextPage && (
                <div className="col-span-full flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* GOING */}
        <TabsContent value="going" className="flex-1 overflow-y-auto mt-0">
          {isRsvpsLoading ? <Spinner /> : myRsvps.length === 0 ? (
            <EmptyState
              icon={<Ticket className="size-12 opacity-30" />}
              title="No RSVPs yet"
              subtitle="Browse Discover and tap Going on an event."
            />
          ) : (
            <div className="divide-y pb-20">
              {myRsvps.map((event) => (
                <RsvpRow
                  key={event.id}
                  event={event}
                  onOpen={() => setDetailEvent(event)}
                  onCancel={() => cancelRsvpMutation.mutate({ eventId: event.id })}
                  isCancelling={cancelRsvpMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* HOSTING */}
        <TabsContent value="hosting" className="flex-1 overflow-y-auto mt-0">
          {isHostedLoading ? <Spinner /> : hosted.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-12 opacity-30" />}
              title="No hosted events"
              subtitle="Create an event to see it here."
              action={user ? <Button size="sm" onClick={() => setCreateOpen(true)}>Host an Event</Button> : null}
            />
          ) : (
            <div className="divide-y pb-20">
              {hosted.map((event) => (
                <HostedRow
                  key={event.id}
                  event={event}
                  onOpen={() => setDetailEvent(event)}
                  onCancel={() => cancelEventMutation.mutate({ eventId: event.id })}
                  isCancelling={cancelEventMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Detail Dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          {detailEvent && (
            <EventDetail
              event={detailEvent}
              userId={user?.id}
              rsvpMutation={rsvpMutation}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Host an Event</SheetTitle>
          </SheetHeader>
          {user && (
            <CreateEventForm
              userId={user.id}
              onSuccess={() => {
                setCreateOpen(false);
                void qc.invalidateQueries({ queryKey: ['events'] });
                void qc.invalidateQueries({ queryKey: ['hostedEvents', user?.id] });
                setTab('hosting');
                toast.success('Event created successfully.');
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="animate-spin size-6 text-muted-foreground" />
    </div>
  );
}

function EmptyState({
  icon, title, subtitle, action,
}: {
  icon:     React.ReactNode;
  title:    string;
  subtitle: string;
  action?:  React.ReactNode | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 px-8 text-center text-muted-foreground">
      {icon}
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm">{subtitle}</p>
      {action}
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, userId, onOpen }: {
  event:  EventWithMeta;
  userId: string | undefined;
  onOpen: () => void;
}) {
  const rsvpMutation = useRsvp(event.id);

  return (
    <article
      className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
      aria-label={event.title}
      onClick={onOpen}
    >
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
        /* Icon placeholder — NO emoji */
        <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <CategoryIcon category={event.category} className="size-10 text-primary/50" />
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{event.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">{event.category}</Badge>
        </div>

        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {format(new Date(event.startAt as unknown as string), 'EEE, MMM d · h:mm a')}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" />{event.attendeeCount ?? 0} going
          </span>
        </div>

        {userId && (
          <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={event.myRsvp === 'going' ? 'default' : 'outline'}
              className="flex-1 text-xs h-8"
              disabled={rsvpMutation.isPending}
              onClick={() => rsvpMutation.mutate({ userId, status: 'going' })}
            >
              {event.myRsvp === 'going'
                ? <><Check className="size-3 mr-1" />Going</>
                : 'Going'}
            </Button>
            <Button
              size="sm"
              variant={event.myRsvp === 'maybe' ? 'secondary' : 'outline'}
              className="flex-1 text-xs h-8"
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

// ─── RsvpRow ──────────────────────────────────────────────────────────────────
function RsvpRow({ event, onOpen, onCancel, isCancelling }: {
  event:        EventWithMeta;
  onOpen:       () => void;
  onCancel:     () => void;
  isCancelling: boolean;
}) {
  const past = isPast(new Date((event.endAt ?? event.startAt) as unknown as string));

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer"
      onClick={onOpen}
    >
      {/* Icon tile */}
      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <CategoryIcon category={event.category} className="size-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(event.startAt as unknown as string), 'EEE, MMM d · h:mm a')}
        </p>
        <Badge
          variant={event.myRsvp === 'going' ? 'default' : 'secondary'}
          className="text-[10px] mt-0.5 capitalize"
        >
          {event.myRsvp}
        </Badge>
      </div>

      {!past && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          disabled={isCancelling}
          aria-label="Cancel RSVP"
        >
          {isCancelling
            ? <Loader2 className="size-3 animate-spin" />
            : <X className="size-3" />}
        </Button>
      )}
    </div>
  );
}

// ─── HostedRow ────────────────────────────────────────────────────────────────
function HostedRow({ event, onOpen, onCancel, isCancelling }: {
  event:        EventWithMeta;
  onOpen:       () => void;
  onCancel:     () => void;
  isCancelling: boolean;
}) {
  const isCancelled = (event as unknown as { is_cancelled?: boolean }).is_cancelled;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer"
      onClick={onOpen}
    >
      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <CategoryIcon category={event.category} className="size-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(event.startAt as unknown as string), 'EEE, MMM d · h:mm a')}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Users className="size-3" />{event.attendeeCount ?? 0} going
          </span>
          {isCancelled && (
            <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
          )}
        </div>
      </div>

      {!isCancelled && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-destructive hover:text-destructive text-xs"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          disabled={isCancelling}
          aria-label="Cancel event"
        >
          {isCancelling ? <Loader2 className="size-3 animate-spin" /> : 'Cancel'}
        </Button>
      )}
    </div>
  );
}

// ─── EventDetail ──────────────────────────────────────────────────────────────
function EventDetail({ event, userId, rsvpMutation }: {
  event:        EventWithMeta;
  userId:       string | undefined;
  rsvpMutation: ReturnType<typeof useRsvp>;
}) {
  const startStr = format(new Date(event.startAt as unknown as string), 'EEEE, MMMM d, yyyy · h:mm a');
  const endStr   = event.endAt
    ? format(new Date(event.endAt as unknown as string), 'h:mm a')
    : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-left leading-snug flex items-center gap-2">
          <CategoryIcon category={event.category} className="size-5 text-primary shrink-0" />
          {event.title}
        </DialogTitle>
      </DialogHeader>

      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full rounded-xl object-cover max-h-48 mt-2"
        />
      )}

      <div className="flex flex-col gap-2.5 mt-3 text-sm">
        <p className="flex items-start gap-2">
          <CalendarDays className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <span>{startStr}{endStr ? ` – ${endStr}` : ''}</span>
        </p>
        {event.location && (
          <p className="flex items-start gap-2">
            <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
            <span>{event.location}</span>
          </p>
        )}
        <p className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span>{event.attendeeCount ?? 0} people going</span>
        </p>
        {event.price && Number(event.price) > 0 && (
          <p className="flex items-center gap-2">
            <Ticket className="size-4 text-muted-foreground" />
            <span>${Number(event.price).toFixed(2)} per person</span>
          </p>
        )}
        {event.description && (
          <p className="text-muted-foreground leading-relaxed mt-1">
            {event.description as unknown as string}
          </p>
        )}
      </div>

      {userId && (
        <div className="flex gap-2 mt-5">
          <Button
            className="flex-1"
            variant={event.myRsvp === 'going' ? 'default' : 'outline'}
            disabled={rsvpMutation.isPending}
            onClick={() => rsvpMutation.mutate({ userId, status: 'going' })}
          >
            {event.myRsvp === 'going'
              ? <><Check className="mr-1.5 size-4" />Going!</>
              : 'Going'}
          </Button>
          <Button
            className="flex-1"
            variant={event.myRsvp === 'maybe' ? 'secondary' : 'outline'}
            disabled={rsvpMutation.isPending}
            onClick={() => rsvpMutation.mutate({ userId, status: 'maybe' })}
          >
            Maybe
          </Button>
          {event.myRsvp && (
            <Button
              variant="ghost"
              size="icon"
              disabled={rsvpMutation.isPending}
              onClick={() => rsvpMutation.mutate({ userId, status: 'declined' })}
              aria-label="Decline"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      )}
    </>
  );
}

// ─── CreateEventForm ──────────────────────────────────────────────────────────
function CreateEventForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateEventInput>({
    title:        '',
    description:  '',
    category:     'casual',
    location:     '',
    startAt:      '',
    endAt:        '',
    isPublic:     true,
    maxAttendees: undefined,
    price:        undefined,
  });

  const mutation = useMutation({
    mutationFn: () => createEvent({ ...form, hostId: userId }),
    onSuccess,
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof CreateEventInput, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="flex flex-col gap-4 mt-4 pb-8"
    >
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="evt-title">Event title *</label>
        <Input
          id="evt-title" required maxLength={100}
          placeholder="Name your event…"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Category *</label>
        <Select value={form.category} onValueChange={(v) => set('category', v as EventCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON[cat] ?? Sparkles;
              return (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-2 capitalize">
                    <Icon className="size-4 shrink-0" />
                    {cat}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="evt-location">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="evt-location" maxLength={200}
            className="pl-9"
            placeholder="Address or online link…"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-start">Start *</label>
          <Input
            id="evt-start" type="datetime-local" required
            value={form.startAt}
            onChange={(e) => set('startAt', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-end">End</label>
          <Input
            id="evt-end" type="datetime-local"
            value={form.endAt}
            onChange={(e) => set('endAt', e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="evt-desc">Description</label>
        <Textarea
          id="evt-desc" maxLength={1000} rows={3}
          placeholder="What's this event about?"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      {/* Max attendees + Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-max">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />Max attendees
            </span>
          </label>
          <Input
            id="evt-max" type="number" min={1}
            placeholder="Unlimited"
            value={form.maxAttendees ?? ''}
            onChange={(e) => set('maxAttendees', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-price">
            <span className="flex items-center gap-1.5">
              <Ticket className="size-3.5" />Price ($)
            </span>
          </label>
          <Input
            id="evt-price" type="number" min={0} step="0.01"
            placeholder="Free"
            value={form.price ?? ''}
            onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      {/* Public / Private toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={form.isPublic}
        onClick={() => set('isPublic', !form.isPublic)}
        className={cn(
          'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors w-full',
          form.isPublic
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-border bg-muted/30 text-muted-foreground',
        )}
      >
        {form.isPublic
          ? <Globe className="size-4 shrink-0" />
          : <Lock  className="size-4 shrink-0" />}
        <span className="flex-1 text-left">
          {form.isPublic ? 'Public event — anyone can discover it' : 'Private event — invite only'}
        </span>
        <div className={cn(
          'relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0',
          form.isPublic ? 'bg-primary' : 'bg-muted-foreground/30',
        )}>
          <span className={cn(
            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
            form.isPublic ? 'translate-x-4' : 'translate-x-0',
          )} />
        </div>
      </button>

      <Button
        type="submit"
        className="w-full mt-2"
        disabled={mutation.isPending || !form.title || !form.startAt}
      >
        {mutation.isPending ? (
          <><Loader2 className="size-4 animate-spin mr-2" />Creating…</>
        ) : (
          <><CalendarDays className="size-4 mr-2" />Create Event</>
        )}
      </Button>
    </form>
  );
}

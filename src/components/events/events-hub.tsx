'use client';

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useEvents, useRsvp } from '@/hooks/use-events';
import { DEFAULT_EVENT_FILTERS } from '@/lib/types';
import type { EventWithMeta, EventCategory } from '@/lib/types';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Loader2,
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  X,
  Check,
  Dumbbell,
  Film,
  Utensils,
  Coffee,
  Wine,
  Mountain,
  Trophy,
  Gamepad2,
  PartyPopper,
  HandshakeIcon,
  Sparkles,
  Clock,
  Globe,
  Lock,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ─── Chill-style category definitions ────────────────────────────────────────

interface CategoryDef {
  label: string;
  icon:  LucideIcon;
  color: string; // Tailwind bg class for the tile
}

const CATEGORIES: Record<EventCategory, CategoryDef> = {
  gym:     { label: 'Gym',     icon: Dumbbell,       color: 'bg-orange-500/20 text-orange-400'    },
  cinema:  { label: 'Cinema', icon: Film,            color: 'bg-purple-500/20 text-purple-400'   },
  dinner:  { label: 'Dinner', icon: Utensils,        color: 'bg-amber-500/20  text-amber-400'    },
  coffee:  { label: 'Coffee', icon: Coffee,          color: 'bg-yellow-600/20 text-yellow-500'   },
  drinks:  { label: 'Drinks', icon: Wine,            color: 'bg-rose-500/20   text-rose-400'     },
  hiking:  { label: 'Hiking', icon: Mountain,        color: 'bg-green-500/20  text-green-400'    },
  sports:  { label: 'Sports', icon: Trophy,          color: 'bg-blue-500/20   text-blue-400'     },
  gaming:  { label: 'Gaming', icon: Gamepad2,        color: 'bg-indigo-500/20 text-indigo-400'   },
  party:   { label: 'Party',  icon: PartyPopper,     color: 'bg-pink-500/20   text-pink-400'     },
  meet:    { label: 'Meet',   icon: HandshakeIcon,   color: 'bg-teal-500/20   text-teal-400'     },
  other:   { label: 'Other',  icon: Sparkles,        color: 'bg-slate-500/20  text-slate-400'    },
};

const CATEGORY_KEYS = Object.keys(CATEGORIES) as EventCategory[];

// ─── Data helpers ──────────────────────────────────────────────────────────────

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
    myRsvp:        r.status as 'going' | 'maybe' | 'declined',
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

// ─── CategoryTile ─────────────────────────────────────────────────────────────

/**
 * Chill-style square icon tile for the type picker grid.
 */
function CategoryTile({
  category,
  selected,
  onClick,
}: {
  category: EventCategory;
  selected: boolean;
  onClick:  () => void;
}) {
  const def  = CATEGORIES[category];
  const Icon = def.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-3 px-1 transition-all',
        selected
          ? 'border-primary bg-primary/10 shadow-md scale-[1.04]'
          : 'border-transparent bg-muted/50 hover:bg-muted',
      )}
      aria-pressed={selected}
    >
      <div className={cn('rounded-xl p-2', def.color)}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <span className={cn('text-[11px] font-medium leading-none truncate w-full text-center', selected ? 'text-primary' : 'text-muted-foreground')}>
        {def.label}
      </span>
    </button>
  );
}

// ─── Inline CategoryIcon (row / card) ────────────────────────────────────────

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const def  = CATEGORIES[category as EventCategory] ?? CATEGORIES.other;
  const Icon = def.icon;
  return <Icon className={className ?? 'size-5'} aria-hidden="true" />;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
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
    <div className="flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
      <div className="text-muted-foreground/40">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      {action}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

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
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">Events</h1>
          <p className="text-[11px] text-muted-foreground">Meet up IRL</p>
        </div>
        {user && (
          <Button
            size="sm"
            className="rounded-full gap-1.5 px-4"
            onClick={() => setCreateOpen(true)}
            aria-label="Create event"
          >
            <Plus className="size-3.5" /> Create
          </Button>
        )}
      </header>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="mx-4 mt-3 shrink-0 rounded-xl">
          <TabsTrigger value="discover" className="flex-1 rounded-lg">Discover</TabsTrigger>
          <TabsTrigger value="going"    className="flex-1 rounded-lg">
            Going{myRsvps.filter((e) => e.myRsvp === 'going').length > 0
              ? ` (${myRsvps.filter((e) => e.myRsvp === 'going').length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="hosting"  className="flex-1 rounded-lg">
            Hosting{hosted.length > 0 ? ` (${hosted.length})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* ── DISCOVER ── */}
        <TabsContent value="discover" className="flex-1 overflow-y-auto mt-0">
          {isDiscoverLoading ? <Spinner /> : discoverEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-14" />}
              title="No upcoming events"
              subtitle="Be the first to create one!"
              action={user
                ? <Button size="sm" className="rounded-full mt-1" onClick={() => setCreateOpen(true)}>Create Event</Button>
                : null}
            />
          ) : (
            <div className="flex flex-col gap-3 p-4 pb-20">
              {discoverEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={user?.id}
                  onOpen={() => setDetailEvent(event)}
                />
              ))}
              <div ref={sentinelRef} className="h-4" aria-hidden="true" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── GOING ── */}
        <TabsContent value="going" className="flex-1 overflow-y-auto mt-0">
          {isRsvpsLoading ? <Spinner /> : myRsvps.length === 0 ? (
            <EmptyState
              icon={<Ticket className="size-14" />}
              title="No RSVPs yet"
              subtitle="Browse Discover and tap Going on an event."
            />
          ) : (
            <div className="flex flex-col gap-3 p-4 pb-20">
              {myRsvps.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onOpen={() => setDetailEvent(event)}
                  actions={
                    !isPast(new Date((event.endAt ?? event.startAt) as unknown as string)) ? (
                      <Button
                        size="sm" variant="ghost"
                        className="text-destructive hover:text-destructive h-8 px-2"
                        onClick={(e) => { e.stopPropagation(); cancelRsvpMutation.mutate({ eventId: event.id }); }}
                        disabled={cancelRsvpMutation.isPending}
                        aria-label="Cancel RSVP"
                      >
                        {cancelRsvpMutation.isPending
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <X className="size-3.5" />}
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── HOSTING ── */}
        <TabsContent value="hosting" className="flex-1 overflow-y-auto mt-0">
          {isHostedLoading ? <Spinner /> : hosted.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-14" />}
              title="No hosted events"
              subtitle="Create an event to see it here."
              action={user
                ? <Button size="sm" className="rounded-full mt-1" onClick={() => setCreateOpen(true)}>Host an Event</Button>
                : null}
            />
          ) : (
            <div className="flex flex-col gap-3 p-4 pb-20">
              {hosted.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onOpen={() => setDetailEvent(event)}
                  actions={
                    !(event as unknown as { is_cancelled?: boolean }).is_cancelled ? (
                      <Button
                        size="sm" variant="ghost"
                        className="text-destructive hover:text-destructive h-8 px-2 text-xs"
                        onClick={(e) => { e.stopPropagation(); cancelEventMutation.mutate({ eventId: event.id }); }}
                        disabled={cancelEventMutation.isPending}
                        aria-label="Cancel event"
                      >
                        {cancelEventMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Cancel'}
                      </Button>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Event Detail Dialog ── */}
      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl">
          {detailEvent && (
            <EventDetail
              event={detailEvent}
              userId={user?.id}
              rsvpMutation={rsvpMutation}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create Event Sheet ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[95vh] overflow-y-auto px-4">
          <SheetHeader className="mb-1">
            <SheetTitle className="text-left text-base font-bold">Create Event</SheetTitle>
          </SheetHeader>
          {user && (
            <CreateEventForm
              userId={user.id}
              onSuccess={() => {
                setCreateOpen(false);
                void qc.invalidateQueries({ queryKey: ['events'] });
                void qc.invalidateQueries({ queryKey: ['hostedEvents', user?.id] });
                setTab('hosting');
                toast.success('Event created.');
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

/**
 * Horizontal card — Chill-style: colored icon tile on the left,
 * event metadata on the right, RSVP buttons stacked.
 */
function EventCard({
  event, userId, onOpen,
}: {
  event:  EventWithMeta;
  userId: string | undefined;
  onOpen: () => void;
}) {
  const rsvpMutation = useRsvp(event.id);
  const def  = CATEGORIES[event.category as EventCategory] ?? CATEGORIES.other;
  const Icon = def.icon;
  const startStr = format(new Date(event.startAt as unknown as string), 'EEE, MMM d · h:mm a');

  return (
    <article
      className="flex gap-3 rounded-2xl border bg-card p-3.5 cursor-pointer hover:bg-muted/30 transition-colors active:scale-[0.99]"
      onClick={onOpen}
      aria-label={event.title}
    >
      {/* Left: cover image OR category tile */}
      {event.imageUrl ? (
        <div className="size-16 rounded-xl overflow-hidden shrink-0">
          <img src={event.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className={cn('size-16 rounded-xl flex items-center justify-center shrink-0', def.color.replace('text-', 'bg-').split(' ')[0] + ' ' + def.color.split(' ')[0])}>
          {/* fallback: render the icon at larger size */}
          <div className={cn('rounded-xl p-3', def.color)}>
            <Icon className="size-7" />
          </div>
        </div>
      )}

      {/* Right: info */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">{event.title}</h3>
          <Badge variant="secondary" className="text-[10px] capitalize shrink-0 ml-1">{def.label}</Badge>
        </div>

        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3 shrink-0" />{startStr}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3 shrink-0" />{event.attendeeCount ?? 0} going
          </span>
        </div>

        {userId && (
          <div className="flex gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={event.myRsvp === 'going' ? 'default' : 'outline'}
              className="flex-1 h-7 text-xs rounded-full"
              disabled={rsvpMutation.isPending}
              onClick={() => rsvpMutation.mutate({ userId, status: 'going' })}
            >
              {event.myRsvp === 'going' ? <><Check className="size-3 mr-1" />Going</> : 'Going'}
            </Button>
            <Button
              size="sm"
              variant={event.myRsvp === 'maybe' ? 'secondary' : 'outline'}
              className="flex-1 h-7 text-xs rounded-full"
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

// ─── EventRow (Going / Hosting tabs) ─────────────────────────────────────────

function EventRow({
  event, onOpen, actions,
}: {
  event:   EventWithMeta;
  onOpen:  () => void;
  actions?: React.ReactNode;
}) {
  const def  = CATEGORIES[event.category as EventCategory] ?? CATEGORIES.other;
  const Icon = def.icon;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      {/* Icon tile */}
      <div className={cn('size-11 rounded-xl flex items-center justify-center shrink-0', def.color)}>
        <Icon className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="size-3" />
          {format(new Date(event.startAt as unknown as string), 'EEE, MMM d · h:mm a')}
        </p>
        {event.myRsvp && (
          <Badge variant={event.myRsvp === 'going' ? 'default' : 'secondary'} className="text-[10px] mt-0.5 capitalize">
            {event.myRsvp}
          </Badge>
        )}
      </div>

      {actions ?? <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
    </div>
  );
}

// ─── EventDetail ─────────────────────────────────────────────────────────────

function EventDetail({
  event, userId, rsvpMutation,
}: {
  event:        EventWithMeta;
  userId:       string | undefined;
  rsvpMutation: ReturnType<typeof useRsvp>;
}) {
  const def      = CATEGORIES[event.category as EventCategory] ?? CATEGORIES.other;
  const Icon     = def.icon;
  const startStr = format(new Date(event.startAt as unknown as string), 'EEEE, MMMM d, yyyy · h:mm a');
  const endStr   = event.endAt
    ? format(new Date(event.endAt as unknown as string), 'h:mm a')
    : null;
  const timeAgo  = formatDistanceToNow(new Date(event.startAt as unknown as string), { addSuffix: true });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-left leading-snug">{event.title}</DialogTitle>
      </DialogHeader>

      {/* Category pill */}
      <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium w-fit mt-1', def.color)}>
        <Icon className="size-3.5" />
        {def.label}
      </div>

      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title}
          className="w-full rounded-2xl object-cover max-h-52 mt-3" />
      )}

      <div className="flex flex-col gap-2.5 mt-4 text-sm">
        <p className="flex items-start gap-2.5">
          <CalendarDays className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <span className="leading-snug">{startStr}{endStr ? ` – ${endStr}` : ''}
            <span className="block text-xs text-muted-foreground">{timeAgo}</span>
          </span>
        </p>
        {event.location && (
          <p className="flex items-start gap-2.5">
            <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
            <span>{event.location}</span>
          </p>
        )}
        <p className="flex items-center gap-2.5">
          <Users className="size-4 text-muted-foreground" />
          <span>{event.attendeeCount ?? 0} people going</span>
        </p>
        {event.price && Number(event.price) > 0 && (
          <p className="flex items-center gap-2.5">
            <Ticket className="size-4 text-muted-foreground" />
            <span>${Number(event.price).toFixed(2)} per person</span>
          </p>
        )}
        {event.description && (
          <p className="text-muted-foreground leading-relaxed text-sm mt-1">
            {event.description as unknown as string}
          </p>
        )}
      </div>

      {userId && (
        <div className="flex gap-2 mt-6">
          <Button
            className="flex-1 rounded-full"
            variant={event.myRsvp === 'going' ? 'default' : 'outline'}
            disabled={rsvpMutation.isPending}
            onClick={() => rsvpMutation.mutate({ userId, status: 'going' })}
          >
            {event.myRsvp === 'going'
              ? <><Check className="mr-1.5 size-4" />Going!</>
              : <><Heart className="mr-1.5 size-4" />Going</>}
          </Button>
          <Button
            className="flex-1 rounded-full"
            variant={event.myRsvp === 'maybe' ? 'secondary' : 'outline'}
            disabled={rsvpMutation.isPending}
            onClick={() => rsvpMutation.mutate({ userId, status: 'maybe' })}
          >
            Maybe
          </Button>
          {event.myRsvp && (
            <Button
              variant="ghost" size="icon" className="rounded-full"
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

// ─── CreateEventForm ─────────────────────────────────────────────────────────

function CreateEventForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateEventInput>({
    title:        '',
    description:  '',
    category:     'meet',
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
      className="flex flex-col gap-5 mt-2 pb-8"
    >
      {/* ── Event Type grid (Chill-style) ── */}
      <div>
        <p className="text-sm font-medium mb-2.5">Event Type</p>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_KEYS.map((cat) => (
            <CategoryTile
              key={cat}
              category={cat}
              selected={form.category === cat}
              onClick={() => set('category', cat)}
            />
          ))}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="evt-title">Title *</label>
        <Input
          id="evt-title" required maxLength={100}
          placeholder={`${CATEGORIES[form.category].label} session…`}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* ── Location ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="evt-location">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="evt-location" maxLength={200} className="pl-9 rounded-xl"
            placeholder="Address or online link…"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>
      </div>

      {/* ── Date / Time ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-start">Date *</label>
          <Input
            id="evt-start" type="datetime-local" required className="rounded-xl"
            value={form.startAt}
            onChange={(e) => set('startAt', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-end">End time</label>
          <Input
            id="evt-end" type="datetime-local" className="rounded-xl"
            value={form.endAt}
            onChange={(e) => set('endAt', e.target.value)}
          />
        </div>
      </div>

      {/* ── Description ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="evt-desc">Description</label>
        <Textarea
          id="evt-desc" maxLength={1000} rows={3} className="rounded-xl resize-none"
          placeholder="What's this event about?"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      {/* ── Capacity + Price ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-max">
            <span className="flex items-center gap-1.5"><Users className="size-3.5" />Spots</span>
          </label>
          <Input
            id="evt-max" type="number" min={1} className="rounded-xl"
            placeholder="Unlimited"
            value={form.maxAttendees ?? ''}
            onChange={(e) => set('maxAttendees', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="evt-price">
            <span className="flex items-center gap-1.5"><Ticket className="size-3.5" />Price ($)</span>
          </label>
          <Input
            id="evt-price" type="number" min={0} step="0.01" className="rounded-xl"
            placeholder="Free"
            value={form.price ?? ''}
            onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      {/* ── Visibility toggle ── */}
      <button
        type="button"
        role="switch"
        aria-checked={form.isPublic}
        onClick={() => set('isPublic', !form.isPublic)}
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors w-full',
          form.isPublic
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-border bg-muted/40 text-muted-foreground',
        )}
      >
        {form.isPublic ? <Globe className="size-4 shrink-0" /> : <Lock className="size-4 shrink-0" />}
        <span className="flex-1 text-left text-sm">
          {form.isPublic ? 'Public — anyone can discover it' : 'Private — invite only'}
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

      {/* ── Submit ── */}
      <Button
        type="submit"
        className="w-full rounded-full mt-1"
        disabled={mutation.isPending || !form.title || !form.startAt}
      >
        {mutation.isPending
          ? <><Loader2 className="size-4 animate-spin mr-2" />Creating…</>
          : <><CalendarDays className="size-4 mr-2" />Create Event</>}
      </Button>
    </form>
  );
}

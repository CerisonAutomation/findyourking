import type { InferSelectModel } from 'drizzle-orm';
import type {
  profiles,
  bookings,
  messages,
  conversations,
  favorites,
  subscriptions,
  notifications,
  meetNowCards,
  events,
  eventRsvps,
  userPresence,
} from '@/db/schema';

// ─── Domain models (Drizzle-inferred) ────────────────────────────────────────

export type Profile      = InferSelectModel<typeof profiles>;
export type Booking      = InferSelectModel<typeof bookings>;
export type Message      = InferSelectModel<typeof messages>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Favorite     = InferSelectModel<typeof favorites>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Notification = InferSelectModel<typeof notifications>;
export type MeetNowCard  = InferSelectModel<typeof meetNowCards>;
export type Event        = InferSelectModel<typeof events>;
export type EventRsvp    = InferSelectModel<typeof eventRsvps>;
export type UserPresence = InferSelectModel<typeof userPresence>;

/** Client-side camelCase profile shape after transformToCamel() */
export interface UserProfile extends Partial<Profile> {
  id?:             string;
  distanceMiles?:  number;
  distanceKm?:     number;
  isOnline?:       boolean;
  matchScore?:     number;
}

/** Event with attendee count and current user RSVP */
export interface EventWithMeta extends Event {
  attendeeCount: number;
  myRsvp?:       'going' | 'maybe' | 'declined' | null;
  host?:         UserProfile;
  distanceKm?:   number;
}

/** MeetNow card with distance computed client-side */
export interface MeetNowCardWithDistance extends MeetNowCard {
  distanceKm?: number;
  profile?:    UserProfile;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole         = 'seeker' | 'provider' | 'admin';
export type SubscriptionTier = 'free' | 'premium' | 'platinum';
export type BookingStatus    = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type NotificationType = 'message' | 'booking' | 'favorite' | 'match' | 'system' | 'event';
export type EventCategory    = 'party' | 'dinner' | 'drinks' | 'outdoor' | 'sports' | 'cultural' | 'travel' | 'gaming' | 'music' | 'casual' | 'other';
export type RsvpStatus       = 'going' | 'maybe' | 'declined';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  hasMore:    boolean;
  nextCursor?: number;
}

// ─── Discover filters ─────────────────────────────────────────────────────────

export interface DiscoverFilters {
  distanceMiles: number;
  tribes:        string[];
  interests:     string[];
  onlineOnly:    boolean;
  role:          UserRole | 'all';
  minAge:        number;
  maxAge:        number;
  verifiedOnly:  boolean;
}

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  distanceMiles: 50,
  tribes:        [],
  interests:     [],
  onlineOnly:    false,
  role:          'all',
  minAge:        18,
  maxAge:        99,
  verifiedOnly:  false,
};

// ─── Event filters ────────────────────────────────────────────────────────────

export interface EventFilters {
  categories:    EventCategory[];
  distanceMiles: number;
  dateFrom?:     Date;
  dateTo?:       Date;
  freeOnly:      boolean;
}

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  categories:    [],
  distanceMiles: 25,
  freeOnly:      false,
};

// ─── Meet Now filters ─────────────────────────────────────────────────────────

export interface MeetNowFilters {
  radiusKm:   number;
  activeOnly: boolean;
}

export const DEFAULT_MEET_NOW_FILTERS: MeetNowFilters = {
  radiusKm:   10,
  activeOnly: true,
};

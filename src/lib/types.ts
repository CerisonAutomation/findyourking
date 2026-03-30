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
} from '@/db/schema';

// ─── Domain model types (Drizzle-inferred) ───────────────────────────────────

export type Profile        = InferSelectModel<typeof profiles>;
export type Booking        = InferSelectModel<typeof bookings>;
export type Message        = InferSelectModel<typeof messages>;
export type Conversation   = InferSelectModel<typeof conversations>;
export type Favorite       = InferSelectModel<typeof favorites>;
export type Subscription   = InferSelectModel<typeof subscriptions>;
export type Notification   = InferSelectModel<typeof notifications>;
export type MeetNowCard    = InferSelectModel<typeof meetNowCards>;

/**
 * UserProfile is the camelCase client-side shape returned from Supabase
 * raw rows after `transformToCamel()`. Extends Profile with optional
 * computed fields attached on the client.
 */
export interface UserProfile extends Partial<Profile> {
  id?: string;         // aliased from userId for convenience
  distanceMiles?: number;
}

// ─── Enums (mirrors pgEnum values) ───────────────────────────────────────────

export type UserRole         = 'seeker' | 'provider' | 'admin';
export type SubscriptionTier = 'free' | 'premium' | 'platinum';
export type BookingStatus    = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type NotificationType = 'message' | 'booking' | 'favorite' | 'match' | 'system';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ─── Discover filters ─────────────────────────────────────────────────────────

export interface DiscoverFilters {
  distanceMiles: number;
  tribes: string[];
  interests: string[];
  onlineOnly: boolean;
  role: UserRole | 'all';
  minAge: number;
  maxAge: number;
}

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  distanceMiles: 50,
  tribes: [],
  interests: [],
  onlineOnly: false,
  role: 'all',
  minAge: 18,
  maxAge: 99,
};

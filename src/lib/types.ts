import type { InferSelectModel } from 'drizzle-orm';
import type {
  profiles,
  users,
  messages,
  meetNowCards,
  favorites,
  bookings,
  subscriptions,
  notifications,
  adminSettings,
  tribes,
  interests,
} from '@/db/schema';

// ─── Drizzle source-of-truth types ───────────────────────────────────────────
export type User = InferSelectModel<typeof users>;
export type UserProfile = InferSelectModel<typeof profiles> & {
  /** Structured geo-location — object or legacy string, nullable */
  location?: string | { latitude: number; longitude: number; city?: string } | null;
  /** Computed from DB */
  age?: number | null;
  /** Computed / virtual */
  distanceMiles?: number;
};
export type Message = InferSelectModel<typeof messages>;
export type MeetNowCard = InferSelectModel<typeof meetNowCards>;
export type Favorite = InferSelectModel<typeof favorites>;
export type Booking = InferSelectModel<typeof bookings>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Notification = InferSelectModel<typeof notifications>;
export type AdminSetting = InferSelectModel<typeof adminSettings>;
export type Tribe = InferSelectModel<typeof tribes>;
export type Interest = InferSelectModel<typeof interests>;

// ─── Booking statuses ────────────────────────────────────────────────────────
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ─── Role union ───────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'seeker' | 'provider' | 'admin';

// ─── Supabase RPC shapes (snake_case as returned by PostgreSQL) ───────────────
export interface RpcConversationRow {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  unread_count: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
  page: number;
}

// ─── Discover filters ─────────────────────────────────────────────────────────
export interface DiscoverFilters {
  ageRange: [number, number];
  distanceMiles: number;
  tribes: string[];
  interests: string[];
  onlineOnly: boolean;
}

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  ageRange: [18, 65],
  distanceMiles: 50,
  tribes: [],
  interests: [],
  onlineOnly: false,
};

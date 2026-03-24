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
import type { InferSelectModel } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Drizzle-inferred types (source of truth when schema is present)
// ---------------------------------------------------------------------------
export type User = InferSelectModel<typeof users>;
export type UserProfile = InferSelectModel<typeof profiles> & {
  /** Structured location — either a JSON object from the DB or a plain string */
  location?: string | { latitude: number; longitude: number; city?: string } | null;
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

// ---------------------------------------------------------------------------
// Derived union types used across the app
// ---------------------------------------------------------------------------

/** All possible booking statuses stored in the DB */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/** Application-level user roles */
export type UserRole = 'user' | 'seeker' | 'provider' | 'admin';

// ---------------------------------------------------------------------------
// RPC / Realtime row shapes (returned by Supabase RPCs, not Drizzle)
// ---------------------------------------------------------------------------

/**
 * Row shape returned by the `get_user_conversations` Supabase RPC.
 * Column names are snake_case as returned by PostgreSQL.
 */
export interface RpcConversationRow {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  unread_count: number;
}

/**
 * A single chat message as stored in the `messages` table.
 * Used by the chat view for realtime rendering.
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

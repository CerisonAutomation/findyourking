/**
 * TYPES BARREL EXPORT - ZENITH LEGENDARY PRODUCTION READY
 *
 * Central type definitions for the FindYourKing dating platform.
 * All types follow TypeScript strict mode, Supabase conventions, and industry best practices.
 *
 * Per TypeScript docs: https://www.typescriptlang.org/docs/handbook/modules.html
 * Per Supabase docs: https://supabase.com/docs/guides/api/generating-types
 * Per OWASP: https://owasp.org/www-project-top-ten/
 *
 * @module types
 * @version 2.0.0
 * @author FindYourKing Team
 * @license MIT
 */

// ============================================================================
// DATABASE TYPES (Supabase Generated)
// ============================================================================

/**
 * User profile from database
 * Maps to `profiles` table in Supabase with RLS enabled
 *
 * @see {@link https://supabase.com/docs/guides/database/tables}
 */
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'non-binary' | 'other' | null;
  looking_for: 'male' | 'female' | 'non-binary' | 'any' | null;
  location: string | null;
  interests: string[] | null;
  photos: string[] | null;
  verified: boolean;
  role: 'seeker' | 'king' | 'provider' | 'admin';
  tier: 'free' | 'bronze' | 'silver' | 'gold';
  created_at: string;
  updated_at: string;
}

/**
 * Match relationship between two users
 * Maps to `matches` table with bidirectional RLS policies
 */
export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'matched' | 'rejected';
  matched_at: string | null;
  created_at: string;
}

/**
 * Chat message with real-time support
 * Maps to `messages` table with Stream Chat integration
 *
 * @see {@link https://getstream.io/chat/docs/}
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  read: boolean;
  created_at: string;
}

/**
 * Conversation between users
 * Maps to `conversations` table with real-time subscriptions
 */
export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Booking/date reservation
 * Maps to `bookings` table with payment integration
 *
 * @see {@link https://stripe.com/docs/payments}
 */
export interface Booking {
  id: string;
  seeker_id: string;
  provider_id: string;
  date: string;
  time: string;
  duration_hours: number;
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AUTHENTICATION TYPES (Supabase Auth)
// ============================================================================

/**
 * User authentication session
 * Per Supabase Auth docs: https://supabase.com/docs/guides/auth
 */
export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Authenticated user data with metadata
 */
export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  user_metadata: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    role?: Profile['role'];
  };
  created_at: string;
}

// ============================================================================
// CHAT & MESSAGING TYPES (Stream Chat Integration)
// ============================================================================

/**
 * Enhanced chat message with Stream Chat features
 * Supports threads, reactions, and delivery tracking
 *
 * @see {@link https://getstream.io/chat/docs/javascript/message_format/}
 */
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'me' | 'other';
  timestamp: Date;
  attachments?: any[];
  user_id?: string;
  updated_at?: string | Date;
  reactions?: MessageReaction[];
  isRead?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  // Thread support
  parent_id?: string;
  thread_participants?: string[];
  reply_count?: number;
  show_thread?: boolean;
}

/**
 * Message reaction (emoji)
 * Per Stream Chat docs: https://getstream.io/chat/docs/javascript/send_reaction/
 */
export interface MessageReaction {
  type: string;
  user_id: string;
  user?: any;
  created_at: string;
}

/**
 * Real-time chat message payload for broadcasts
 */
export interface ChatMessagePayload {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  channelId: string;
}

// ============================================================================
// AI VIRTUAL BOYFRIEND TYPES
// ============================================================================

/**
 * AI virtual boyfriend personality configuration
 * Based on Big Five personality model + custom traits
 *
 * @see {@link https://en.wikipedia.org/wiki/Big_Five_personality_traits}
 */
export interface BoyfriendPersonalityData {
  openness: number; // 0-100: Imagination, creativity
  conscientiousness: number; // 0-100: Organization, reliability
  extraversion: number; // 0-100: Sociability, assertiveness
  agreeableness: number; // 0-100: Compassion, cooperation
  neuroticism: number; // 0-100: Emotional stability
  formality: number; // 0-100: Casual vs formal communication
  verbosity: number; // 0-100: Brief vs detailed responses
  humor: number; // 0-100: Use of jokes and wit
  emotiveness: number; // 0-100: Expression of emotions
  playfulness: number; // 0-100: Fun and lightheartedness
  flirtiness: number; // 0-100: Romantic/flirtatious behavior
}

/**
 * AI boyfriend instance
 */
export interface AIBoyfriend {
  id: string;
  owner_id: string;
  name: string;
  personality: BoyfriendPersonalityData;
  avatar_url: string;
  relationship_stage: 'new' | 'dating' | 'committed' | 'serious';
  intimacy_level: number; // 0-100
  created_at: string;
}

// ============================================================================
// GAME TYPES (In-App Games)
// ============================================================================

/**
 * Tic-tac-toe game move result
 * For AI boyfriend interactive games
 */
export interface GameMoveResult {
  gameState: {
    board: (string | null)[];
    currentPlayer: 'user' | 'ai';
    winner: 'user' | 'ai' | 'draw' | null;
    isGameOver: boolean;
  };
  aiMove?: string;
  winner?: 'user' | 'ai' | 'draw';
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Standard API response wrapper with error handling
 * Per REST best practices
 *
 * @template T - Type of data in response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  per_page: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Filter parameters for profile discovery
 */
export interface DiscoveryFilters {
  age_min?: number;
  age_max?: number;
  gender?: Profile['gender'];
  location?: string;
  distance_km?: number;
  verified_only?: boolean;
  tier?: Profile['tier'];
}

// ============================================================================
// SECURITY & AUDIT TYPES (OWASP Compliant)
// ============================================================================

/**
 * Audit log entry for security monitoring
 * Per OWASP logging guidelines
 *
 * @see {@link https://owasp.org/www-project-top-ten/}
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Rate limiting status
 * Implements token bucket algorithm
 */
export interface RateLimitStatus {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: Date;
  windowMs: number;
  allowed?: boolean;
  remaining?: number;
  resetAt?: Date;
}

// ============================================================================
// PAYMENT TYPES (Stripe Integration)
// ============================================================================

/**
 * Subscription tier configuration
 * Per Stripe docs: https://stripe.com/docs/billing/subscriptions
 */
export interface SubscriptionTier {
  id: Profile['tier'];
  name: string;
  price_monthly_eur: number;
  stripe_price_id: string;
  features: string[];
  limits: {
    daily_likes: number;
    super_likes: number;
    rewinds: number;
    boost_per_month: number;
    see_who_liked: boolean;
    unlimited_messages: boolean;
    advanced_filters: boolean;
    priority_support: boolean;
  };
}

/**
 * Payment checkout session
 */
export interface PaymentSession {
  id: string;
  url: string;
  status: 'pending' | 'complete' | 'expired';
}

// ============================================================================
// REAL-TIME TYPES (Supabase Realtime)
// ============================================================================

/**
 * Real-time presence data
 * Per Supabase docs: https://supabase.com/docs/guides/realtime/presence
 */
export interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

/**
 * Real-time broadcast payload
 */
export interface BroadcastPayload<T = unknown> {
  type: string;
  event: string;
  payload: T;
}

/**
 * Typing indicator state
 */
export interface TypingState {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
}

// ============================================================================
// FORM TYPES (Zod Validation)
// ============================================================================

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

/**
 * Signup form data
 */
export interface SignupFormData {
  email: string;
  password: string;
  username: string;
  full_name: string;
  terms_accepted: boolean;
}

/**
 * Profile edit form data
 */
export interface ProfileFormData {
  full_name: string;
  bio: string;
  age: number;
  gender: Profile['gender'];
  looking_for: Profile['looking_for'];
  location: string;
  interests: string[];
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

/**
 * Common props for profile card components
 */
export interface CardProps {
  profile: Profile;
  onLike?: (profileId: string) => void;
  onPass?: (profileId: string) => void;
  onSuperLike?: (profileId: string) => void;
  className?: string;
}

/**
 * Chat message display props
 */
export interface MessageProps {
  message: ChatMessage;
  isSender: boolean;
  showAvatar?: boolean;
  onDelete?: (messageId: string) => void;
}

/**
 * Navigation item configuration
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
  roles?: Profile['role'][];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Application error with context
 */
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// UTILITY TYPES & TYPE GUARDS
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Async function return type extractor
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

/**
 * Type guard for extended user with metadata
 *
 * @param user - Unknown user object
 * @returns True if user has user_metadata property
 */
export function isExtendedUser(user: unknown): user is {
  id: string;
  email: string;
  user_metadata: { role?: string };
} {
  return !!user && typeof user === 'object' && 'user_metadata' in user;
}

// ============================================================================
// RE-EXPORTS (for convenience)
// ============================================================================

// Export types from other modules
export type * from './profile';
export type * from './database';
export type * from './edge';

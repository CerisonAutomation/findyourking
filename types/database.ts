/**
 * Database TypeScript Types
 * Generated from Supabase schema
 */

import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
  bio: string | null;
  is_king: boolean;
  created_at: string;
  updated_at: string;
}

export interface King {
  id: string;
  price_per_hour: number;
  availability: Record<string, unknown> | null;
  description: string | null;
  rating: number | null;
  total_bookings: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  user_id: string;
  king_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_price: number;
  stripe_payment_intent_id?: string | null;
  created_at: string;
  updated_at: string;
  kings?: {
    profiles?: Pick<Profile, 'username' | 'full_name'>;
  };
}

export interface Message {
  id: string;
  content: string;
  user_id: string;
  king_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  king_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Auth types
export type AuthUser = User;

// Chat message types
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Error types
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface StripeError extends Error {
  type: string;
  code?: string;
  decline_code?: string;
  param?: string;
}

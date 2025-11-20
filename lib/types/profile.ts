/**
 * PROFILE TYPES - SINGLE SOURCE OF TRUTH
 * Auto-generated from Supabase schema
 * Per TypeScript docs: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
 */

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  birthdate: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say' | null;
  interested_in: 'men' | 'women' | 'everyone' | null;
  location: Record<string, unknown>;
  location_lat: number | null;
  location_lng: number | null;
  preferences: Record<string, unknown>;
  subscription_tier: 'FREE' | 'PREMIUM' | 'VIP';
  is_verified: boolean;
  is_online: boolean;
  profile_completion_score: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithExtras extends Profile {
  photos?: string[];
  height?: number;
  body_type?: string;
  ethnicity?: string;
  relationship_status?: string;
  relationship_goals?: string[];
  smoking_habit?: string;
  drinking_habit?: string;
  drugs?: string[];
  sexual_orientation?: string;
  sexual_interests?: string[];
  interests?: string[];
  occupation?: string;
  education?: string;
  religion?: string;
  political_views?: string;
  languages?: string[];
  instagram_username?: string;
  tiktok_username?: string;
  snapchat_username?: string;
  website?: string;
  looking_for?: string[];
  hiv_status?: string;
  last_tested?: string;
  vaccination_status?: string;
  pronouns?: string;
  display_age?: boolean;
  display_distance?: boolean;
  distance?: number;
}

export type UserRole = 'seeker' | 'provider' | 'admin' | 'king';

export interface ProfileModalProps {
  profileId: string;
  onClose: () => void;
}

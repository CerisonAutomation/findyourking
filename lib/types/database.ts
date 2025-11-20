/**
 * DATABASE TYPES - TYPE-SAFE RPC FUNCTIONS
 * Per Supabase TypeScript Guide: https://supabase.com/docs/guides/database/typescript-support
 * Per TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
 */

export interface UserStats {
  totalViews: number;
  totalLikes: number;
  totalMatches: number;
  activeConversations: number;
}

export interface UserActivity {
  id: string;
  user_id: string;
  type: 'match' | 'like' | 'message' | 'view';
  description: string;
  related_user_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  features: string[];
}

export interface Profile {
  id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  interests?: string[];
  photos?: string[];
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}

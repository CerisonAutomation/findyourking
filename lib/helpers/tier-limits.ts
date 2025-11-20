/**
 * Tier Limits Helper Functions
 * Provides utilities for checking and enforcing subscription tier limits
 */

import { createClient } from '@/lib/supabase/server';

export interface TierLimits {
  tier: string;
  max_profile_photos: number;
  max_file_size_mb: number;
  max_storage_mb: number;
  ai_boyfriends_enabled: boolean;
  ai_boyfriends_max: number;
  upload_rate_limit_per_hour: number;
  priority_support: boolean;
  advanced_filters: boolean;
  read_receipts: boolean;
  video_messages: boolean;
  private_albums_enabled: boolean;
  max_private_albums: number;
}

export interface UploadValidation {
  allowed: boolean;
  reason: string;
  current_photos: number;
  max_photos: number;
  current_storage_mb: number;
  max_storage_mb: number;
}

export interface StorageUsage {
  user_id: string;
  profile_photos_bytes: number;
  chat_media_bytes: number;
  private_albums_bytes: number;
  total_bytes: number;
  last_calculated: string;
}

/**
 * Get tier limits for the current user
 */
export async function getUserTierLimits(): Promise<TierLimits | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase.rpc('get_user_tier_limits', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching tier limits:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('getUserTierLimits error:', error);
    return null;
  }
}

/**
 * Check if user can upload a photo based on tier limits
 */
export async function canUserUploadPhoto(
  fileSizeBytes: number
): Promise<UploadValidation> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        current_photos: 0,
        max_photos: 0,
        current_storage_mb: 0,
        max_storage_mb: 0,
      };
    }

    const { data, error } = await supabase.rpc('can_user_upload_photo', {
      p_user_id: user.id,
      p_file_size_bytes: fileSizeBytes,
    });

    if (error) {
      console.error('Error checking upload permissions:', error);
      return {
        allowed: false,
        reason: 'Error checking tier limits',
        current_photos: 0,
        max_photos: 0,
        current_storage_mb: 0,
        max_storage_mb: 0,
      };
    }

    return data?.[0] || {
      allowed: false,
      reason: 'Unknown error',
      current_photos: 0,
      max_photos: 0,
      current_storage_mb: 0,
      max_storage_mb: 0,
    };
  } catch (error) {
    console.error('canUserUploadPhoto error:', error);
    return {
      allowed: false,
      reason: 'Internal error',
      current_photos: 0,
      max_photos: 0,
      current_storage_mb: 0,
      max_storage_mb: 0,
    };
  }
}

/**
 * Update storage usage after upload or delete
 */
export async function updateStorageUsage(
  bucketName: string,
  bytesDelta: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase.rpc('update_storage_usage', {
      p_user_id: user.id,
      p_bucket_name: bucketName,
      p_bytes_delta: bytesDelta,
    });

    if (error) {
      console.error('Error updating storage usage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('updateStorageUsage error:', error);
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Track upload for rate limiting
 */
export async function trackUpload(
  fileSizeBytes: number,
  bucketName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase.rpc('track_upload', {
      p_user_id: user.id,
      p_file_size_bytes: fileSizeBytes,
      p_bucket_name: bucketName,
    });

    if (error) {
      console.error('Error tracking upload:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('trackUpload error:', error);
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Get user's storage usage
 */
export async function getUserStorageUsage(): Promise<StorageUsage | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('storage_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No storage usage record yet
        return {
          user_id: user.id,
          profile_photos_bytes: 0,
          chat_media_bytes: 0,
          private_albums_bytes: 0,
          total_bytes: 0,
          last_calculated: new Date().toISOString(),
        };
      }
      console.error('Error fetching storage usage:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getUserStorageUsage error:', error);
    return null;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get tier display information
 */
export function getTierDisplayInfo(tier: string): {
  name: string;
  color: string;
  description: string;
} {
  const tiers = {
    FREE: {
      name: 'Free',
      color: 'gray',
      description: 'Basic features for getting started',
    },
    BRONZE: {
      name: 'Bronze',
      color: 'orange',
      description: 'Entry premium with AI boyfriends',
    },
    SILVER: {
      name: 'Silver',
      color: 'blue',
      description: 'Standard premium with priority support',
    },
    GOLD: {
      name: 'Gold',
      color: 'yellow',
      description: 'Premium+ with all features unlocked',
    },
  };

  return tiers[tier as keyof typeof tiers] || tiers.FREE;
}

/**
 * Check if user has access to AI boyfriends
 */
export async function canAccessAIBoyfriends(): Promise<{
  allowed: boolean;
  max_count: number;
  current_count?: number;
}> {
  try {
    const limits = await getUserTierLimits();

    if (!limits) {
      return { allowed: false, max_count: 0 };
    }

    if (!limits.ai_boyfriends_enabled) {
      return { allowed: false, max_count: 0 };
    }

    // Count current AI boyfriend matches
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, max_count: 0 };
    }

    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_ai', true);

    return {
      allowed: (count || 0) < limits.ai_boyfriends_max,
      max_count: limits.ai_boyfriends_max,
      current_count: count || 0,
    };
  } catch (error) {
    console.error('canAccessAIBoyfriends error:', error);
    return { allowed: false, max_count: 0 };
  }
}

/**
 * Check if user has access to private albums
 */
export async function canAccessPrivateAlbums(): Promise<{
  allowed: boolean;
  max_albums: number;
  current_albums?: number;
}> {
  try {
    const limits = await getUserTierLimits();

    if (!limits) {
      return { allowed: false, max_albums: 0 };
    }

    if (!limits.private_albums_enabled) {
      return { allowed: false, max_albums: 0 };
    }

    // Count current private albums
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, max_albums: 0 };
    }

    // Query the albums based on storage paths
    const { data: files } = await supabase.storage
      .from('private-albums')
      .list(`${user.id}/albums`);

    const albumCount = files?.length || 0;

    return {
      allowed: albumCount < limits.max_private_albums,
      max_albums: limits.max_private_albums,
      current_albums: albumCount,
    };
  } catch (error) {
    console.error('canAccessPrivateAlbums error:', error);
    return { allowed: false, max_albums: 0 };
  }
}

'use server';

import { UserProfile } from '@/app/profile/page';
import { createClient } from '../supabase/server';
import { realtimeManager } from '../realtime/presence-manager';

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  // Handle case where multiple profiles exist (shouldn't happen but handle gracefully)
  if (profiles && profiles.length > 1) {
    console.warn(
      `Multiple profiles found for user ${user.id}, using first one`,
    );
    return profiles[0];
  }

  return profiles?.[0] || null;
}

export async function updateUserProfile(profileData: Partial<UserProfile>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Update user metadata with role and premium tier if provided
  if (profileData.user_role) {
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        role: profileData.user_role,
        premium_tier: profileData.premium_tier || 'free',
        king_since:
          profileData.user_role === 'king'
            ? new Date().toISOString()
            : undefined,
      },
    });

    if (authError) {
      console.log(authError);
      return { success: false, error: authError.message };
    }
  }

  // Create a clean object for the 'profiles' table update - now with all available columns
  const cleanUpdates = {
    full_name: profileData.full_name,
    username: profileData.username,
    bio: profileData.bio,
    avatar_url: profileData.avatar_url,
    birthdate: profileData.birthdate,
    age: profileData.age,
    gender: profileData.gender,
    interested_in: profileData.interested_in,
    location: profileData.location,
    location_lat: profileData.location_lat,
    location_lng: profileData.location_lng,
    preferences: profileData.preferences || {},
    subscription_tier: profileData.subscription_tier || 'FREE',
    is_verified: profileData.is_verified || false,
    profile_completion_score: profileData.profile_completion_score || 0,
    // Enhanced fields - now available in DB
    height: profileData.height,
    body_type: profileData.body_type,
    ethnicity: profileData.ethnicity,
    relationship_status: profileData.relationship_status,
    relationship_goals: profileData.relationship_goals,
    smoking_habit: profileData.smoking_habit,
    drinking_habit: profileData.drinking_habit,
    drugs: profileData.drugs,
    sexual_orientation: profileData.sexual_orientation,
    sexual_interests: profileData.sexual_interests,
    interests: profileData.interests,
    occupation: profileData.occupation,
    education: profileData.education,
    religion: profileData.religion,
    political_views: profileData.political_views,
    languages: profileData.languages,
    instagram_username: profileData.instagram_username,
    tiktok_username: profileData.tiktok_username,
    snapchat_username: profileData.snapchat_username,
    website: profileData.website,
    looking_for: profileData.looking_for,
    hiv_status: profileData.hiv_status,
    last_tested: profileData.last_tested,
    vaccination_status: profileData.vaccination_status,
    pronouns: profileData.pronouns,
    display_age: profileData.display_age,
    display_distance: profileData.display_distance,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('user_id', user.id);

  if (error) {
    console.log(error);
    return { success: false, error: error.message };
  }

  if (profileData.avatar_url) {
    await realtimeManager.sendProfileUpdate(profileData.avatar_url);
  }

  return { success: true };
}

export async function uploadProfilePhoto(file: File) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Import tier checking (to avoid circular dependencies, we'll do inline check)
  // Check tier-based limits for file size
  const { data: tierData } = await supabase.rpc('get_user_tier_limits', {
    p_user_id: user.id,
  });

  const tierLimits = tierData?.[0];
  if (tierLimits) {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > tierLimits.max_file_size_mb) {
      return {
        success: false,
        error: `File size exceeds your tier limit of ${tierLimits.max_file_size_mb}MB`,
      };
    }
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-pictures').getPublicUrl(fileName);

  // Track storage usage
  await supabase.rpc('update_storage_usage', {
    p_user_id: user.id,
    p_bucket_name: 'profile-pictures',
    p_bytes_delta: file.size,
  });

  // Track upload for rate limiting
  await supabase.rpc('track_upload', {
    p_user_id: user.id,
    p_file_size_bytes: file.size,
    p_bucket_name: 'profile-pictures',
  });

  return { success: true, url: publicUrl };
}

export async function updateUserLocation(latitude: number, longitude: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      location_lat: latitude,
      location_lng: longitude,
      last_active: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.log(error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

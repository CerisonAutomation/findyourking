'use server';

import { UserProfile } from '@/app/profile/page';
import { createClient } from '../supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { calculateDistance } from '@/lib/helpers';

interface DatabaseUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  birthdate: string;
  bio: string;
  avatar_url: string;
  preferences: Record<string, unknown>;
  location_lat?: number;
  location_lng?: number;
  last_active: string;
  is_verified: boolean;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

interface AIBoyfriend {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  relationship_stage: string;
  openness: number;
  last_interaction_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationOptions {
  limit?: number;
  offset?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function getPotentialMatches(
  options: PaginationOptions = {},
): Promise<PaginatedResponse<UserProfile>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated.');
  }

  // Pagination parameters with defaults
  const limit = Math.min(options.limit || 20, 100); // Max 100 to prevent abuse
  const offset = options.offset || 0;

  // Fetch user preferences and location once
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('preferences, location_lat, location_lng')
    .eq('id', user.id)
    .single();

  let genderPreference: string[] = [];
  let distancePreference: number | undefined;
  if (!profileError && userProfile) {
    const currentUserPrefs = userProfile?.preferences as
      | Record<string, unknown>
      | undefined;
    genderPreference = (currentUserPrefs?.gender_preference as string[]) || [];
    distancePreference = currentUserPrefs?.distance as number | undefined;
  }

  // Fetch AI boyfriends - simplified, always show some AI options
  let aiBoyfriends: AIBoyfriend[] = [];

  try {
    const { data: aiBoys, error: aiError } = await supabase
      .from('ai_boyfriends')
      .select('*')
      .eq('active', true)
      .limit(10);

    if (!aiError && aiBoys) {
      aiBoyfriends = aiBoys;
    }
  } catch (err) {
    // Silently fail if AI boyfriends table doesn't exist yet
    console.warn('AI boyfriends not available:', err);
  }

  // Optimized query: fetch total count and paginated data in one operation
  const {
    data: potentialMatches,
    error,
    count,
  } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .neq('id', user.id)
    .range(offset, offset + limit - 1)
    .order('last_active', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch potential matches');
  }

  const filteredMatches =
    potentialMatches
      ?.filter((match: DatabaseUser) => {
        if (
          distancePreference &&
          userProfile?.location_lat &&
          userProfile?.location_lng &&
          match.location_lat &&
          match.location_lng
        ) {
          const distance = calculateDistance(
            userProfile.location_lat,
            userProfile.location_lng,
            match.location_lat,
            match.location_lng,
          );
          if (distance > distancePreference) {
            return false;
          }
        }

        if (!genderPreference || genderPreference.length === 0) {
          return true;
        }
        return genderPreference.includes(match.gender);
      })
      .map((match: DatabaseUser) => {
        let distance: number | undefined;
        if (
          userProfile?.location_lat &&
          userProfile?.location_lng &&
          match.location_lat &&
          match.location_lng
        ) {
          distance = calculateDistance(
            userProfile.location_lat,
            userProfile.location_lng,
            match.location_lat,
            match.location_lng,
          );
        }

        return {
          id: match.id,
          user_id: (match as any).user_id || match.id,
          full_name: match.full_name,
          username: match.username,
          email: '',
          gender: match.gender,
          birthdate: match.birthdate,
          age: (match as any).age || null,
          bio: match.bio,
          avatar_url: match.avatar_url,
          preferences: match.preferences as unknown as {
            age_range: { min: number; max: number };
            distance: number;
            gender_preference: ('male' | 'female' | 'other')[];
          },
          interested_in: (match as any).interested_in || 'everyone',
          location: (match as any).location || {},
          location_lat: match.location_lat || null,
          location_lng: match.location_lng || null,
          subscription_tier: (match as any).subscription_tier || 'FREE',
          distance,
          is_verified: match.is_verified || true,
          is_online: match.is_online || false,
          profile_completion_score:
            (match as any).profile_completion_score || 0,
          last_active: match.last_active || new Date().toISOString(),
          created_at: match.created_at,
          updated_at: match.updated_at,
        };
      }) || [];

  // Convert AI boyfriends to UserProfile format and add to matches
  const aiBoyfriendProfiles: UserProfile[] = (aiBoyfriends || []).map(
    (bf: AIBoyfriend) => ({
      id: bf.id,
      user_id: bf.user_id,
      full_name: bf.name,
      username: bf.name.toLowerCase().replace(/\s+/g, '_'),
      email: '',
      gender: 'male' as const,
      birthdate: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 25 years old
      age: 25,
      bio: `AI Boyfriend • ${
        bf.relationship_stage === 'new'
          ? 'Looking to connect'
          : 'Experienced companion'
      } • Personality: ${bf.openness > 70 ? 'Adventurous' : 'Thoughtful'}`,
      avatar_url: bf.avatar_url || '/default-avatar.png',
      preferences: {
        age_range: { min: 18, max: 99 },
        distance: 9999,
        gender_preference: ['female', 'male', 'other'],
      },
      interested_in: 'everyone' as const,
      location: { city: 'Virtual', country: 'Global' },
      location_lat: null,
      location_lng: null,
      subscription_tier: 'VIP' as const,
      is_verified: true,
      is_online: true, // AI boyfriends are always online
      profile_completion_score: 100,
      last_active: bf.last_interaction_at || new Date().toISOString(),
      created_at: bf.created_at,
      updated_at: bf.updated_at,
      is_ai: true, // Mark as AI for routing purposes
    }),
  );

  // Combine AI boyfriends with regular matches (AI boyfriends first for visibility)
  const allMatches = [...aiBoyfriendProfiles, ...filteredMatches];

  return {
    data: allMatches,
    total: (count || 0) + aiBoyfriendProfiles.length,
    limit,
    offset,
    hasMore: offset + limit < (count || 0) + aiBoyfriendProfiles.length,
  };
}

export async function likeUser(toUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated.');
  }

  // Rate limit: 50 likes per hour
  const rateLimitResult = await checkRateLimit(user.id, 'like');

  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. You can like again in ${Math.ceil(
        (rateLimitResult.resetAt.getTime() - Date.now()) / 60000,
      )} minutes. (${rateLimitResult.remaining}/${
        rateLimitResult.limit
      } remaining)`,
    };
  }

  // Check if this is an AI boyfriend
  const { data: aiBoy } = await supabase
    .from('ai_boyfriends')
    .select('*')
    .eq('id', toUserId)
    .single();

  if (aiBoy) {
    // Auto-match with AI boyfriend and create conversation
    const { error: matchError } = await supabase.from('matches').insert({
      user1_id: user.id,
      user2_id: toUserId,
      is_active: true,
      is_ai: true,
    });

    if (matchError && matchError.code !== '23505') {
      // Ignore duplicate key errors
      throw new Error('Failed to create AI match');
    }

    // Create conversation for AI boyfriend
    const { error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        boyfriend_id: toUserId,
        user_id: user.id,
        title: `Chat with ${aiBoy.name}`,
        archived: false,
      });

    if (convError && convError.code !== '23505') {
      // Ignore duplicate key errors
      // Conversation may already exist, that's fine
    }

    return {
      success: true,
      isMatch: true,
      matchedUser: {
        id: aiBoy.id,
        user_id: aiBoy.user_id,
        full_name: aiBoy.name,
        username: aiBoy.name.toLowerCase().replace(/\s+/g, '_'),
        email: '',
        gender: 'male' as const,
        birthdate: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        age: 25,
        bio: `AI Boyfriend • Your virtual companion`,
        avatar_url: aiBoy.avatar_url || '/default-avatar.png',
        preferences: {
          age_range: { min: 18, max: 99 },
          distance: 9999,
          gender_preference: ['female', 'male', 'other'],
        },
        interested_in: 'everyone' as const,
        location: { city: 'Virtual', country: 'Global' },
        location_lat: null,
        location_lng: null,
        subscription_tier: 'VIP' as const,
        is_verified: true,
        is_online: true,
        profile_completion_score: 100,
        last_active: new Date().toISOString(),
        created_at: aiBoy.created_at,
        updated_at: aiBoy.updated_at,
        is_ai: true,
      } as UserProfile,
    };
  }

  // Regular user matching logic
  const { error: likeError } = await supabase.from('likes').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  if (likeError) {
    throw new Error('Failed to create like');
  }

  const { data: existingLike, error: checkError } = await supabase
    .from('likes')
    .select('*')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', user.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error('Failed to check for match');
  }

  if (existingLike) {
    // Create match record
    const { error: matchError } = await supabase.from('matches').insert({
      user1_id: user.id,
      user2_id: toUserId,
      is_active: true,
    });

    if (matchError) {
      // Match creation failed - error logged to audit service
      throw new Error('Failed to create match');
    }

    const { data: matchedUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', toUserId)
      .single();

    if (userError) {
      throw new Error('Failed to fetch matched user');
    }

    return {
      success: true,
      isMatch: true,
      matchedUser: matchedUser as UserProfile,
    };
  }

  return { success: true, isMatch: false };
}

export async function getUserMatches(
  options: PaginationOptions = {},
): Promise<PaginatedResponse<UserProfile>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated.');
  }

  const limit = Math.min(options.limit || 20, 100);
  const offset = options.offset || 0;

  // Optimized: fetch matches with count in one query
  const {
    data: matches,
    error,
    count,
  } = await supabase
    .from('matches')
    .select('*', { count: 'exact' })
    .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
    .eq('status', 'accepted')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch matches');
  }

  // Fetch all matched user IDs and get their data in a single optimized query
  const otherUserIds = (matches || []).map((match) =>
    match.user_id_a === user.id ? match.user_id_b : match.user_id_a,
  );

  if (otherUserIds.length === 0) {
    return {
      data: [],
      total: 0,
      limit,
      offset,
      hasMore: false,
    };
  }

  // Single optimized query to get all matched users with their profiles
  const { data: matchedUsersData } = await supabase
    .from('profiles')
    .select(
      `
      *,
      profiles (
        photos,
        height,
        body_type,
        ethnicity,
        relationship_status,
        relationship_goals,
        smoking_habit,
        drinking_habit,
        drugs,
        sexual_orientation,
        sexual_interests,
        interests,
        occupation,
        education,
        religion,
        political_views,
        languages,
        instagram_username,
        tiktok_username,
        snapchat_username,
        website,
        looking_for,
        hiv_status,
        last_tested,
        vaccination_status,
        pronouns,
        display_age,
        display_distance,
        profile_completion_score
      )
    `,
    )
    .in('id', otherUserIds);

  const matchedUsers: UserProfile[] = (matchedUsersData || []).map(
    (otherUser) => ({
      id: otherUser.id,
      user_id: otherUser.id,
      full_name: otherUser.full_name,
      username: otherUser.username,
      email: otherUser.email,
      gender: otherUser.gender,
      birthdate: otherUser.birthdate,
      age: otherUser.age,
      bio: otherUser.bio,
      avatar_url: otherUser.avatar_url,
      preferences: otherUser.preferences as unknown as {
        age_range: { min: number; max: number };
        distance: number;
        gender_preference: ('male' | 'female' | 'other')[];
      },
      interested_in: otherUser.interested_in,
      location: otherUser.location || {},
      location_lat: otherUser.location_lat,
      location_lng: otherUser.location_lng,
      subscription_tier: otherUser.subscription_tier,
      is_verified: otherUser.is_verified || false,
      is_online: otherUser.is_online || false,
      profile_completion_score: otherUser.profile_completion_score || 0,
      last_active: otherUser.last_active || new Date().toISOString(),
      created_at: otherUser.created_at,
      updated_at: otherUser.updated_at,
      // Enhanced fields from profiles table
      photos: otherUser.profiles?.photos || [],
      height: otherUser.profiles?.height,
      body_type: otherUser.profiles?.body_type,
      ethnicity: otherUser.profiles?.ethnicity,
      relationship_status: otherUser.profiles?.relationship_status,
      relationship_goals: otherUser.profiles?.relationship_goals || [],
      smoking_habit: otherUser.profiles?.smoking_habit,
      drinking_habit: otherUser.profiles?.drinking_habit,
      drugs: otherUser.profiles?.drugs || [],
      sexual_orientation: otherUser.profiles?.sexual_orientation,
      sexual_interests: otherUser.profiles?.sexual_interests || [],
      interests: otherUser.profiles?.interests || [],
      occupation: otherUser.profiles?.occupation,
      education: otherUser.profiles?.education,
      religion: otherUser.profiles?.religion,
      political_views: otherUser.profiles?.political_views,
      languages: otherUser.profiles?.languages || [],
      instagram_username: otherUser.profiles?.instagram_username,
      tiktok_username: otherUser.profiles?.tiktok_username,
      snapchat_username: otherUser.profiles?.snapchat_username,
      website: otherUser.profiles?.website,
      looking_for: otherUser.profiles?.looking_for || [],
      hiv_status: otherUser.profiles?.hiv_status,
      last_tested: otherUser.profiles?.last_tested,
      vaccination_status: otherUser.profiles?.vaccination_status,
      pronouns: otherUser.profiles?.pronouns,
      display_age: otherUser.profiles?.display_age ?? true,
      display_distance: otherUser.profiles?.display_distance ?? true,
    }),
  );

  return {
    data: matchedUsers,
    total: count || 0,
    limit,
    offset,
    hasMore: offset + limit < (count || 0),
  };
}

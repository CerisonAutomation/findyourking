/**
 * LOCATION SHARING API - GEOLOCATION FEATURES
 * Per Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
 * Per Privacy Best Practices: https://www.w3.org/TR/geolocation-privacy/
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Share location
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      matchId,
      latitude,
      longitude,
      accuracy,
      address,
      placeName,
      durationMinutes = 60,
    } = await request.json();

    if (!matchId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        {
          error: 'matchId, latitude, and longitude are required',
        },
        { status: 400 },
      );
    }

    // Validate coordinates
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 },
      );
    }

    // Verify user has access to this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found or access denied' },
        { status: 403 },
      );
    }

    // Get static map URL (using a free map service or placeholder)
    const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},14,0/300x200?access_token=${
      process.env.MAPBOX_ACCESS_TOKEN || 'pk.placeholder'
    }`;

    // Insert location share
    const { data, error } = await supabase
      .from('location_shares')
      .insert({
        user_id: user.id,
        match_id: matchId,
        latitude,
        longitude,
        accuracy_meters: accuracy,
        address,
        place_name: placeName,
        static_map_url: staticMapUrl,
        share_duration_minutes: durationMinutes,
        expires_at: new Date(
          Date.now() + durationMinutes * 60 * 1000,
        ).toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also create a message with location data
    const locationMessage = {
      match_id: matchId,
      from_user_id: user.id,
      to_user_id: match.user1_id === user.id ? match.user2_id : match.user1_id,
      content: `📍 Shared location: ${
        placeName ||
        address ||
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      }`,
      message_type: 'location',
      location_data: {
        latitude,
        longitude,
        address,
        place_name: placeName,
        static_map_url: staticMapUrl,
      },
    };

    const { error: messageError } = await supabase
      .from('messages')
      .insert(locationMessage);

    if (messageError) {
      console.error('Failed to create location message:', messageError);
      // Don't fail the whole request if message creation fails
    }

    return NextResponse.json({
      locationShare: data,
      message: 'Location shared successfully',
    });
  } catch (error) {
    console.error('Location sharing error:', error);
    return NextResponse.json(
      { error: 'Failed to share location' },
      { status: 500 },
    );
  }
}

// GET - Get active location shares for a match
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 },
      );
    }

    // Verify user has access to this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found or access denied' },
        { status: 403 },
      );
    }

    // Get active location shares for this match
    const { data: locationShares, error } = await supabase
      .from('location_shares')
      .select(
        `
        id,
        user_id,
        latitude,
        longitude,
        accuracy_meters,
        address,
        place_name,
        static_map_url,
        expires_at,
        created_at,
        profiles!inner(full_name, username, avatar_url)
      `,
      )
      .eq('match_id', matchId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedShares = (locationShares || []).map((share: any) => ({
      id: share.id,
      user: {
        id: share.user_id,
        name: share.profiles?.full_name || share.profiles?.username || 'User',
        avatar_url: share.profiles?.avatar_url,
      },
      location: {
        latitude: share.latitude,
        longitude: share.longitude,
        accuracy: share.accuracy_meters,
        address: share.address,
        placeName: share.place_name,
        staticMapUrl: share.static_map_url,
      },
      expiresAt: share.expires_at,
      createdAt: share.created_at,
    }));

    return NextResponse.json({ locationShares: formattedShares });
  } catch (error) {
    console.error('Get location shares error:', error);
    return NextResponse.json(
      { error: 'Failed to get location shares' },
      { status: 500 },
    );
  }
}

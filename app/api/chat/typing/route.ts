/**
 * TYPING INDICATORS API - REAL-TIME CHAT UX
 * Per Supabase Realtime: https://supabase.com/docs/guides/realtime
 * Per WebSocket Best Practices: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Update typing status
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

    const { matchId, isTyping } = await request.json();

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 },
      );
    }

    // Verify user has access to this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
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

    if (isTyping) {
      // Insert or update typing indicator
      const { error } = await supabase.from('typing_indicators').upsert(
        {
          match_id: matchId,
          user_id: user.id,
          is_typing: true,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'match_id,user_id',
        },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Remove typing indicator
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Typing indicator error:', error);
    return NextResponse.json(
      { error: 'Failed to update typing status' },
      { status: 500 },
    );
  }
}

// GET - Get typing status for a match
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
      .select('id')
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

    // Get typing indicators for this match (excluding current user)
    const { data: typingUsers, error } = await supabase
      .from('typing_indicators')
      .select(
        `
        user_id,
        last_updated,
        profiles!inner(full_name, username, avatar_url)
      `,
      )
      .eq('match_id', matchId)
      .neq('user_id', user.id)
      .eq('is_typing', true)
      .gt('last_updated', new Date(Date.now() - 10000).toISOString()); // Last 10 seconds

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedTypingUsers = (typingUsers || []).map((indicator: any) => ({
      userId: indicator.user_id,
      userName:
        indicator.profiles?.full_name || indicator.profiles?.username || 'User',
      timestamp: new Date(indicator.last_updated).getTime(),
    }));

    return NextResponse.json({ typingUsers: formattedTypingUsers });
  } catch (error) {
    console.error('Get typing status error:', error);
    return NextResponse.json(
      { error: 'Failed to get typing status' },
      { status: 500 },
    );
  }
}

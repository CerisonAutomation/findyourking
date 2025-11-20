/**
 * USER STATS API ENDPOINT - REAL-TIME DASHBOARD STATS
 * Per Next.js API Routes: https://nextjs.org/docs/api-routes/introduction
 * Per Supabase Security: https://supabase.com/docs/guides/auth/server-side-rendering
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserStats } from '@/lib/types/database';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate stats from database tables
    const [
      { count: totalViews },
      { count: totalLikes },
      { count: totalMatches },
      { count: activeConversations },
    ] = await Promise.all([
      supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'view'),
      supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'like'),
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    const stats: UserStats = {
      totalViews: totalViews ?? 0,
      totalLikes: totalLikes ?? 0,
      totalMatches: totalMatches ?? 0,
      activeConversations: activeConversations ?? 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 },
    );
  }
}

/**
 * Enhanced API Route with Pagination
 * GET /api/users - List all users with pagination
 */

import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';
import { getPaginationParams, buildPaginatedResponse } from '@/lib/utils/pagination';

async function handler(request: NextRequest) {
  const supabase = await createClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get pagination params
  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = getPaginationParams(searchParams);

  // Optional filters
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  // Build query
  let query = supabase
    .from('profiles')
    .select('id, username, bio, avatar_url, user_role, created_at', { count: 'exact' });

  // Apply filters
  if (role) {
    query = query.eq('user_role', role);
  }

  if (search) {
    query = query.ilike('username', `%${search}%`);
  }

  // Apply pagination
  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  const { data: profiles, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build paginated response
  const response = buildPaginatedResponse(profiles || [], count || 0, { page, limit, offset });

  return NextResponse.json(response);
}

export const GET = withRateLimit(handler);
export const dynamic = 'force-dynamic';

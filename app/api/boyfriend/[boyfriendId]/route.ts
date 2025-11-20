import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/boyfriend/[boyfriendId] - Get specific AI boyfriend details
 * @returns AI boyfriend data with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boyfriendId: string }> }
) {
  try {
    const { boyfriendId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: boyfriend, error } = await supabase
      .from('ai_boyfriends')
      .select('*')
      .eq('id', boyfriendId)
      .eq('user_id', user.id)
      .single();

    if (error || !boyfriend) {
      return NextResponse.json({ error: 'Boyfriend not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, boyfriend });
  } catch (error) {
    console.error('Error fetching boyfriend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/boyfriend/[boyfriendId] - Update AI boyfriend
 * @returns Updated boyfriend data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boyfriendId: string }> }
) {
  try {
    const { boyfriendId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data: boyfriend, error } = await supabase
      .from('ai_boyfriends')
      .update(body)
      .eq('id', boyfriendId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !boyfriend) {
      return NextResponse.json({ error: 'Failed to update boyfriend' }, { status: 500 });
    }

    return NextResponse.json({ success: true, boyfriend });
  } catch (error) {
    console.error('Error updating boyfriend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/boyfriend/[boyfriendId] - Delete AI boyfriend
 * @returns Success confirmation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boyfriendId: string }> }
) {
  try {
    const { boyfriendId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('ai_boyfriends')
      .delete()
      .eq('id', boyfriendId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete boyfriend' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Boyfriend deleted' });
  } catch (error) {
    console.error('Error deleting boyfriend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

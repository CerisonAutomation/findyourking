import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';

async function getHandler(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const otherUserId = searchParams.get('userId');

  if (!matchId && !otherUserId) {
    return NextResponse.json({ error: 'matchId or userId required' }, { status: 400 });
  }

  let query = supabase
    .from('messages')
    .select('*')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: true });

  if (matchId) {
    query = query.eq('match_id', matchId);
  } else if (otherUserId) {
    query = query.or(`from_user_id.eq.${otherUserId},to_user_id.eq.${otherUserId}`);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
}

async function postHandler(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { toUserId, matchId, content, attachmentUrl } = body;

  if (!toUserId || !content) {
    return NextResponse.json({ error: 'toUserId and content required' }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      match_id: matchId,
      content,
      attachment_url: attachmentUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message }, { status: 201 });
}

export const GET = withRateLimit(getHandler);
export const POST = withRateLimit(postHandler);
export const dynamic = 'force-dynamic';

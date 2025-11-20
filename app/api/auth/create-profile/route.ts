import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, username, email } = await request.json();

    if (!userId || !username || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Insert into profiles
    const { error } = await supabase.from('profiles').insert({
      user_id: userId,
      username: username.trim(),
    });

    if (error) {
      console.error('Create profile error:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

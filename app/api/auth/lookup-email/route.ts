import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username?.trim()) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Query profiles table for username to get email
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .single();

    if (error || !data) {
      // Return generic message to prevent enumeration
      return NextResponse.json({
        found: false,
        message: 'User not found',
      });
    }

    return NextResponse.json({
      found: true,
      email: data.email,
    });
  } catch (error) {
    console.error('Lookup email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

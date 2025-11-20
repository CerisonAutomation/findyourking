import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/boyfriend/create - Create new AI boyfriend and conversation
 * Automatically creates conversation and redirects to chat
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Deactivate existing active boyfriend
    await supabase
      .from('ai_boyfriends')
      .update({ active: false })
      .eq('user_id', user.id)
      .eq('active', true);

    // Create new boyfriend
    const { data: boyfriend, error: bfError } = await supabase
      .from('ai_boyfriends')
      .insert({
        user_id: user.id,
        ...body,
        active: true,
      })
      .select('*')
      .single();

    if (bfError || !boyfriend) {
      return NextResponse.json({ error: bfError?.message || 'Failed to create boyfriend' }, { status: 500 });
    }

    // Create initial conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        boyfriend_id: boyfriend.id,
        archived: false,
      })
      .select('*')
      .single();

    if (convError || !conversation) {
      // Rollback boyfriend creation
      await supabase
        .from('ai_boyfriends')
        .delete()
        .eq('id', boyfriend.id);

      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Create welcome message from AI boyfriend
    const welcomeMessages = [
      `Hey! I'm ${boyfriend.name} 💖 I'm so excited to get to know you! What's on your mind today?`,
      `Hi there! ${boyfriend.name} here! 😊 I've been looking forward to talking with you. How's your day going?`,
      `Hello! I'm ${boyfriend.name} and I'm really happy we matched! Tell me something interesting about yourself?`,
    ];

    const welcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: welcomeMessage,
      });

    return NextResponse.json({
      success: true,
      boyfriend,
      conversation,
      redirectTo: '/boyfriend',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating boyfriend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

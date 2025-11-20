import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const gameMoveSchema = z.object({
  boyfriendId: z.string().uuid(),
  move: z.string().regex(/^[0-2]$/), // 0, 1, or 2 for tic-tac-toe position
});

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

    // Parse and validate request
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = gameMoveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { boyfriendId, move } = validation.data;

    // Verify boyfriend ownership
    const { data: boyfriend } = await supabase
      .from('ai_boyfriends')
      .select('id, name')
      .eq('id', boyfriendId)
      .eq('user_id', user.id)
      .single();

    if (!boyfriend) {
      return NextResponse.json({ error: 'Boyfriend not found' }, { status: 404 });
    }

    // Simple AI move logic for tic-tac-toe
    const aiMove = Math.floor(Math.random() * 3).toString();

    // Get current conversation for context
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('boyfriend_id', boyfriendId)
      .eq('archived', false)
      .single();

    if (conversation) {
      // Store game moves as messages
      await supabase.from('ai_messages').insert([
        {
          conversation_id: conversation.id,
          role: 'user',
          content: `Played tic-tac-toe move: ${move}`,
        },
        {
          conversation_id: conversation.id,
          role: 'assistant',
          content: `I counter with move: ${aiMove} 😊`,
        },
      ]);
    }

    return NextResponse.json({
      aiMove,
      message: `I counter with move: ${aiMove} 😊`,
    });

  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
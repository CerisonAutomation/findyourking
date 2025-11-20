import { NextRequest, NextResponse } from 'next/server';
import { generateBoyfriendResponse, moderateContent } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

// AI Boyfriend Chat API endpoint
export async function POST(request: NextRequest) {
  try {
    const { boyfriendId, message, userId, conversationId, stream = false } = await request.json();

    if (!boyfriendId || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: boyfriendId, message, userId' },
        { status: 400 }
      );
    }

    // Moderate content first
    const moderation = await moderateContent(message);
    if (!moderation.isAppropriate) {
      return NextResponse.json(
        {
          error: 'Message contains inappropriate content',
          reason: moderation.reason,
        },
        { status: 400 }
      );
    }

    // Get boyfriend profile from database
    const supabase = await createClient();
    const { data: boyfriend, error: boyfriendError } = await supabase
      .from('ai_boyfriends')
      .select('*')
      .eq('id', boyfriendId)
      .single();

    if (boyfriendError || !boyfriend) {
      return NextResponse.json(
        { error: 'Boyfriend not found' },
        { status: 404 }
      );
    }

    // Get conversation history for context
    let conversationHistory = [];
    if (conversationId) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20); // Last 20 messages for context

      if (!messagesError && messages) {
        conversationHistory = messages.map((msg: { content: string; sender_type: string }) => ({
          role: msg.sender_type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));
      }
    }

    // Generate AI response
    if (stream) {
      // Handle streaming response
      const aiResponse = await generateBoyfriendResponse(
        boyfriend,
        message
      );

      // For now, return the response directly (streaming implementation needs proper AI SDK)
      return new Response(aiResponse.response, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle regular response
      const aiResponse = await generateBoyfriendResponse(
        boyfriend,
        message
      );

      // Save messages to database
      const { error: saveError } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          sender_type: 'user',
          content: message,
          user_id: userId,
        },
        {
          conversation_id: conversationId,
          sender_type: 'boyfriend',
          content: aiResponse.response,
          user_id: userId,
          boyfriend_id: boyfriendId,
        },
      ]);

      if (saveError) {
        // Don't fail the request if saving fails, just continue
      }

      return NextResponse.json({
        response: aiResponse.response,
        boyfriend_id: boyfriendId,
        conversation_id: conversationId,
      });
    }
  } catch {
    return NextResponse.json(
      {
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversationId, userId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_type,
        created_at,
        ai_boyfriends (
          id,
          name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
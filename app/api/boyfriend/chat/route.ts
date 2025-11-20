import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamBoyfriendChat, buildBoyfriendPrompt, type BoyfriendPersonality } from '@/lib/ai/gemini-boyfriend';
import { z } from 'zod';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  boyfriendId: z.string().uuid(),
});

export const runtime = 'nodejs';
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

    const validation = chatRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { message, boyfriendId } = validation.data;

    // Verify boyfriend ownership
    const { data: boyfriend } = await supabase
      .from('ai_boyfriends')
      .select('*')
      .eq('id', boyfriendId)
      .eq('user_id', user.id)
      .single();

    if (!boyfriend) {
      return NextResponse.json({ error: 'Boyfriend not found' }, { status: 404 });
    }

    // Get or create conversation
    let conversationId: string;
    const { data: existingConv } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('boyfriend_id', boyfriendId)
      .eq('user_id', user.id)
      .eq('archived', false)
      .single();

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          boyfriend_id: boyfriendId,
          user_id: user.id,
          title: `Chat with ${boyfriend.name}`,
          archived: false,
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        // Conversation creation failed
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      conversationId = newConv.id;
    }

    // Store user message
    const { error: msgError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });

    if (msgError) {
      // Message storage failed
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Get conversation history for context
    const { data: history } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    const systemPrompt = buildBoyfriendPrompt(boyfriend as BoyfriendPersonality);

    // Generate AI response with streaming
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamBoyfriendChat({
            systemPrompt,
            history: (history || []).reverse().map((h) => ({
              role: h.role === 'user' ? 'user' : 'model',
              content: h.content,
            })),
            message,
          })) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Store AI response
          await supabase.from('ai_messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullResponse,
          });

          controller.close();
        } catch (error: unknown) { // Explicitly type error as unknown for now to access properties
          // Streaming error occurred
          let errorMessage = 'AI service unavailable';

          if (error instanceof Error) {
            if (error.message && error.message.includes('API key not valid')) {
              errorMessage = 'Invalid Gemini API key configured.';
            } else if (error.message && error.message.includes('rate limit')) {
              errorMessage = 'AI service rate limit exceeded. Please try again shortly.';
            } else if (error.message) {
              errorMessage = `AI service error: ${error.message}`;
            }
          }

          controller.enqueue(encoder.encode(JSON.stringify({
            error: errorMessage
          })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });

  } catch {
    // API error handled
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


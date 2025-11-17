import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'edge';

const gateway = createGateway({
  apiKey: process.env['AI_GATEWAY_API_KEY'],
  baseURL: 'https://ai-gateway.vercel.sh/v1', // Explicitly use Vercel AI Gateway base URL
  headers: {
    'http-referer': process.env['VERCEL_URL']
      ? `https://${process.env['VERCEL_URL']}`
      : 'http://localhost:3000',
    'x-title': 'FindYourKing AI Matchmaker API',
  },
});

const matchmakerRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1, 'Message content cannot be empty'),
      }),
    )
    .min(1, 'Messages array cannot be empty'),
  userId: z.string().uuid('Invalid User ID'), // Assuming userId is a UUID
  targetUserId: z.string().uuid('Invalid Target User ID'), // The user to match with
});

/**
 * Handle matchmaking messages via AI
 * 
 * Processes conversation history through AI matchmaker model.
 * Analyzes compatibility and suggests conversation topics.
 * Returns streaming responses for real-time guidance.
 * 
 * @param {Request} req - Request object containing:
 *   - messages: Array<{ role: 'user'|'assistant'|'system', content: string }>
 *   - userId: string (UUID) - Requester's user ID
 *   - targetUserId: string (UUID) - Target match's user ID
 * 
 * @returns {Promise<Response>} Streaming matchmaking guidance from AI
 * 
 * @throws {Error} On validation or AI service failure
 */
async function handlePOST(req: Request) {
  const body = await req.json();
  const parsed = matchmakerRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ');
    return new NextResponse(JSON.stringify({ error: message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { messages, userId, targetUserId } = parsed.data;

  try {
    // In a real scenario, you would fetch user profiles and preferences
    // for both userId and targetUserId to provide to the AI for matchmaking.
    // For this example, we'll just use a generic prompt.

    const systemMessage = `You are an AI Matchmaker. Your goal is to help users find compatible partners.
    Analyze the conversation history and user profiles (if provided) to suggest conversation starters,
    highlight common interests, and provide insights into potential compatibility.
    Be friendly, encouraging, and insightful.`;

    const result = await streamText({
      model: gateway('ollama/qwen3-coder:480b'), // Use the gateway with the Ollama model
      messages: [{ role: 'system', content: systemMessage }, ...messages],
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in AI Matchmaker:', message);
    return new NextResponse(
      JSON.stringify({ error: 'AI service temporarily unavailable' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(handlePOST, RATE_LIMITS.AI);

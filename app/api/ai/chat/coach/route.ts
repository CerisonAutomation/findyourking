import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getSecurityHeaders } from '@/lib/api-security';

export const runtime = 'edge';

const gateway = createGateway({
  apiKey: process.env['AI_GATEWAY_API_KEY'],
  baseURL: 'https://ai-gateway.vercel.sh/v1', // Explicitly use Vercel AI Gateway base URL
  headers: {
    'http-referer': process.env['VERCEL_URL']
      ? `https://${process.env['VERCEL_URL']}`
      : 'http://localhost:3000',
    'x-title': 'FindYourKing AI Coach API',
  },
});

const coachRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1, 'Message content cannot be empty'),
      }),
    )
    .min(1, 'Messages array cannot be empty'),
  userId: z.string().uuid('Invalid User ID').optional(), // User ID is optional for general advice
});

/**
 * Handle coaching messages via AI
 *
 * Processes user messages through AI coaching model.
 * Returns streaming responses for real-time chat experience.
 *
 * @param {Request} req - Request object containing:
 *   - messages: Array<{ role: 'user'|'assistant'|'system', content: string }>
 *   - userId: string (UUID, optional) - User ID for personalization
 *
 * @returns {Promise<Response>} Streaming text response from AI
 *
 * @throws {Error} On validation or AI service failure
 */
async function handlePOST(req: Request) {
  const body = await req.json();
  const parsed = coachRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ');
    return new NextResponse(JSON.stringify({ error: message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { messages, userId } = parsed.data;

  try {
    // If userId is provided, you could fetch user's profile/preferences
    // to give more personalized coaching.
    const systemMessage = `You are an AI Dating Coach. Your goal is to provide helpful,
    constructive, and empathetic advice on dating, relationships, and communication.
    Be supportive, non-judgmental, and always encourage healthy interactions.
    Keep your responses concise and actionable.`;

    const result = await streamText({
      model: gateway('ollama/qwen3-coder:480b'), // Use the gateway with the Ollama model
      messages: [{ role: 'system', content: systemMessage }, ...messages],
    });

    const response = result.toTextStreamResponse();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in AI Dating Coach:', message);
    return new NextResponse(
      JSON.stringify({ error: 'AI service temporarily unavailable' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders(),
        },
      },
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(handlePOST, RATE_LIMITS.AI);

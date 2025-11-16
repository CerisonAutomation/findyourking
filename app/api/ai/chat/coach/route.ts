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
    'http-referer': process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'http://localhost:3000',
    'x-title': 'FindYourKing AI Coach API',
  },
});

const coachRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1, "Message content cannot be empty"),
  })).min(1, "Messages array cannot be empty"),
  userId: z.string().uuid("Invalid User ID").optional(), // User ID is optional for general advice
});

async function handlePOST(req: Request) {
  const body = await req.json();
  const parsed = coachRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map(e => e.message).join(", ");
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

    return result.toTextStreamResponse();
  } catch (err) {
    const error = err as Error;
    console.error('Error in AI Dating Coach:', error);
    return new NextResponse(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Export with rate limiting
export const POST = withRateLimit(handlePOST, RATE_LIMITS.AI);
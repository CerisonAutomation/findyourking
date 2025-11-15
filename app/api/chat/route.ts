import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { NextResponse } from 'next/server';
import { chatRequestSchema } from '@/lib/validation';
import { ChatMessage } from '@/types/database';

export const runtime = 'edge';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1', // Explicitly use Vercel AI Gateway base URL
  headers: {
    'http-referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
    'x-title': 'FindYourKing Chat API',
  },
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return new NextResponse(message, { status: 400 });
  }

  const { messages, kingId } = parsed.data;

  try {
    // You can use kingId here to dynamically select a model or inject context
    // For now, we'll keep the model static but demonstrate passing kingId
    const result = await streamText({
      model: gateway('ollama/qwen3-coder:480b'),
      messages: messages as ChatMessage[],
    });

    return result.toResponse(); // Return the streaming response
  } catch (err) {
    const error = err as Error;
    console.error('Error generating text:', error);
    return new NextResponse('AI service temporarily unavailable', { status: 500 });
  }
}

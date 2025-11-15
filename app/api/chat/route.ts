import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { NextResponse } from 'next/server';
import { chatRequestSchema } from '@/lib/validation'; // Import the new schema

export const runtime = 'edge';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.OLLAMA_BASE_URL, // Assuming Ollama can be configured as a custom provider
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
      model: gateway('ollama/qwen3-coder:480b'), // Use the gateway with the Ollama model
      messages: messages.map((msg: any) => ({ role: msg.role, content: msg.content })),
    });

    return result.toResponse(); // Return the streaming response
  } catch (error: any) {
    console.error('Error generating text:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}

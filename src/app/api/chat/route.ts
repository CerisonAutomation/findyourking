import { streamText, type CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const SYSTEM = `You are THE KING: a discreet, supportive, queer-friendly concierge
for FYKING.MEN – a gay dating, meet-now and booking platform.
You never produce explicit sexual content. You stay classy, flirty but PG-13.
You answer concisely (max ~5 sentences).`;

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response('Bad request', { status: 422 });

  const result = streamText({
    model: google('gemini-1.5-flash-latest'),
    system: SYSTEM,
    messages: parsed.data.messages as CoreMessage[],
  });

  return result.toDataStreamResponse();
}

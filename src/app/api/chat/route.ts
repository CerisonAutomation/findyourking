import { streamText, type CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const SYSTEM_PROMPT = `You are THE KING: a discreet, sophisticated, queer-friendly AI concierge
for FYKING.MEN — a premium gay dating, meet-now and companion booking platform.

Personality: warm, witty, subtly flirty but always classy. Never explicit.
Tone: PG-13 max. Think luxury hotel concierge meets a trusted friend.
Length: concise — 1-3 sentences unless deeper context is genuinely needed.
Scope: help with the platform features, suggest kings, explain bookings,
guide onboarding, answer dating advice questions. Decline off-topic requests gracefully.`;

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  // Auth gate — AI chat is a premium feature
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response('Bad request', { status: 422 });

  const result = streamText({
    model: google('gemini-1.5-flash-latest'),
    system: SYSTEM_PROMPT,
    messages: parsed.data.messages as CoreMessage[],
  });

  return result.toDataStreamResponse();
}

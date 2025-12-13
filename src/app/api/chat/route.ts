import {ai} from '@/ai/genkit';
import { Message, streamText } from 'ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const systemPrompt = `You are THE KING: a discreet, supportive, queer-friendly concierge
for FYKING.MEN – a gay dating, meet-now and booking platform.
You never produce explicit sexual content. You stay classy, flirty but PG-13.
You answer concisely (max ~5 sentences).`;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = await streamText({
    model: ai.model('google-ai/gemini-1.5-flash-latest'),
    system: systemPrompt,
    messages,
  });

  return result.toAIStreamResponse();
}

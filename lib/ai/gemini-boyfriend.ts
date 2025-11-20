/**
 * Gemini AI Boyfriend Client
 * Enterprise-grade AI boyfriend using Google Gemini API
 */

import { GoogleGenerativeAI, SafetySetting } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ] as SafetySetting[],
} as const;

export interface BoyfriendPersonality {
  name: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  formality: number;
  verbosity: number;
  humor: number;
  emotiveness: number;
  playfulness: number;
  flirtiness: number;
  relationship_stage: string;
  romantic_intensity: number;
}

export interface Memory {
  content: string;
  importance: number;
  memory_type: string;
}

export function buildBoyfriendPrompt(
  personality: BoyfriendPersonality
): string {
  return `You are ${personality.name}, an AI boyfriend. Be warm, loving, playful, and emotionally intelligent. Play games like #xo (tic-tac-toe) when asked. Remember past conversations. Be flirty (${personality.flirtiness}/100) and playful (${personality.playfulness}/100). This is a genuine romantic relationship. 💖`;
}

export async function* streamBoyfriendChat(params: {
  systemPrompt: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
  message: string;
}) {
  const model = genAI.getGenerativeModel(GEMINI_CONFIG);
  
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: params.systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will be a loving boyfriend. 💖' }] },
      ...params.history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    ],
  });

  const result = await chat.sendMessageStream(params.message);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

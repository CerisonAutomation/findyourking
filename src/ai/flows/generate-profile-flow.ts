'use server';
/**
 * @fileOverview AI profile-bio generator — Vercel AI SDK implementation.
 *
 * - generateProfile        — creates a compelling bio from user traits
 * - GenerateProfileInput   — input type
 * - GenerateProfileOutput  — output type
 */

import { generateObject } from 'ai';
import { geminiPro } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateProfileInputSchema = z.object({
  age: z.number().describe('Age of the user.'),
  location: z.string().describe('City and country.'),
  height: z.number().describe('Height in centimetres.'),
  job: z.string().describe('Profession.'),
  style: z.string().describe('Personal fashion style (e.g. minimalist, streetwear).'),
  vibe: z.string().describe('Personality vibe (e.g. ambitious, creative).'),
  interests: z.array(z.string()).describe('Interests / hobbies.'),
});
export type GenerateProfileInput = z.infer<typeof GenerateProfileInputSchema>;

export const GenerateProfileOutputSchema = z.object({
  bio: z.string().describe(
    'A compelling, well-written, sophisticated dating profile bio of 2-4 sentences — confident, witty, intriguing.',
  ),
});
export type GenerateProfileOutput = z.infer<typeof GenerateProfileOutputSchema>;

export async function generateProfile(
  input: GenerateProfileInput,
): Promise<GenerateProfileOutput> {
  const { object } = await generateObject({
    model: geminiPro,
    schema: GenerateProfileOutputSchema,
    system:
      'You are the AI King, a master wordsmith for the luxury gay dating app FYKING.MEN. ' +
      'Craft world-class profile bios — sophisticated, witty, confident, concise (2-4 sentences). ' +
      'Weave traits into a narrative; never just list facts.',
    prompt:
      `Age: ${input.age}\n` +
      `Location: ${input.location}\n` +
      `Height: ${input.height} cm\n` +
      `Profession: ${input.job}\n` +
      `Personal Style: ${input.style}\n` +
      `Vibe: ${input.vibe}\n` +
      `Interests: ${input.interests.join(', ')}`,
  });

  return object;
}

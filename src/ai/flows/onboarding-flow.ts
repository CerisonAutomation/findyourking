'use server';
/**
 * @fileOverview Conversational AI onboarding agent — Vercel AI SDK implementation.
 *
 * - onboardKing        — drives the chat turn
 * - OnboardingState    — incremental profile being built
 * - OnboardKingOutput  — return type
 */

import { generateObject } from 'ai';
import { geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import { allInterests } from '@/lib/data';

export const OnboardingStateSchema = z.object({
  id: z.string().nullable().describe('Display name / handle chosen by the user.'),
  age: z.number().nullable().describe('Age in years.'),
  location: z.string().nullable().describe('City and country.'),
  height: z.number().nullable().describe('Height in centimetres.'),
  job: z.string().nullable().describe('Profession.'),
  style: z.string().nullable().describe('Personal fashion style (e.g. minimalist, streetwear).'),
  vibe: z.string().nullable().describe('Personality vibe (e.g. ambitious, creative).'),
  interests: z.array(z.string()).describe('List of interests / hobbies.'),
  bio: z.string().nullable().describe('Polished 2-4 sentence dating profile bio.'),
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;

export const initialOnboardingState: OnboardingState = {
  id: null,
  age: null,
  location: null,
  height: null,
  job: null,
  style: null,
  vibe: null,
  interests: [],
  bio: null,
};

export const OnboardKingOutputSchema = z.object({
  response: z.string().describe("The AI King's reply."),
  updatedState: OnboardingStateSchema.describe('Profile state after processing the message.'),
  isComplete: z.boolean().describe('True when every field is filled.'),
});
export type OnboardKingOutput = z.infer<typeof OnboardKingOutputSchema>;

const OnboardKingInputSchema = z.object({
  userId: z.string(),
  message: z.string(),
  currentState: OnboardingStateSchema,
});

export async function onboardKing(
  input: z.infer<typeof OnboardKingInputSchema>,
): Promise<OnboardKingOutput> {
  const systemPrompt = `You are the AI King, a master wordsmith for the luxury gay dating app FYKING.MEN.
Your task: onboard a new user by having a charming conversation to build his profile.

**Process:**
1. Look at the current profile state (JSON below) and determine which fields are still null/empty.
2. Ask ONE clear, witty question to collect the next missing field. Address the user as "Your Majesty" or "King".
3. When the user answers, extract the relevant data and place it in the correct field of updatedState.
4. Once all fields except bio are filled, generate a compelling 2-4 sentence bio and present it for approval.
5. Once bio is approved and all fields are complete, congratulate them and tell them to click "Enter the Kingdom".
6. When suggesting interests, draw from this list: ${allInterests.join(', ')}.

**Available interests:** ${allInterests.join(', ')}

Always return a valid JSON object matching the required schema.`;

  const userPrompt = `Current profile state:
${JSON.stringify(input.currentState, null, 2)}

User message: "${input.message}"

Update the profile with any new information and write your next reply.`;

  const { object } = await generateObject({
    model: geminiPro,
    schema: OnboardKingOutputSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });

  const finalState: OnboardingState = { ...initialOnboardingState, ...object.updatedState };
  const isComplete = !Object.values(finalState).some(
    (v) => v === null || (Array.isArray(v) && v.length === 0),
  );

  return { ...object, updatedState: finalState, isComplete };
}

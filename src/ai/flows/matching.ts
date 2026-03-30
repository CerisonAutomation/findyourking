'use server';
/**
 * @fileOverview Embedding utility for profile vector generation — Vercel AI SDK.
 *
 * - generateProfileEmbedding — creates a text-embedding-004 vector for a user profile
 */

import { embed } from 'ai';
import { embeddingModel } from '@/ai/genkit';
import { z } from 'zod';

export const userProfileSchema = z.object({
  bio: z.string().optional().default(''),
  interests: z.array(z.string()).optional().default([]),
  display_name: z.string().optional().default(''),
});

export type UserProfileEmbeddingInput = z.infer<typeof userProfileSchema>;

/**
 * Generates a text-embedding-004 vector for the given profile.
 * Used by the generate-embeddings script and server actions.
 */
export async function generateProfileEmbedding(
  profile: UserProfileEmbeddingInput,
): Promise<number[]> {
  const inputText = [
    `Display Name: ${profile.display_name}`,
    `Bio: ${profile.bio}`,
    `Interests: ${profile.interests.join(', ')}`,
  ].join('\n');

  const { embedding } = await embed({
    model: embeddingModel,
    value: inputText,
  });

  return embedding;
}

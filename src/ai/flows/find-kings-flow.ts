'use server';
/**
 * @fileOverview AI-powered profile search using Google embeddings + Supabase pgvector.
 *
 * - findKings          — natural-language profile search
 * - FindKingsInput     — input type
 * - FindKingsOutput    — output type
 */

import { embed, generateObject } from 'ai';
import { embeddingModel, geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import type { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const UserProfileSchema = z.object({
  userId: z.string(),
  id: z.string(),
  avatarUrl: z.string().nullable(),
  location: z.string().nullable(),
  age: z.number().nullable(),
  height: z.number().nullable(),
  bio: z.string().nullable(),
  interests: z.array(z.string()).nullable(),
  onboarded: z.boolean(),
  embedding: z.array(z.number()).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

const MatchedKingSchema = z.object({
  profile: UserProfileSchema,
  matchScore: z.number().describe('0-100 match score.'),
  matchReason: z.string().describe('One-sentence reason for the match.'),
});

const FindKingsInputSchema = z.object({
  query: z.string(),
  requestingUserId: z.string(),
});
export type FindKingsInput = z.infer<typeof FindKingsInputSchema>;

const FindKingsOutputSchema = z.object({
  kings: z.array(MatchedKingSchema),
});
export type FindKingsOutput = z.infer<typeof FindKingsOutputSchema>;

export async function findKings(input: FindKingsInput): Promise<FindKingsOutput> {
  // 1. Generate query embedding
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: input.query,
  });

  if (!queryEmbedding) throw new Error('Failed to generate embedding for the query.');

  // 2. Vector search via Supabase RPC
  const supabase = await createClient();
  const { data: matchedProfiles, error: matchError } = await supabase.rpc('match_kings', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 10,
    requesting_user_id: input.requestingUserId,
  });

  if (matchError) throw new Error(`Failed to find kings: ${matchError.message}`);
  if (!matchedProfiles || matchedProfiles.length === 0) return { kings: [] };

  // 3. Enrich each match with an AI-generated reason
  const enrichedKings = await Promise.all(
    matchedProfiles.map(async (p: UserProfile & { similarity: number }) => {
      const { object } = await generateObject({
        model: geminiPro,
        schema: z.object({
          matchReason: z.string().describe(
            'A very short, one-sentence explanation for why this person is a good match for the query.',
          ),
        }),
        prompt: `The user is looking for: "${input.query}".
Based on this profile, why are they a good match?
Bio: "${p.bio ?? ''}"
Interests: ${(p.interests ?? []).join(', ')}`,
      });

      return {
        profile: p as UserProfile,
        matchScore: Math.round((p.similarity ?? 0) * 100),
        matchReason: object.matchReason ?? 'A mysterious connection awaits.',
      };
    }),
  );

  enrichedKings.sort((a, b) => b.matchScore - a.matchScore);
  return { kings: enrichedKings };
}

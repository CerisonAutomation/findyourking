'use server';
/**
 * @fileOverview An AI agent for finding matching user profiles using vector search.
 *
 * - findKings - A function that finds profiles based on a natural language query.
 * - FindKingsInput - The input type for the findKings function.
 * - FindKingsOutput - The return type for the findKings function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase-server';
import { generate } from 'genkit/ai';

// Define the Zod schema for a UserProfile.
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
  embedding: z.array(z.number()).nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

const FindKingsInputSchema = z.object({
  query: z.string().describe('A natural language description of the ideal user to find.'),
  requestingUserId: z.string().describe('The UID of the user performing the search.'),
});
export type FindKingsInput = z.infer<typeof FindKingsInputSchema>;

const MatchedKingSchema = z.object({
    profile: UserProfileSchema,
    matchScore: z.number().describe('A score from 0-100 indicating how good of a match this person is, based on the query. 100 is a perfect match.'),
    matchReason: z.string().describe('A short, one-sentence explanation for why this person is a good match.'),
});

const FindKingsOutputSchema = z.object({
    kings: z.array(MatchedKingSchema),
});
export type FindKingsOutput = z.infer<typeof FindKingsOutputSchema>;


export async function findKings(
  input: FindKingsInput
): Promise<FindKingsOutput> {
  return findKingsFlow(input);
}


const findKingsFlow = ai.defineFlow(
  {
    name: 'findKingsFlow',
    inputSchema: FindKingsInputSchema,
    outputSchema: FindKingsOutputSchema,
  },
  async (input) => {
    // 1. Generate an embedding for the user's natural language query.
    const embeddingResponse = await generate({
      model: 'google-ai/text-embedding-004',
      prompt: input.query,
    });
    const queryEmbedding = embeddingResponse.embedding;

    if (!queryEmbedding) {
      throw new Error('Failed to generate embedding for the query.');
    }
    
    // 2. Call the Supabase database function to find matching profiles.
    const supabase = createClient();
    const { data: matchedProfiles, error: matchError } = await supabase.rpc('match_kings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Adjust this threshold as needed
        match_count: 10,
        requesting_user_id: input.requestingUserId,
    });

    if (matchError) {
        console.error('Supabase RPC error:', matchError);
        throw new Error(`Failed to find kings: ${matchError.message}`);
    }

    if (!matchedProfiles || matchedProfiles.length === 0) {
        return { kings: [] };
    }

    // 3. Use an LLM to generate a personalized reason for each match.
    const reasonerPrompt = ai.definePrompt({
        name: 'matchReasonerPrompt',
        input: { schema: z.object({
            query: z.string(),
            profile: UserProfileSchema,
        })},
        output: { schema: z.object({
            matchReason: z.string().describe('A very short, one-sentence explanation for why this person is a good match for the query.'),
        }) },
        prompt: `The user is looking for: "{{query}}". Based on this profile, why are they a good match?
Profile:
- Bio: "{{profile.bio}}"
- Interests: {{#if profile.interests}}{{#each profile.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
`,
    });

    const enrichedKings = await Promise.all(
        matchedProfiles.map(async (p: any) => {
            const profile = p as UserProfile;
            const similarity = p.similarity as number;

            const { output } = await reasonerPrompt({
                query: input.query,
                profile: profile,
            });

            return {
                profile: profile,
                matchScore: Math.round(similarity * 100),
                matchReason: output?.matchReason || 'A mysterious connection awaits.',
            };
        })
    );

    // Sort by match score descending
    enrichedKings.sort((a, b) => b.matchScore - a.matchScore);

    return { kings: enrichedKings };
  }
);

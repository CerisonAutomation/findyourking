'use server';

import { embed } from 'genkit/ai';
import { defineFlow, run } from 'genkit/flow';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

// Define the text embedding model from Google AI
const textEmbedding = googleAI('text-embedding-004');

// Zod schema for the user profile data used to generate embeddings
export const userProfileSchema = z.object({
  bio: z.string().optional().default(''),
  interests: z.array(z.string()).optional().default([]),
  display_name: z.string().optional().default(''),
});

// Genkit flow to generate an embedding for a user profile
export const generateProfileEmbedding = defineFlow(
  {
    name: 'generateProfileEmbedding',
    inputSchema: userProfileSchema,
    outputSchema: z.array(z.number()),
  },
  async (profile) => {
    // Create a unified text representation of the user's profile
    const inputText = `
      Display Name: ${profile.display_name}
      Bio: ${profile.bio}
      Interests: ${profile.interests.join(', ')}
    `;

    // Generate the embedding using the specified model
    const embedding = await run('embed-profile', async () => {
      const { embedding } = await embed({
        embedder: textEmbedding,
        content: inputText,
      });
      return embedding;
    });

    return embedding;
  }
);

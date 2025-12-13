'use server';
/**
 * @fileoverview A server-side script to generate and backfill embeddings for all user profiles.
 * This should be run via `npm run db:generate-embeddings` after setting up the environment.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generate } from 'genkit/ai';
import type { UserProfile } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in the environment variables.');
}

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function generateAndStoreEmbeddings() {
  console.log('Fetching all user profiles...');
  
  // 1. Fetch all profiles from the database
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found to process.');
    return;
  }

  console.log(`Found ${profiles.length} profiles. Generating embeddings...`);

  // 2. Generate embeddings for each profile
  for (const profile of profiles as UserProfile[]) {
    // Create a meaningful text block from the profile data
    const content = `Bio: ${profile.bio || ''}. Interests: ${(profile.interests || []).join(', ')}. Location: ${profile.location || ''}.`;

    try {
      console.log(`Generating embedding for user: ${profile.id}`);
      
      const embeddingResponse = await generate({
        model: 'google-ai/text-embedding-004',
        prompt: content,
      });
      
      const embedding = embeddingResponse.embedding;

      // 3. Update the profile in Supabase with the new embedding
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ embedding: embedding })
        .eq('userId', profile.userId);
      
      if (updateError) {
        console.error(`Failed to update profile for ${profile.id}:`, updateError.message);
      } else {
        console.log(`Successfully stored embedding for user: ${profile.id}`);
      }

    } catch (e) {
      console.error(`Could not generate embedding for profile ${profile.id}:`, e);
    }
  }

  console.log('Embedding generation complete.');
}

generateAndStoreEmbeddings().catch(console.error);

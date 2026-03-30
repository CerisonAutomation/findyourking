'use server';
/**
 * @fileOverview Photo curation AI — Vercel AI SDK implementation.
 *
 * - suggestBestPhotos        — analyse photos and pick the best one
 * - SuggestBestPhotosInput   — input type
 * - SuggestBestPhotosOutput  — output type
 */

import { generateObject } from 'ai';
import { geminiPro } from '@/ai/genkit';
import { z } from 'zod';

const PhotoAnalysisSchema = z.object({
  photoDataUri: z.string().describe('Data URI of the photo being analysed.'),
  score: z.number().describe('Attractiveness score 1-10 for a gay male dating app profile picture.'),
  feedback: z.string().describe(
    'Specific, constructive feedback on lighting, composition, subject matter and overall vibe.',
  ),
  isRecommended: z.boolean().describe(
    'Whether this photo is recommended as a primary profile picture.',
  ),
});

const SuggestBestPhotosInputSchema = z.object({
  photoDataUris: z.array(z.string()).describe(
    "Photos to analyse as data URIs. Format: 'data:<mimetype>;base64,<encoded_data>'.",
  ),
});
export type SuggestBestPhotosInput = z.infer<typeof SuggestBestPhotosInputSchema>;

const SuggestBestPhotosOutputSchema = z.object({
  bestPhotoDataUri: z.string().describe('Data URI of the top-recommended photo.'),
  overallSummary: z.string().describe('2-3 sentence summary with high-level advice.'),
  analysis: z.array(PhotoAnalysisSchema),
});
export type SuggestBestPhotosOutput = z.infer<typeof SuggestBestPhotosOutputSchema>;

export async function suggestBestPhotos(
  input: SuggestBestPhotosInput,
): Promise<SuggestBestPhotosOutput> {
  const photosDescription = input.photoDataUris
    .map((uri, i) => `Photo ${i}: ${uri.slice(0, 80)}...`)
    .join('\n');

  const { object } = await generateObject({
    model: geminiPro,
    schema: SuggestBestPhotosOutputSchema,
    system:
      'You are the AI King, a discerning critic for the luxury gay dating app FYKING.MEN. ' +
      'Analyse profile pictures and provide expert, actionable feedback. ' +
      'Be direct, sophisticated, and a little bit sassy.',
    prompt:
      `Analyse the following ${input.photoDataUris.length} profile photo(s) for a gay male dating app.\n` +
      `For each photo provide: score (1-10), specific feedback, and isRecommended.\n` +
      `Then identify the bestPhotoDataUri (the data URI of your top pick) and write an overallSummary.\n\n` +
      `Photos:\n${photosDescription}`,
  });

  return object;
}

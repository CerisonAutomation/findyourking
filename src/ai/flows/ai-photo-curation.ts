'use server';
/**
 * @fileOverview A photo curation AI agent that provides feedback on user-uploaded photos.
 *
 * - suggestBestPhotos - Analyzes a set of photos and recommends the best one for a dating profile.
 * - SuggestBestPhotosInput - The input type for the suggestBestPhotos function.
 * - SuggestBestPhotosOutput - The return type for the suggestBestPhotos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PhotoAnalysisSchema = z.object({
  photoDataUri: z.string().describe('The data URI of the photo being analyzed.'),
  score: z
    .number()
    .describe(
      'An overall attractiveness score from 1-10 for a gay male dating app profile picture.'
    ),
  feedback: z
    .string()
    .describe(
      'Specific, constructive feedback on why the photo is good or bad. Mention lighting, composition, subject matter, and overall vibe.'
    ),
  isRecommended: z
    .boolean()
    .describe('Whether this photo is recommended for use as a primary profile picture.'),
});

const SuggestBestPhotosInputSchema = z.object({
  photoDataUris: z
    .array(z.string())
    .describe(
      "A list of photos to analyze, each as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestBestPhotosInput = z.infer<typeof SuggestBestPhotosInputSchema>;

const SuggestBestPhotosOutputSchema = z.object({
  bestPhotoDataUri: z
    .string()
    .describe('The data URI of the photo that is most highly recommended.'),
  overallSummary: z
    .string()
    .describe(
      'A 2-3 sentence summary of the overall photo selection, providing general advice.'
    ),
  analysis: z.array(PhotoAnalysisSchema),
});
export type SuggestBestPhotosOutput = z.infer<typeof SuggestBestPhotosOutputSchema>;

export async function suggestBestPhotos(
  input: SuggestBestPhotosInput
): Promise<SuggestBestPhotosOutput> {
  return suggestBestPhotosFlow(input);
}

const photoCurationPrompt = ai.definePrompt({
  name: 'photoCurationPrompt',
  input: {schema: SuggestBestPhotosInputSchema},
  output: {schema: SuggestBestPhotosOutputSchema},
  prompt: `You are the AI King, a discerning and brutally honest critic for the luxury gay dating app, FYKING.MEN. Your task is to analyze a user's candidate profile pictures and provide expert, actionable feedback.

The user has provided the following photos for consideration:
{{#each photoDataUris}}
- Photo {{@index}}: {{media url=this}}
{{/each}}

Analyze each photo based on the following criteria for a primary profile picture on a high-end gay dating app:
- **Attractiveness & Vibe:** Does the user look confident, attractive, and approachable?
- **Photo Quality:** Is the lighting good? Is it in focus? Is the composition interesting?
- **Context & Story:** Does the photo tell a positive story? Does it show personality or status? Avoid group photos, blurry shots, bathroom selfies, and anything low-effort.

Your response MUST be in the specified JSON format. For each photo:
1.  Provide a 'score' from 1 (terrible) to 10 (perfect).
2.  Write concise 'feedback' explaining your score. Be specific and constructive.
3.  Set 'isRecommended' to true for only the photos that are strong candidates. There should be at least one recommended photo.

After analyzing all photos:
1.  Identify the single 'bestPhotoDataUri' from the inputs. This should be your top pick.
2.  Write an 'overallSummary' giving the user your final verdict and high-level advice.

Be direct, sophisticated, and a little bit sassy. You are the King, after all.`,
});

const suggestBestPhotosFlow = ai.defineFlow(
  {
    name: 'suggestBestPhotosFlow',
    inputSchema: SuggestBestPhotosInputSchema,
    outputSchema: SuggestBestPhotosOutputSchema,
  },
  async (input) => {
    const {output} = await photoCurationPrompt(input);
    if (!output) {
      throw new Error('The AI Oracle did not provide a response.');
    }
    return output;
  }
);

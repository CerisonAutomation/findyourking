'use server';
/**
 * @fileOverview An AI agent for generating dating profile bios.
 *
 * - generateProfile - A function that creates a compelling bio based on user traits.
 * - GenerateProfileInput - The input type for the generateProfile function.
 * - GenerateProfileOutput - The return type for the generateProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateProfileInputSchema = z.object({
    age: z.number().describe('The age of the user.'),
    location: z.string().describe('The city and country of the user.'),
    height: z.number().describe('The height of the user in centimeters.'),
    job: z.string().describe('The profession or job of the user.'),
    style: z.string().describe('The personal fashion style of the user (e.g., minimalist, streetwear).'),
    vibe: z.string().describe('The general personality vibe of the user (e.g., ambitious, creative).'),
    interests: z.array(z.string()).describe("A list of the user's interests or hobbies."),
});
export type GenerateProfileInput = z.infer<typeof GenerateProfileInputSchema>;

export const GenerateProfileOutputSchema = z.object({
  bio: z
    .string()
    .describe(
      'A compelling, well-written, and sophisticated dating profile bio of 2-4 sentences. It should be confident, slightly witty, and intriguing, suitable for a luxury gay dating app.'
    ),
});
export type GenerateProfileOutput = z.infer<typeof GenerateProfileOutputSchema>;

export async function generateProfile(input: GenerateProfileInput): Promise<GenerateProfileOutput> {
    return generateProfileFlow(input);
}

const profileGenerationPrompt = ai.definePrompt({
    name: 'profileGenerationPrompt',
    input: {schema: GenerateProfileInputSchema},
    output: {schema: GenerateProfileOutputSchema},
    prompt: `You are the AI King, a master wordsmith for the luxury gay dating app, FYKING.MEN. Your task is to craft a world-class profile bio for a new user based on the raw data they've provided.

The bio must be:
- **Sophisticated & Witty:** Avoid cliches and basic language.
- **Confident & Intriguing:** Hint at a life well-lived without bragging.
- **Concise:** 2-4 sentences maximum.
- **Targeted:** Appeal to an audience of successful, ambitious, and discerning gay men.

User's Data:
- Age: {{{age}}}
- Location: {{{location}}}
- Height: {{{height}}} cm
- Profession: {{{job}}}
- Personal Style: {{{style}}}
- Vibe: {{{vibe}}}
- Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on this, generate the perfect 'bio' for his profile. Focus on weaving the most interesting aspects into a narrative. For example, connect his job to his vibe, or his interests to his style. Do not just list the facts. Create a story.
`,
});

const generateProfileFlow = ai.defineFlow(
  {
    name: 'generateProfileFlow',
    inputSchema: GenerateProfileInputSchema,
    outputSchema: GenerateProfileOutputSchema,
  },
  async (input) => {
    const {output} = await profileGenerationPrompt(input);
    if (!output) {
      throw new Error('The AI King is currently holding court and cannot be disturbed.');
    }
    return output;
  }
);

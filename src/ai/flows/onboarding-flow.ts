'use server';
/**
 * @fileOverview A conversational AI agent for onboarding new users.
 *
 * - onboardKing - A function that handles the conversational onboarding process.
 * - OnboardingState - The type for the user's profile data being built.
 * - OnboardKingOutput - The return type for the onboardKing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { allInterests } from '@/lib/data';

export const OnboardingStateSchema = z.object({
  id: z.string().nullable().describe('The user-defined display name/handle.'),
  age: z.number().nullable().describe("The user's age."),
  location: z.string().nullable().describe("The user's city and country."),
  height: z.number().nullable().describe('The height of the user in centimeters.'),
  job: z.string().nullable().describe("The user's profession."),
  style: z.string().nullable().describe('The personal fashion style of the user (e.g., minimalist, streetwear).'),
  vibe: z.string().nullable().describe('The general personality vibe of the user (e.g., ambitious, creative).'),
  interests: z.array(z.string()).describe("A list of the user's interests or hobbies."),
  bio: z.string().nullable().describe('A compelling, well-written, and sophisticated dating profile bio.'),
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;

const OnboardKingInputSchema = z.object({
  userId: z.string(),
  message: z.string(),
  currentState: OnboardingStateSchema,
});

export const OnboardKingOutputSchema = z.object({
  response: z.string().describe('The AI King\'s reply to the user.'),
  updatedState: OnboardingStateSchema.describe(
    'The updated profile state after processing the user\'s message.'
  ),
  isComplete: z.boolean().describe('Whether all required onboarding fields are now filled.'),
});
export type OnboardKingOutput = z.infer<typeof OnboardKingOutputSchema>;

// This is the tool the AI will use to figure out what to ask next.
const getMissingFieldsTool = ai.defineTool(
  {
    name: 'getMissingOnboardingFields',
    description: 'Call this to determine which onboarding questions still need to be asked. Returns a list of fields that are still null or empty.',
    inputSchema: OnboardingStateSchema,
    outputSchema: z.array(z.string()),
  },
  async (state) => {
    const missingFields: string[] = [];
    for (const key in state) {
        const value = state[key as keyof OnboardingState];
        if (value === null || (Array.isArray(value) && value.length === 0)) {
            missingFields.push(key);
        }
    }
    // Don't ask for bio until other fields are filled
    if (missingFields.length > 1 && missingFields.includes('bio')) {
        return missingFields.filter(f => f !== 'bio');
    }
    return missingFields;
  }
);

const onboardingPrompt = ai.definePrompt({
    name: 'onboardingPrompt',
    tools: [getMissingFieldsTool],
    input: { schema: OnboardKingInputSchema },
    output: { schema: OnboardKingOutputSchema },
    prompt: `You are the AI King, a master wordsmith for the luxury gay dating app, FYKING.MEN. Your task is to onboard a new user by having a conversation with them to build their profile.

You will be given the user's message and their current profile state. Your goal is to fill in all the fields in the state.

**Your Process:**
1.  **Analyze the current state.** Use the 'getMissingOnboardingFields' tool to see what information is missing.
2.  **Ask the next question.** Based on the missing fields, ask a single, clear, and charming question to get the next piece of information. Be conversational, not robotic. Address the user as "Your Majesty" or "King".
3.  **Process the user's reply.** The user will reply to your question. Your job is to extract the relevant information and update the 'updatedState' object.
4.  **Update the state.** When you get a piece of information, put it in the correct field of 'updatedState'.
5.  **Handle small talk.** If the user makes a comment that doesn't directly answer a question, reply charismatically and then steer the conversation back to the next onboarding question.
6.  **Suggest Interests.** When asking for interests, provide a few examples from the list of available interests to guide them. Available interests: ${allInterests.join(', ')}. Ask for at least three.
7.  **Generate the Bio.** Once all other fields are filled, your final task is to generate a compelling, 2-4 sentence bio. Present it to the user for their approval.
8.  **Congratulate.** Once the bio is approved and all fields are full, congratulate them on their coronation and tell them to hit the "Enter the Kingdom" button.

**Current Profile State:**
\`\`\`json
{{{jsonEncode currentState}}}
\`\`\`

**User's Message:**
"{{{message}}}"

Now, fulfill your duty. Determine the next step, ask your question, or update the state based on the user's message, and provide your response.
`,
});

export async function onboardKing(
  input: z.infer<typeof OnboardKingInputSchema>
): Promise<OnboardKingOutput> {
  const { output } = await onboardingPrompt(input);
  if (!output) {
    throw new Error('The AI King is currently holding court and cannot be disturbed.');
  }

  // Ensure all fields are at least null
  const finalState = { ...initialOnboardingState, ...output.updatedState };
  for (const key in initialOnboardingState) {
    if (!(key in finalState)) {
      (finalState as any)[key] = null;
    }
  }

  const isComplete = !Object.values(finalState).some(
    (value) => value === null || (Array.isArray(value) && value.length === 0)
  );

  return { ...output, updatedState: finalState, isComplete };
}

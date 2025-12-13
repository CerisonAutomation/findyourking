'use server';

import { googleAI } from '@genkit-ai/google-genai';
import { configureGenkit } from 'genkit';

export default configureGenkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

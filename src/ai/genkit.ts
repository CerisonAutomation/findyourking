/**
 * @fileOverview Shared Vercel AI SDK model instances.
 * Replaces the Genkit `ai` singleton — all flows now use @ai-sdk/google directly.
 */
import { google } from '@ai-sdk/google';

/** Primary generative model for all chat/structured-generation flows. */
export const geminiPro = google('gemini-2.0-flash');

/** Embedding model for vector search. */
export const embeddingModel = google.textEmbeddingModel('text-embedding-004');

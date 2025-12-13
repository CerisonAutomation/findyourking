/**
 * @fileOverview A universal, server-side API adapter for making standardized,
 * secure, and cache-aware fetch requests. This should only be used on the server.
 */

import { z } from 'zod';

// Define a generic schema for API errors to ensure consistent error handling.
const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});

type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * A custom error class for API-related issues.
 * This allows for structured error handling in the calling code.
 */
export class AdapterError extends Error {
  public readonly details: any;
  public readonly statusCode: number;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'AdapterError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface ApiAdapterOptions<T> extends RequestInit {
  responseSchema: z.ZodType<T>;
}

/**
 * A universal server-side API adapter.
 *
 * This function provides a standardized, type-safe way to interact with any RESTful API.
 * It handles request setup, response parsing, validation against a Zod schema,
 * and structured error handling. It leverages Next.js's extended fetch for caching.
 *
 * @template T The expected type of the successful API response data.
 * @param {string} url The URL of the API endpoint to call.
 * @param {ApiAdapterOptions<T>} options The options for the request, including the Zod schema for response validation.
 * @returns {Promise<T>} A promise that resolves with the validated API response data.
 * @throws {AdapterError} Throws an AdapterError for network issues, non-2xx responses, or validation failures.
 */
export async function apiAdapter<T>(
  url: string,
  options: ApiAdapterOptions<T>
): Promise<T> {
  const { responseSchema, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // Example: Centralize API key management. Ensure the key exists in .env.local
        // 'Authorization': `Bearer ${process.env.THIRD_PARTY_API_KEY}`,
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    if (!response.ok) {
      // Attempt to parse a structured error from the API body
      try {
        const errorData: unknown = await response.json();
        const parsedError = ApiErrorSchema.safeParse(errorData);

        if (parsedError.success) {
          throw new AdapterError(
            parsedError.data.error,
            response.status,
            parsedError.data.details
          );
        } else {
          // If the body doesn't match our error schema, throw a generic error
          throw new AdapterError(
            `API returned status ${response.status} with non-standard error format.`,
            response.status,
            await response.text()
          );
        }
      } catch (e) {
        // If parsing the error body fails or if it's already an AdapterError
        if (e instanceof AdapterError) throw e;
        throw new AdapterError(
          `API request failed with status ${response.status}.`,
          response.status
        );
      }
    }

    const data: unknown = await response.json();
    const validationResult = responseSchema.safeParse(data);

    if (!validationResult.success) {
      // The response data does not match the expected schema
      throw new AdapterError(
        'API response validation failed.',
        response.status,
        validationResult.error.flatten() // Provide detailed validation errors
      );
    }

    return validationResult.data;
  } catch (error) {
    if (error instanceof AdapterError) {
      // Re-throw our custom error to be caught by the caller
      throw error;
    }
    
    // Handle network errors or other unexpected issues
    const networkError = error as Error;
    throw new AdapterError(
      `Network or system error: ${networkError.message}`,
      500, // Internal Server Error
      networkError
    );
  }
}

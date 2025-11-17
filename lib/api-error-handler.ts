/**
 * Standardized API Error Handling
 *
 * Provides consistent error handling across all API routes
 * Implements proper logging, error categorization, and user-facing messages
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Error categories for consistent handling */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

/** Error response structure */
export interface ApiError {
  message: string;
  category: ErrorCategory;
  code?: string;
  status: number;
  requestId?: string;
  timestamp?: string;
}

/** Extract request ID for tracing */
export function getRequestId(request: NextRequest): string {
  return (
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
}

/**
 * Determine error category from error object
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('not found') || message.includes('not exist')) {
      return ErrorCategory.NOT_FOUND;
    }
    if (
      message.includes('unauthorized') ||
      message.includes('not authenticated')
    ) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('not authorized')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('conflict') || message.includes('duplicate')) {
      return ErrorCategory.CONFLICT;
    }
    if (
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return ErrorCategory.RATE_LIMIT;
    }
    if (message.includes('database') || message.includes('postgres')) {
      return ErrorCategory.DATABASE;
    }
  }

  return ErrorCategory.INTERNAL;
}

/**
 * Get user-friendly error message based on category
 */
export function getUserMessage(
  category: ErrorCategory,
  originalMessage?: string,
): string {
  const messages: Record<ErrorCategory, string> = {
    [ErrorCategory.VALIDATION]:
      'Invalid request data. Please check your input.',
    [ErrorCategory.AUTHENTICATION]: 'Authentication required. Please log in.',
    [ErrorCategory.AUTHORIZATION]:
      'You do not have permission to perform this action.',
    [ErrorCategory.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCategory.CONFLICT]:
      'This resource already exists or conflicts with existing data.',
    [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please try again later.',
    [ErrorCategory.EXTERNAL_API]:
      'External service temporarily unavailable. Please try again.',
    [ErrorCategory.DATABASE]: 'Database error. Please try again later.',
    [ErrorCategory.INTERNAL]: 'An unexpected error occurred. Please try again.',
  };

  return messages[category];
}

/**
 * Get HTTP status code based on error category
 */
export function getStatusCode(category: ErrorCategory): number {
  const codes: Record<ErrorCategory, number> = {
    [ErrorCategory.VALIDATION]: 400,
    [ErrorCategory.AUTHENTICATION]: 401,
    [ErrorCategory.AUTHORIZATION]: 403,
    [ErrorCategory.NOT_FOUND]: 404,
    [ErrorCategory.CONFLICT]: 409,
    [ErrorCategory.RATE_LIMIT]: 429,
    [ErrorCategory.EXTERNAL_API]: 502,
    [ErrorCategory.DATABASE]: 500,
    [ErrorCategory.INTERNAL]: 500,
  };

  return codes[category];
}

/**
 * Log API error with context
 */
export function logApiError(
  context: string,
  error: unknown,
  requestId: string,
  additionalContext?: Record<string, unknown>,
): void {
  const category =
    error instanceof Error ? categorizeError(error) : ErrorCategory.INTERNAL;
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      context,
      category,
      message,
      requestId,
      ...(stack && { stack }),
      ...(additionalContext && { context: additionalContext }),
    }),
  );
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  requestId: string,
  overrideStatus?: number,
  overrideMessage?: string,
): NextResponse<ApiError> {
  const category =
    error instanceof Error ? categorizeError(error) : ErrorCategory.INTERNAL;
  const status = overrideStatus || getStatusCode(category);
  const message = overrideMessage || getUserMessage(category);

  return NextResponse.json(
    {
      message,
      category,
      status,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

/**
 * Create success response with proper typing
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Validate required query parameters
 */
export function validateQueryParams(
  url: URL,
  required: string[],
): { valid: boolean; missing?: string[] } {
  const missing = required.filter((param) => !url.searchParams.has(param));

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Safely parse JSON request body with error handling
 */
export async function safeParseJson<T>(
  request: NextRequest,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse JSON',
    };
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 100,
  maxDelayMs: number = 5000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Calculate exponential backoff with jitter
        const delayMs = Math.min(
          baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelayMs,
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

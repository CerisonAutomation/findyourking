import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { NextResponse, type NextRequest } from 'next/server';
import { chatRequestSchema } from '@/lib/validation';
import type { ChatMessage } from '@/types/database';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import {
  createErrorResponse,
  logApiError,
  getRequestId,
  safeParseJson,
} from '@/lib/api-error-handler';
import { getSecurityHeaders } from '@/lib/api-security';

export const runtime = 'edge';

const gateway = createGateway({
  apiKey: process.env['AI_GATEWAY_API_KEY'],
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  headers: {
    'http-referer': process.env['VERCEL_URL']
      ? `https://${process.env['VERCEL_URL']}`
      : 'http://localhost:3000',
    'x-title': 'FindYourKing Chat API',
  },
});

/**
 * POST /api/chat
 * Stream chat messages to AI model
 *
 * Handles real-time chat streaming with AI companion models.
 * Requires valid authentication and message history.
 * Returns Server-Sent Events stream for client-side consumption.
 *
 * @param {NextRequest} req - Request object containing:
 *   - messages: Array<{ role: 'user'|'assistant'|'system', content: string }> - Message history
 *   - kingId: string (UUID) - King/companion profile ID
 *
 * @returns {Promise<Response>} Either:
 *   - Streaming response with Content-Type: text/event-stream
 *   - 400: Invalid request format
 *   - 401: Authentication required
 *   - 500: Chat service error
 *
 * @throws {Error} On JSON parsing or AI streaming failure
 */
async function handlePOST(req: NextRequest) {
  const requestId = getRequestId(req);

  try {
    const parseResult = await safeParseJson<{
      messages: unknown;
      kingId: string;
    }>(req);
    if (!parseResult.success) {
      return createErrorResponse(
        new Error(parseResult.error),
        requestId,
        400,
        'Invalid request format',
      );
    }

    const parsed = chatRequestSchema.safeParse(parseResult.data);

    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(', ');
      logApiError('chat', new Error(message), requestId, {
        validationErrors: parsed.error.issues,
      });
      return createErrorResponse(
        new Error(message),
        requestId,
        400,
        'Validation error',
      );
    }

    const { messages, kingId } = parsed.data;

    const result = await streamText({
      model: gateway('ollama/qwen3-coder:480b'),
      messages: messages as ChatMessage[],
    });

    const response = result.toTextStreamResponse();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (err: unknown) {
    logApiError('chat', err, requestId);
    const response = createErrorResponse(
      err instanceof Error ? err : new Error('Unknown error'),
      requestId,
      500,
      'Chat service temporarily unavailable',
    );
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

// Export with rate limiting
export const POST = withRateLimit(handlePOST, RATE_LIMITS.CHAT);

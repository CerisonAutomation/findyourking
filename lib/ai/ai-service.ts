/**
 * AI Service - Centralized AI API Management
 * Handles all AI-related API calls with security, rate limiting, and error handling
 */

import { z } from 'zod';
import { GameMoveResult, BoyfriendPersonalityData } from '@/lib/types';

// Input validation schemas
const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  boyfriendId: z.string().uuid(),
});

const GameMoveSchema = z.object({
  move: z.string().regex(/^[a-c][1-3]$/, 'Invalid move format (e.g., a1, b2, c3)'),
  boyfriendId: z.string().uuid(),
});

export class AIService {
  private static readonly BASE_URL = '/api/boyfriend';
  private static readonly RATE_LIMITS = {
    chat: { requests: 5, windowMs: 10000 }, // 5 messages per 10 seconds
    game: { requests: 10, windowMs: 60000 }, // 10 moves per minute
  };

  private static rateLimiters = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check and update rate limiting
   */
  private static checkRateLimit(action: keyof typeof AIService.RATE_LIMITS): boolean {
    const limiter = this.RATE_LIMITS[action];
    const key = `ai_${action}`;
    const now = Date.now();

    const current = this.rateLimiters.get(key);
    if (!current || now > current.resetTime) {
      this.rateLimiters.set(key, { count: 1, resetTime: now + limiter.windowMs });
      return true;
    }

    if (current.count >= limiter.requests) {
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Send chat message with streaming support
   */
  static async *sendChatMessage(
    message: string,
    boyfriendId: string
  ): AsyncGenerator<string, void, unknown> {
    // Validate input
    const validated = ChatMessageSchema.parse({ message, boyfriendId });

    // Check rate limit
    if (!this.checkRateLimit('chat')) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Chat API error: ${error}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          yield chunk;
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('AI chat service error');
    }
  }

  /**
   * Make a game move
   */
  static async makeGameMove(move: string, boyfriendId: string): Promise<GameMoveResult> {
    // Validate input
    const validated = GameMoveSchema.parse({ move, boyfriendId });

    // Check rate limit
    if (!this.checkRateLimit('game')) {
      throw new Error('Rate limit exceeded. Please wait before making another move.');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Game API error: ${error}`);
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('AI game service error');
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(
    messageId: string,
    reaction: string,
    boyfriendId: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, reaction, boyfriendId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Reaction API error: ${error}`);
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('AI reaction service error');
    }
  }

  /**
   * Get boyfriend personality data
   */
  static async getBoyfriendPersonality(boyfriendId: string): Promise<BoyfriendPersonalityData> {
    try {
      const response = await fetch(`${this.BASE_URL}/personality/${boyfriendId}`);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Personality API error: ${error}`);
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('AI personality service error');
    }
  }

  /**
   * Update boyfriend personality
   */
  static async updateBoyfriendPersonality(
    boyfriendId: string,
    updates: Partial<{
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
      formality: number;
      verbosity: number;
      humor: number;
      emotiveness: number;
      playfulness: number;
      flirtiness: number;
    }>
  ): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/personality/${boyfriendId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Update personality API error: ${error}`);
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('AI update personality error');
    }
  }
}

// Error types for better error handling
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class RateLimitError extends AIError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AIError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
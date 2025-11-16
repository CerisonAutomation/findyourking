/**
 * Rate Limiting Tests
 * Verifies rate limiting works correctly
 */

import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  const identifier = 'test-user-id';

  beforeEach(() => {
    // Clear rate limit state between tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests within limit', async () => {
    const result1 = await checkRateLimit(identifier, {
      maxRequests: 3,
      windowMs: 60000,
    });
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = await checkRateLimit(identifier, {
      maxRequests: 3,
      windowMs: 60000,
    });
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
  });

  it('blocks requests over limit', () => {
    checkRateLimit(identifier, { maxRequests: 2, windowMs: 60000 });
    checkRateLimit(identifier, { maxRequests: 2, windowMs: 60000 });

    const result = checkRateLimit(identifier, {
      maxRequests: 2,
      windowMs: 60000,
    });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('includes rate limit headers', () => {
    const result = checkRateLimit(identifier + '2', {
      maxRequests: 10,
      windowMs: 60000,
    });

    expect(result.headers['X-RateLimit-Limit']).toBe('10');
    expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
    expect(result.headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('includes Retry-After header when blocked', () => {
    const config = { maxRequests: 1, windowMs: 60000 };

    checkRateLimit(identifier + '3', config);
    const result = checkRateLimit(identifier + '3', config);

    expect(result.headers['Retry-After']).toBeDefined();
  });

  it('has correct preset limits', () => {
    expect(RATE_LIMITS.AI.maxRequests).toBe(10);
    expect(RATE_LIMITS.AUTH.maxRequests).toBe(5);
    expect(RATE_LIMITS.API.maxRequests).toBe(60);
    expect(RATE_LIMITS.CHAT.maxRequests).toBe(30);
  });
});

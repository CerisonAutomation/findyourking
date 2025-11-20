/**
 * Production-Grade Caching Utilities
 * Per Next.js: https://nextjs.org/docs/app/building-your-application/caching
 * Per React: https://react.dev/reference/react/cache
 */

import { unstable_cache } from 'next/cache';
import { cache as reactCache } from 'react';

/**
 * Cache configuration types
 */
export interface CacheConfig {
  /**
   * Cache duration in seconds
   * @default 3600 (1 hour)
   */
  revalidate?: number;

  /**
   * Cache tags for invalidation
   */
  tags?: string[];
}

/**
 * Create a cached function with Next.js unstable_cache
 * Use for expensive database queries or API calls
 *
 * @example
 * const getUserProfile = createCachedFunction(
 *   async (userId: string) => {
 *     return await supabase.from('profiles').select('*').eq('id', userId).single();
 *   },
 *   {
 *     keyPrefix: 'user-profile',
 *     revalidate: 3600, // 1 hour
 *     tags: ['profile'],
 *   }
 * );
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyPrefix: string;
    revalidate?: number;
    tags?: string[];
  }
): T {
  return unstable_cache(
    fn,
    [options.keyPrefix],
    {
      revalidate: options.revalidate || 3600,
      tags: options.tags || [options.keyPrefix],
    }
  ) as T;
}

/**
 * Create a React cached function (deduplicate during render)
 * Use for functions called multiple times in the same render
 *
 * @example
 * const getUser = createReactCache(async (userId: string) => {
 *   return await supabase.from('users').select('*').eq('id', userId).single();
 * });
 */
export function createReactCache<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return reactCache(fn) as T;
}

/**
 * Common cache durations in seconds
 */
export const CACHE_DURATIONS = {
  /** 1 minute - for frequently changing data */
  SHORT: 60,

  /** 5 minutes - for moderately dynamic data */
  MEDIUM: 300,

  /** 1 hour - for relatively static data */
  LONG: 3600,

  /** 24 hours - for very static data */
  DAY: 86400,

  /** 1 week - for rarely changing data */
  WEEK: 604800,

  /** Revalidate on every request */
  NONE: 0,
} as const;

/**
 * Cache key generators
 */
export const cacheKeys = {
  user: {
    profile: (userId: string) => `user:profile:${userId}`,
    preferences: (userId: string) => `user:preferences:${userId}`,
    matches: (userId: string) => `user:matches:${userId}`,
    messages: (userId: string, chatId: string) => `user:messages:${userId}:${chatId}`,
  },

  match: {
    potentialMatches: (userId: string, filters?: string) =>
      `match:potential:${userId}${filters ? `:${filters}` : ''}`,
    mutualMatches: (userId: string) => `match:mutual:${userId}`,
  },

  profile: {
    public: (userId: string) => `profile:public:${userId}`,
    private: (userId: string) => `profile:private:${userId}`,
  },

  chat: {
    messages: (channelId: string) => `chat:messages:${channelId}`,
    unreadCount: (userId: string) => `chat:unread:${userId}`,
  },
} as const;

/**
 * Cache tag generators for invalidation
 */
export const cacheTags = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  userMatches: (userId: string) => `user:matches:${userId}`,
  allMatches: () => 'matches',
  allProfiles: () => 'profiles',
  allMessages: () => 'messages',
} as const;

/**
 * In-memory cache for client-side (Map-based with TTL)
 */
class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  set(key: string, value: T, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Global client-side cache instance
 * Use for caching API responses, user data, etc.
 */
export const memoryCache = new MemoryCache();

/**
 * Memoize function results with TTL
 * Client-side only
 *
 * @example
 * const expensiveFunction = memoize(
 *   async (userId: string) => {
 *     const response = await fetch(`/api/users/${userId}`);
 *     return response.json();
 *   },
 *   { ttl: 300 }
 * );
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { ttl?: number; keyFn?: (...args: Parameters<T>) => string } = {}
): T {
  const { ttl = 3600, keyFn = (...args: any[]) => JSON.stringify(args) } = options;

  return ((...args: Parameters<T>) => {
    const key = `memo:${fn.name}:${keyFn(...args)}`;
    const cached = memoryCache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);

    // If it's a promise, cache the resolved value
    if (result instanceof Promise) {
      return result.then((value) => {
        memoryCache.set(key, value, ttl);
        return value;
      });
    }

    memoryCache.set(key, result, ttl);
    return result;
  }) as T;
}

/**
 * Create a cached async function with stale-while-revalidate pattern
 * Returns cached value immediately, then revalidates in background
 */
export function createSWRCache<T>(
  fetcher: () => Promise<T>,
  options: {
    key: string;
    ttl?: number;
    onError?: (error: Error) => void;
  }
): () => Promise<T> {
  const { key, ttl = 3600, onError } = options;
  let revalidating = false;

  return async () => {
    const cached = memoryCache.get(key);

    // If cached and not currently revalidating, revalidate in background
    if (cached !== undefined && !revalidating) {
      revalidating = true;

      fetcher()
        .then((fresh) => {
          memoryCache.set(key, fresh, ttl);
        })
        .catch((error) => {
          console.error(`SWR revalidation failed for ${key}:`, error);
          onError?.(error);
        })
        .finally(() => {
          revalidating = false;
        });

      return cached;
    }

    // If not cached, fetch fresh
    if (cached === undefined) {
      try {
        const fresh = await fetcher();
        memoryCache.set(key, fresh, ttl);
        return fresh;
      } catch (error) {
        console.error(`SWR fetch failed for ${key}:`, error);
        onError?.(error as Error);
        throw error;
      }
    }

    return cached;
  };
}

/**
 * Batch multiple cache operations
 * Useful for invalidating multiple related caches
 */
export class CacheBatch {
  private operations: Array<() => void> = [];

  delete(key: string): this {
    this.operations.push(() => memoryCache.delete(key));
    return this;
  }

  set<T>(key: string, value: T, ttl?: number): this {
    this.operations.push(() => memoryCache.set(key, value, ttl));
    return this;
  }

  clear(): this {
    this.operations.push(() => memoryCache.clear());
    return this;
  }

  execute(): void {
    this.operations.forEach((op) => op());
    this.operations = [];
  }
}

/**
 * Cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    size: memoryCache.size,
    // Add more stats as needed
  };
}

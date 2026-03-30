import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Singleton Supabase browser client.
 * Safe to call multiple times — always returns the same instance.
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

/**
 * Convert snake_case DB row keys to camelCase for the frontend.
 * Handles nested objects and arrays recursively.
 */
export function transformToCamel<T>(obj: Record<string, unknown>): T {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      item && typeof item === 'object' ? transformToCamel(item as Record<string, unknown>) : item,
    ) as unknown as T;
  }
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      value && typeof value === 'object' && !Array.isArray(value)
        ? transformToCamel(value as Record<string, unknown>)
        : value,
    ]),
  ) as T;
}

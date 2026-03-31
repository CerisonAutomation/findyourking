import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser-side Supabase client.
 * createBrowserClient is memoised internally — safe to call in every render.
 * Uses the 2026 canonical publishable key (sb_publishable_*).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * Transforms a snake_case Supabase row into a camelCase object.
 * @example transformToCamel<Profile>({ user_id: '1', display_name: 'King' })
 */
export function transformToCamel<T extends Record<string, unknown>>(
  obj: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] =
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? transformToCamel(value as Record<string, unknown>)
        : value;
  }
  return result as T;
}

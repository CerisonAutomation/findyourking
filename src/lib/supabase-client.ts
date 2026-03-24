'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _instance: SupabaseClient | null = null;

/** Singleton browser Supabase client — safe to call multiple times */
export function createClient(): SupabaseClient {
  if (_instance) return _instance;
  _instance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _instance;
}

/** Convert snake_case keys to camelCase (for Supabase read results → Drizzle types) */
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function transformToCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map((item) => transformToCamel(item)) as unknown as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        transformToCamel(v),
      ])
    ) as T;
  }
  return obj as T;
}

/** Convert camelCase keys to snake_case (for Supabase write payloads) */
function toSnake(s: string): string {
  return s.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}

export function transformToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toSnake(k), v])
  );
}

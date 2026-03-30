import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

/**
 * Singleton Supabase browser client.
 * Use only inside Client Components (`'use client'`).
 *
 * @example
 * const supabase = createClient();
 * const { data } = await supabase.from('profiles').select('*');
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

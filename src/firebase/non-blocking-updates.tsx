/**
 * @migration Firestore non-blocking writes → Supabase non-blocking writes
 *
 * This file previously contained fire-and-forget Firestore write helpers.
 * The project has migrated fully to Supabase. Use the pattern below.
 *
 * All Supabase writes return Promises. For non-blocking fire-and-forget:
 *
 * @example
 * // Non-blocking upsert — errors surfaced via toast, never thrown
 * createClient()
 *   .from('table')
 *   .upsert(data, { onConflict: 'id' })
 *   .then(({ error }) => {
 *     if (error) toast.error('Update failed', { description: error.message });
 *   });
 *
 * Client: `createClient()` from `@/lib/supabase/client` (browser)
 *         `createClient()` from `@/lib/supabase/server` (server actions / RSC)
 */

export {};

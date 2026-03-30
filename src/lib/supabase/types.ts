/**
 * Auto-generate with:
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 *
 * For now we export a passthrough Database type so the codebase compiles.
 */
export type Database = Record<string, unknown>;

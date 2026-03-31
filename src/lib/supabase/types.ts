/**
 * Database type definitions.
 *
 * Auto-generate the full typed schema with:
 *   npx supabase gen types typescript --project-id <project-id> \
 *     --schema public > src/lib/supabase/types.ts
 *
 * Until generated, this passthrough compiles the codebase without errors.
 */
export type Database = Record<string, unknown>;

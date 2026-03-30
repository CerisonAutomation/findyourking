/**
 * @migration Firebase Auth → Supabase Auth
 *
 * This file previously contained non-blocking Firebase Auth helpers.
 * The project has migrated fully to Supabase. Use the hooks and helpers below.
 *
 * Auth state: `useUser()` from `@/hooks/use-user`
 * Sign in:    `supabase.auth.signInWithOtp({ email })` (magic link)
 * Sign in:    `supabase.auth.signInWithPassword({ email, password })`
 * Sign up:    `supabase.auth.signUp({ email, password })`
 * Sign out:   `const { signOut } = useUser()`
 *
 * Client:     `createClient()` from `@/lib/supabase/client`
 */

export {};

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Root page — immediately redirects:
 * - Authenticated users → /discover
 * - Unauthenticated users → /login
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? '/discover' : '/login');
}

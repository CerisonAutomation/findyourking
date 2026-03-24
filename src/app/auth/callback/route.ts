import { createClient } from '@/lib/supabase-server';
import { NextResponse, type NextRequest } from 'next/server';

/** Prevent open-redirect: only allow relative paths */
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/discover';
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeNext(searchParams.get('next'));

  if (!code) {
    console.error('[auth/callback] Missing code parameter');
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

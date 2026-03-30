import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Supabase OAuth / Magic Link callback handler.
 * Exchanges the `code` param for a session, then redirects appropriately.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const next  = searchParams.get('next') ?? '/discover';
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeErr) {
      // Check if the user needs onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', user.id)
          .single();
        if (!profile?.onboarded) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const base = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin);
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

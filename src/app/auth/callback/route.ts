import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth + Magic Link PKCE callback handler.
 * Exchanges `code` for a session, checks onboarding status, redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const next  = searchParams.get('next') ?? '/discover';
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeErr) {
      // Use getClaims (server-verified JWT) not getUser()
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', userId)
          .single();

        if (!profile?.onboarded) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const base = isLocalEnv
        ? origin
        : forwardedHost
          ? `https://${forwardedHost}`
          : origin;

      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`);
}

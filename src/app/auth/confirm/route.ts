import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/** Prevent open-redirect: only allow relative paths */
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/discover';
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get('next'));

  if (!token_hash || !type) {
    console.error('[auth/confirm] Missing token_hash or type');
    const errorUrl = request.nextUrl.clone();
    errorUrl.pathname = '/login';
    errorUrl.searchParams.set('error', 'missing_params');
    return NextResponse.redirect(errorUrl);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error('[auth/confirm] verifyOtp error:', error.message);
    const errorUrl = request.nextUrl.clone();
    errorUrl.pathname = '/login';
    errorUrl.searchParams.set('error', 'otp_failed');
    return NextResponse.redirect(errorUrl);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

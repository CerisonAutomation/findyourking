import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { createClient } from '@/lib/supabase/server';

/** Routes that bypass auth entirely */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/auth/callback',
  '/auth/confirm',
  '/auth/error',
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

export async function proxy(request: NextRequest) {
  // 1. Always refresh session cookie first
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 2. Verify JWT server-side via getClaims (never getSession)
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const loggedIn = !!claimsData?.claims?.sub;

  // 3. Route decisions
  if (isPublicRoute(pathname)) {
    if (loggedIn && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/discover', request.url));
    }
    return response;
  }

  if (!loggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/discover', request.url));
  }

  // 4. Security headers on every authenticated response
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)',
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

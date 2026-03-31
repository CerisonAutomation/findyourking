/**
 * Next.js Edge Middleware — canonical 2026 Supabase SSR pattern.
 *
 * Uses getClaims() (JWT validated against project public keys)
 * instead of getUser() (extra network round-trip) or getSession() (unsafe).
 */
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
  '/auth/error',
  '/auth/forgot-password',
]);

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.has(pathname) ||
  pathname.startsWith('/auth/') ||
  pathname.startsWith('/api/genkit') ||
  pathname === '/robots.txt' ||
  pathname === '/sitemap.xml' ||
  /\.([a-z0-9]+)$/i.test(pathname);

export async function middleware(request: NextRequest) {
  // 1. Always refresh session cookie first (prevents token expiry mid-visit)
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 2. Validate JWT server-side via getClaims — no extra network call
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const loggedIn = !!claimsData?.claims?.sub;

  // 3. Authed user hitting public auth pages → send to app
  if (loggedIn && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/discover', request.url));
  }

  // 4. Protected route + no session → redirect to login
  if (!loggedIn && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Security headers on all authenticated responses
  if (loggedIn) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self)',
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|ico)$).*)',
  ],
};

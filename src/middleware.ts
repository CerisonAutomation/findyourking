import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** Routes that never require authentication */
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
  '/auth/forgot-password',
]);

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.has(pathname) ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api/genkit') ||
  pathname === '/robots.txt' ||
  pathname === '/sitemap.xml' ||
  /\.[a-z0-9]+$/i.test(pathname); // static files

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build a mutable response so the SSR client can set cookies
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: Always use getUser() — never getSession() in middleware
  const { data: { user } } = await supabase.auth.getUser();

  // Auth'd user hitting login/signup → redirect to app
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/discover', request.url));
  }

  // Protected route + no session → redirect to login
  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|ico)$).*)',
  ],
};

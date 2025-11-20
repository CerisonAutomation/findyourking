/**
 * Locale Detection Middleware
 * Per Next.js i18n docs: https://nextjs.org/docs/app/building-your-application/routing/internationalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from '@/i18n';

/**
 * Parse Accept-Language header for locale preference
 */
function parseAcceptLanguage(header: string): Locale[] {
  if (!header) return [defaultLocale];
  
  const languages = header
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { code: code.split('-')[0] as Locale, quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(({ code }) => code);
  
  return languages.filter(lang => locales.includes(lang));
}

/**
 * Detect locale from request
 */
export function detectLocale(request: NextRequest): Locale {
  // 1. Check URL pathname
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameLocale) return pathnameLocale;
  
  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferredLocales = parseAcceptLanguage(acceptLanguage);
  
  if (preferredLocales.length > 0) return preferredLocales[0];
  
  // 3. Default fallback
  return defaultLocale;
}

/**
 * Redirect to locale-prefixed path
 */
export function redirectToLocale(request: NextRequest, locale: Locale): NextResponse {
  const pathname = request.nextUrl.pathname;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

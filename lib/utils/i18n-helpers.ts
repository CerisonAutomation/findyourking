/**
 * Advanced i18n Helper Functions
 * Inspired by web-translate best practices
 */

import { locales, type Locale } from '@/i18n';

/**
 * Get browser's preferred language
 */
export function getBrowserLanguage(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0];
  return (locales.find(l => l === browserLang) as Locale) || 'en';
}

/**
 * Get current language from localStorage or browser
 */
export function getCurrentLanguage(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  const stored = localStorage.getItem('language');
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  
  return getBrowserLanguage();
}

/**
 * Set current language in localStorage
 */
export function setCurrentLanguage(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('language', locale);
}

/**
 * Format message with placeholders
 * Example: formatMessage("Hello ${name}", {name: "John"}) => "Hello John"
 */
export function formatMessage(
  message: string,
  values?: Record<string, string | number>
): string {
  if (!values) return message;
  
  return message.replace(/\$\{(\w+)\}/g, (_, key) => {
    return String(values[key] ?? `\${${key}}`);
  });
}

/**
 * Get translation with fallback
 */
export function getTranslation(
  translations: Record<string, string>,
  key: string,
  fallback?: string
): string {
  return translations[key] || fallback || key;
}

/**
 * Detect if language is RTL (Right-to-Left)
 */
export function isRTL(locale: Locale): boolean {
  const rtlLanguages: Locale[] = ['ar'];
  return rtlLanguages.includes(locale);
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Parse Accept-Language header
 * Returns array of locales sorted by preference (q-value)
 */
export function parseAcceptLanguage(header: string): Locale[] {
  if (!header) return ['en'];
  
  const languages = header
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { code: code.split('-')[0], quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(({ code }) => code);
  
  return languages.filter(lang => 
    locales.includes(lang as Locale)
  ) as Locale[];
}

/**
 * Get best matching locale from Accept-Language header
 */
export function negotiateLocale(acceptLanguage: string): Locale {
  const preferred = parseAcceptLanguage(acceptLanguage);
  return preferred[0] || 'en';
}

/**
 * Load translation file dynamically
 * Per Next.js dynamic imports: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */
export async function loadTranslations(locale: Locale): Promise<Record<string, unknown>> {
  try {
    const translations = await import(`@/messages/${locale}.json`);
    return translations.default as Record<string, unknown>;
  } catch {
    // Fallback to English if translation file not found
    const fallback = await import('@/messages/en.json');
    return fallback.default as Record<string, unknown>;
  }
}

/**
 * Merge translations with overrides
 */
export function mergeTranslations(
  base: Record<string, string>,
  overrides: Record<string, string>
): Record<string, string> {
  return { ...base, ...overrides };
}

/**
 * Extract locale from pathname
 * Example: /es/profile => 'es'
 */
export function extractLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  
  return null;
}

/**
 * Remove locale from pathname
 * Example: /es/profile => /profile
 */
export function removeLocaleFromPath(pathname: string): string {
  const locale = extractLocaleFromPath(pathname);
  if (!locale) return pathname;
  
  return pathname.replace(`/${locale}`, '') || '/';
}

/**
 * Add locale to pathname
 * Example: /profile + 'es' => /es/profile
 */
export function addLocaleToPath(pathname: string, locale: Locale): string {
  const cleanPath = removeLocaleFromPath(pathname);
  return `/${locale}${cleanPath}`;
}

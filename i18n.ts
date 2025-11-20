/**
 * Next-Intl Configuration
 * Internationalization for Next.js 15
 * Docs: https://next-intl-docs.vercel.app/
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt', 'ru', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية',
  pt: 'Português',
  ru: 'Русский',
  ko: '한국어',
};

export default getRequestConfig(async ({ locale }): Promise<{ locale: string; messages: any; timeZone: string; now: Date; formats: any }> => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) notFound();

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'UTC',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      }
    }
  };
});

/**
 * Formatting utilities for internationalization
 */

import { Locale } from '@/i18n';

/**
 * Format number with locale
 */
export function formatNumber(value: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format currency
 */
export function formatCurrency(
  value: number,
  locale: Locale = 'en',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format date
 */
export function formatDate(
  date: Date | string,
  locale: Locale = 'en',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Format list (e.g., "A, B, and C")
 */
export function formatList(
  items: string[],
  locale: Locale = 'en',
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, { type }).format(items);
}

/**
 * Pluralize text based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  locale: Locale = 'en'
): string {
  const rules = new Intl.PluralRules(locale);
  const rule = rules.select(count);
  
  return rule === 'one' ? singular : plural;
}

/**
 * TranslatedText Component with Placeholder Support
 * Usage: <TranslatedText id="greet" values={{name: "John", day: "Monday"}} />
 */

'use client';

import { useTranslations } from 'next-intl';
import { formatMessage } from '@/lib/utils/i18n-helpers';

interface TranslatedTextProps {
  id: string;
  values?: Record<string, string | number>;
  defaultMessage?: string;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function TranslatedText({
  id,
  values,
  defaultMessage,
  className,
  as: Component = 'span',
}: TranslatedTextProps) {
  const t = useTranslations();
  
  let message = t(id);
  
  // Fallback to default message if translation not found
  if (message === id && defaultMessage) {
    message = defaultMessage;
  }
  
  // Format message with placeholders
  const formattedMessage = formatMessage(message, values);
  
  return <Component className={className}>{formattedMessage}</Component>;
}

/**
 * Hook for translated text with placeholders
 */
export function useTranslatedText(
  id: string,
  values?: Record<string, string | number>
): string {
  const t = useTranslations();
  const message = t(id);
  return formatMessage(message, values);
}

/**
 * Chat Translation Service
 * Real-time message translation for chat applications
 */

import { Locale } from '@/i18n';

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: Locale;
  targetLanguage: Locale;
  confidence?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  language?: Locale;
  translations?: Record<Locale, string>;
  originalLanguage?: Locale;
  timestamp: Date;
  userId: string;
}

/**
 * Detect language of text
 * Uses browser's native language detection or falls back to simple heuristics
 * Per Web APIs: https://developer.mozilla.org/en-US/docs/Web/API
 */
export async function detectLanguage(text: string): Promise<Locale> {
  // Simple heuristic detection using Unicode ranges
  const patterns: Record<string, RegExp> = {
    ar: /[\u0600-\u06FF]/,
    zh: /[\u4E00-\u9FFF]/,
    ja: /[\u3040-\u309F\u30A0-\u30FF]/,
    ko: /[\uAC00-\uD7AF]/,
    ru: /[\u0400-\u04FF]/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang as Locale;
    }
  }

  return 'en'; // Default to English
}

/**
 * Translate message using Web API or fallback service
 * Per Chrome Translation API: https://developer.chrome.com/blog/translation-api
 */
export async function translateMessage(
  text: string,
  targetLang: Locale,
  sourceLang?: Locale
): Promise<TranslationResult> {
  const detectedLang = sourceLang || (await detectLanguage(text));

  // If same language, no translation needed
  if (detectedLang === targetLang) {
    return {
      original: text,
      translated: text,
      sourceLanguage: detectedLang,
      targetLanguage: targetLang,
      confidence: 1.0,
    };
  }

  try {
    // Check if Chrome Translation API is available
    if (typeof window !== 'undefined' && 'ai' in window && 'translator' in (window as Window & { ai?: { translator?: unknown } }).ai!) {
      const translator = await (window as Window & { 
        ai: { 
          translator: { 
            create: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<{ translate: (text: string) => Promise<string> }> 
          } 
        } 
      }).ai.translator.create({
        sourceLanguage: detectedLang,
        targetLanguage: targetLang,
      });

      const translated = await translator.translate(text);

      return {
        original: text,
        translated,
        sourceLanguage: detectedLang,
        targetLanguage: targetLang,
        confidence: 0.9,
      };
    }
  } catch (error) {
    console.warn('Browser translation failed:', error);
  }

  // Fallback to server-side translation
  return translateViaServer(text, detectedLang, targetLang);
}

/**
 * Server-side translation via API
 */
async function translateViaServer(
  text: string,
  sourceLang: Locale,
  targetLang: Locale
): Promise<TranslationResult> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      sourceLang,
      targetLang,
    }),
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();

  return {
    original: text,
    translated: data.translated,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    confidence: data.confidence || 0.8,
  };
}

/**
 * Batch translate multiple messages
 */
export async function translateMessages(
  messages: ChatMessage[],
  targetLang: Locale
): Promise<Map<string, TranslationResult>> {
  const translations = new Map<string, TranslationResult>();

  // Batch translate for efficiency
  const textsToTranslate = messages
    .filter(msg => msg.language !== targetLang)
    .map(msg => ({
      id: msg.id,
      text: msg.content,
      sourceLang: msg.language || 'en',
    }));

  if (textsToTranslate.length === 0) {
    return translations;
  }

  // Translate in parallel
  const results = await Promise.all(
    textsToTranslate.map(async ({ id, text, sourceLang }) => {
      try {
        const result = await translateMessage(text, targetLang, sourceLang);
        return { id, result };
      } catch (error) {
        console.error(`Translation failed for message ${id}:`, error);
        return {
          id,
          result: {
            original: text,
            translated: text,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
          } as TranslationResult,
        };
      }
    })
  );

  results.forEach(({ id, result }) => {
    translations.set(id, result);
  });

  return translations;
}

/**
 * Cache translations in memory
 */
const translationCache = new Map<string, TranslationResult>();

export function getCachedTranslation(
  text: string,
  targetLang: Locale
): TranslationResult | null {
  const key = `${text}:${targetLang}`;
  return translationCache.get(key) || null;
}

export function cacheTranslation(
  text: string,
  targetLang: Locale,
  result: TranslationResult
): void {
  const key = `${text}:${targetLang}`;
  translationCache.set(key, result);

  // Limit cache size
  if (translationCache.size > 1000) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) {
      translationCache.delete(firstKey);
    }
  }
}

/**
 * Get translation with cache
 */
export async function getTranslation(
  text: string,
  targetLang: Locale,
  sourceLang?: Locale
): Promise<TranslationResult> {
  // Check cache first
  const cached = getCachedTranslation(text, targetLang);
  if (cached) {
    return cached;
  }

  // Translate
  const result = await translateMessage(text, targetLang, sourceLang);

  // Cache result
  cacheTranslation(text, targetLang, result);

  return result;
}

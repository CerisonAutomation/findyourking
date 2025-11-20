/**
 * Chat Message Component with Translation
 * Displays messages with inline translation support
 */

'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Locale } from '@/i18n';
import { getTranslation, TranslationResult } from '@/lib/services/chat-translation.service';
import { formatRelativeTime } from '@/lib/utils/format';

interface ChatMessageProps {
  id: string;
  content: string;
  timestamp: Date;
  userId: string;
  username: string;
  avatarUrl?: string;
  language?: Locale;
  isOwnMessage?: boolean;
}

export function ChatMessage({
  id,
  content,
  timestamp,
  userId,
  username,
  avatarUrl,
  language,
  isOwnMessage,
}: ChatMessageProps) {
  const currentLocale = useLocale() as Locale;
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const needsTranslation = language && language !== currentLocale;

  const handleTranslate = async () => {
    if (translation && !showOriginal) {
      setShowOriginal(true);
      return;
    }

    if (!needsTranslation) return;

    setIsTranslating(true);
    try {
      const result = await getTranslation(content, currentLocale, language);
      setTranslation(result);
      setShowOriginal(false);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const displayContent = translation && !showOriginal ? translation.translated : content;

  return (
    <div
      className={`flex gap-3 p-4 ${
        isOwnMessage ? 'flex-row-reverse bg-purple-50' : 'bg-white'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{username}</span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(timestamp, currentLocale)}
          </span>
          {language && language !== currentLocale && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              {language.toUpperCase()}
            </span>
          )}
        </div>

        {/* Message Text */}
        <div className="text-gray-800 break-words">{displayContent}</div>

        {/* Translation Controls */}
        {needsTranslation && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
            >
              {isTranslating ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Translating...
                </>
              ) : translation && !showOriginal ? (
                <>Show Original</>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Translate
                </>
              )}
            </button>

            {translation && !showOriginal && (
              <span className="text-xs text-gray-500">
                Translated from {translation.sourceLanguage.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Chat Input with Language Selector
 */
export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string, language: Locale) => void;
  disabled?: boolean;
}) {
  const currentLocale = useLocale() as Locale;
  const [message, setMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(currentLocale);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSend(message.trim(), selectedLanguage);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white border-t">
      {/* Language Selector */}
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value as Locale)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        disabled={disabled}
      >
        <option value="en">🇺🇸 EN</option>
        <option value="es">🇪🇸 ES</option>
        <option value="fr">🇫🇷 FR</option>
        <option value="de">🇩🇪 DE</option>
        <option value="ja">🇯🇵 JA</option>
        <option value="zh">🇨🇳 ZH</option>
        <option value="ar">🇸🇦 AR</option>
        <option value="pt">🇵🇹 PT</option>
        <option value="ru">🇷🇺 RU</option>
        <option value="ko">🇰🇷 KO</option>
      </select>

      {/* Message Input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {/* Send Button */}
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}

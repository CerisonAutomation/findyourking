/**
 * AI Boyfriend Card Component with Optimized Images
 * Handles boyfriend selection, creation, and navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedAvatar } from './OptimizedAvatar';
import { Heart, Sparkles, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoyfriendCardProps {
  boyfriend: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    emoji: string;
    traitLabels: string[];
    voicePreference: string;
    attachmentStyle: string;
    loveLanguage: string;
  };
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onCreate: () => Promise<void>;
  onChat?: () => void;
}

export function BoyfriendCard({
  boyfriend,
  isSelected,
  isActive,
  onSelect,
  onCreate,
  onChat,
}: BoyfriendCardProps) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreating(true);
    try {
      await onCreate();
    } finally {
      setCreating(false);
    }
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChat) {
      onChat();
    } else {
      router.push('/boyfriend/chat');
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6',
        'cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105',
        isSelected && 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/20',
        isActive && 'ring-2 ring-green-500'
      )}
      onClick={onSelect}
    >
      {/* Active Badge */}
      {isActive && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Active
        </div>
      )}

      {/* Avatar */}
      <div className="text-center mb-4">
        <div className="w-20 h-20 bg-linear-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <span className="text-4xl">{boyfriend.emoji}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {boyfriend.name}
        </h3>
        <p className="text-xs text-pink-600 dark:text-pink-400 font-medium mb-2">
          {boyfriend.tagline}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {boyfriend.description}
        </p>
      </div>

      {/* Traits */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Personality Traits:
        </h4>
        <div className="flex flex-wrap gap-1">
          {boyfriend.traitLabels.slice(0, 3).map((trait, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-xs font-medium"
            >
              {trait}
            </span>
          ))}
          {boyfriend.traitLabels.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
              +{boyfriend.traitLabels.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mb-4 space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">💕 Love Language:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatLoveLanguage(boyfriend.loveLanguage)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">🔗 Attachment:</span>
          <span className="font-medium text-gray-900 dark:text-white capitalize">
            {boyfriend.attachmentStyle.split('-')[0]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">🎵 Voice:</span>
          <span className="font-medium text-gray-900 dark:text-white capitalize">
            {boyfriend.voicePreference}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {isActive ? (
          <button
            onClick={handleChat}
            className="w-full bg-linear-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            Chat Now
          </button>
        ) : isSelected ? (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <Heart className="w-4 h-4" />
            {creating ? 'Creating...' : 'Choose This Hottie 💖'}
          </button>
        ) : (
          <button
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Select to View
          </button>
        )}
      </div>
    </div>
  );
}

function formatLoveLanguage(language: string): string {
  return language
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

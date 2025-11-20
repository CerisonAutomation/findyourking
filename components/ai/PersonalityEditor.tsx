/**
 * Personality Editor - Modular Component
 * Reusable personality customization interface
 */

'use client';

import { useState, useCallback } from 'react';
import { Save, RotateCcw, Loader2 } from 'lucide-react';

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  formality: number;
  verbosity: number;
  humor: number;
  emotiveness: number;
  playfulness: number;
  flirtiness: number;
}

interface PersonalityEditorProps {
  boyfriendId?: string; // Optional since it may not be used
  onSave?: (personality: PersonalityTraits) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const TRAIT_CONFIGS = {
  // Big Five Personality Traits
  openness: {
    label: 'Openness',
    description: 'Curiosity and openness to new experiences',
    min: 0,
    max: 100,
    color: 'from-purple-500 to-pink-500',
  },
  conscientiousness: {
    label: 'Conscientiousness',
    description: 'Organization and dependability',
    min: 0,
    max: 100,
    color: 'from-blue-500 to-cyan-500',
  },
  extraversion: {
    label: 'Extraversion',
    description: 'Sociability and energy level',
    min: 0,
    max: 100,
    color: 'from-green-500 to-emerald-500',
  },
  agreeableness: {
    label: 'Agreeableness',
    description: 'Kindness and cooperativeness',
    min: 0,
    max: 100,
    color: 'from-yellow-500 to-orange-500',
  },
  neuroticism: {
    label: 'Neuroticism',
    description: 'Emotional stability and anxiety',
    min: 0,
    max: 100,
    color: 'from-red-500 to-pink-500',
  },
  // Communication Style Traits
  formality: {
    label: 'Formality',
    description: 'Formal vs casual communication style',
    min: 0,
    max: 100,
    color: 'from-indigo-500 to-purple-500',
  },
  verbosity: {
    label: 'Verbosity',
    description: 'How talkative and detailed responses are',
    min: 0,
    max: 100,
    color: 'from-teal-500 to-green-500',
  },
  humor: {
    label: 'Humor',
    description: 'Sense of humor and playfulness',
    min: 0,
    max: 100,
    color: 'from-orange-500 to-red-500',
  },
  emotiveness: {
    label: 'Emotiveness',
    description: 'Emotional expressiveness',
    min: 0,
    max: 100,
    color: 'from-pink-500 to-rose-500',
  },
  playfulness: {
    label: 'Playfulness',
    description: 'Fun-loving and spontaneous nature',
    min: 0,
    max: 100,
    color: 'from-cyan-500 to-blue-500',
  },
  flirtiness: {
    label: 'Flirtiness',
    description: 'Romantic and flirty behavior',
    min: 0,
    max: 100,
    color: 'from-rose-500 to-pink-500',
  },
} as const;

const getTraitLevel = (value: number): string => {
  if (value < 20) return 'Very Low';
  if (value < 40) return 'Low';
  if (value < 60) return 'Moderate';
  if (value < 80) return 'High';
  return 'Very High';
};

export function PersonalityEditor({
  onSave,
  onCancel,
  isLoading = false,
  className = '',
}: PersonalityEditorProps) {
  const [personality, setPersonality] = useState<PersonalityTraits>({
    openness: 70,
    conscientiousness: 65,
    extraversion: 75,
    agreeableness: 80,
    neuroticism: 30,
    formality: 40,
    verbosity: 60,
    humor: 70,
    emotiveness: 75,
    playfulness: 80,
    flirtiness: 85,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleTraitChange = useCallback((trait: keyof PersonalityTraits, value: number) => {
    setPersonality(prev => ({ ...prev, [trait]: value }));
    setHasChanges(true);
  }, []);

  const handleReset = useCallback(() => {
    setPersonality({
      openness: 70,
      conscientiousness: 65,
      extraversion: 75,
      agreeableness: 80,
      neuroticism: 30,
      formality: 40,
      verbosity: 60,
      humor: 70,
      emotiveness: 75,
      playfulness: 80,
      flirtiness: 85,
    });
    setHasChanges(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave(personality);
    } else {
      // Default save implementation

    }
    setHasChanges(false);
  }, [personality, onSave]);

  return (
    <div className={`bg-slate-900/50 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Personality Editor</h2>
        <p className="text-gray-400">
          Customize your AI boyfriend&apos;s personality traits and communication style
        </p>
      </div>

      <div className="space-y-6">
        {/* Big Five Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Core Personality Traits</h3>
          <div className="grid gap-4">
            {(Object.keys(TRAIT_CONFIGS) as Array<keyof typeof TRAIT_CONFIGS>)
              .slice(0, 5)
              .map((trait) => {
                const config = TRAIT_CONFIGS[trait];
                const value = personality[trait];

                return (
                  <div key={trait} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium">{config.label}</label>
                      <span className="text-sm text-gray-400">
                        {value} - {getTraitLevel(value)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{config.description}</p>
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      value={value}
                      onChange={(e) => handleTraitChange(trait, Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #374151 ${value}%, #374151 100%)`,
                      }}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Communication Style Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Communication Style</h3>
          <div className="grid gap-4">
            {(Object.keys(TRAIT_CONFIGS) as Array<keyof typeof TRAIT_CONFIGS>)
              .slice(5)
              .map((trait) => {
                const config = TRAIT_CONFIGS[trait];
                const value = personality[trait];

                return (
                  <div key={trait} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium">{config.label}</label>
                      <span className="text-sm text-gray-400">
                        {value} - {getTraitLevel(value)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{config.description}</p>
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      value={value}
                      onChange={(e) => handleTraitChange(trait, Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #374151 ${value}%, #374151 100%)`,
                      }}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleReset}
          disabled={!hasChanges || isLoading}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// Preview component for personality traits
interface PersonalityPreviewProps {
  personality: PersonalityTraits;
  className?: string;
}

export function PersonalityPreview({ personality, className = '' }: PersonalityPreviewProps) {
  const getDominantTraits = () => {
    const traits = Object.entries(personality) as [keyof PersonalityTraits, number][];
    return traits
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait, value]) => ({
        trait,
        label: TRAIT_CONFIGS[trait].label,
        value,
        level: getTraitLevel(value),
      }));
  };

  const dominantTraits = getDominantTraits();

  return (
    <div className={`bg-white/5 rounded-lg p-4 ${className}`}>
      <h3 className="text-white font-semibold mb-3">Personality Preview</h3>
      <div className="space-y-2">
        {dominantTraits.map(({ trait, label, value, level }) => (
          <div key={trait} className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">{label}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-700 rounded">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
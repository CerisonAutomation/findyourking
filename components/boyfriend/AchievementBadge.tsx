'use client';

import { useState } from 'react';
import { Trophy, Crown, Heart, Star, Sparkles, Gift, Lock, Zap, Target, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as Separator from '@radix-ui/react-separator';

interface Achievement {
  id: string;
  template_id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  progress_current: number;
  progress_required: number;
  unlocked: boolean;
  unlocked_at?: string;
  category: 'communication' | 'intimacy' | 'time_spent' | 'engagement' | 'special';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  onClick?: () => void;
}

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  trophy: Trophy,
  crown: Crown,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  gift: Gift,
  zap: Zap,
  target: Target,
  award: Award,
};

const TIER_COLORS = {
  bronze: {
    bg: 'from-amber-700 to-orange-800',
    border: 'border-amber-600',
    text: 'text-amber-900 dark:text-amber-200',
    glow: 'shadow-amber-500/50',
    badge: 'outline' as const,
  },
  silver: {
    bg: 'from-gray-400 to-gray-600',
    border: 'border-gray-400',
    text: 'text-gray-900 dark:text-gray-200',
    glow: 'shadow-gray-500/50',
    badge: 'platinum' as const,
  },
  gold: {
    bg: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-400',
    text: 'text-yellow-900 dark:text-yellow-200',
    glow: 'shadow-yellow-500/50',
    badge: 'gold' as const,
  },
  platinum: {
    bg: 'from-blue-300 to-cyan-400',
    border: 'border-cyan-400',
    text: 'text-cyan-900 dark:text-cyan-200',
    glow: 'shadow-cyan-500/50',
    badge: 'diamond' as const,
  },
  diamond: {
    bg: 'from-purple-400 via-pink-400 to-purple-500',
    border: 'border-pink-400',
    text: 'text-purple-900 dark:text-purple-200',
    glow: 'shadow-purple-500/50',
    badge: 'legendary' as const,
  },
};

const CATEGORY_LABELS = {
  communication: 'Communication',
  intimacy: 'Intimacy',
  time_spent: 'Time Together',
  engagement: 'Engagement',
  special: 'Special',
};

export function AchievementBadge({ achievement, onClick }: AchievementBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Star;
  const tierColors = TIER_COLORS[achievement.tier];
  const progress = Math.min((achievement.progress_current / achievement.progress_required) * 100, 100);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative w-24 h-24 rounded-2xl transition-all duration-300
          ${achievement.unlocked 
            ? `bg-linear-to-br ${tierColors.bg} ${tierColors.border} border-2 hover:scale-105 hover:shadow-xl ${tierColors.glow}` 
            : 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 opacity-60 hover:opacity-80'
          }
        `}
      >
        {achievement.unlocked ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
        )}
        
        {/* Progress Ring for Locked Achievements */}
        {!achievement.unlocked && progress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-300 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progress * 2.827} 282.7`}
              className="text-purple-500 dark:text-purple-400 transition-all duration-500"
            />
          </svg>
        )}

        {/* Tier Badge */}
        <div className="absolute -top-2 -right-2">
          <Badge variant={tierColors.badge} className="text-xs px-2 py-0.5 shadow-md">
            {achievement.tier.toUpperCase()}
          </Badge>
        </div>

        {/* Sparkle Effect for Unlocked */}
        {achievement.unlocked && (
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          </div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className={`${achievement.unlocked ? `bg-linear-to-br ${tierColors.bg}` : 'bg-gray-300 dark:bg-gray-700'} rounded-lg p-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                  {achievement.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </p>
              </div>
            </div>

            <Separator.Root className="bg-linear-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent h-px my-3" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {CATEGORY_LABELS[achievement.category]}
                </span>
                <Badge variant={tierColors.badge} className="text-xs">
                  {achievement.tier}
                </Badge>
              </div>

              {achievement.unlocked ? (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <Trophy className="w-3 h-3" />
                  Unlocked {achievement.unlocked_at ? new Date(achievement.unlocked_at).toLocaleDateString() : ''}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {achievement.progress_current}/{achievement.progress_required}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-linear-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}

export function AchievementGrid({ achievements, onAchievementClick }: AchievementGridProps) {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Achievements
        </h3>
        <Badge variant="crown" className="flex items-center gap-1">
          <Crown className="w-3 h-3" />
          {unlockedCount}/{achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onClick={() => onAchievementClick?.(achievement)}
          />
        ))}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No achievements yet. Keep engaging with your boyfriend!</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { Heart, Zap, Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IntimacyMeterProps {
  currentLevel: number;
  maxLevel?: number;
  showDetails?: boolean;
}

const INTIMACY_TIERS = [
  { min: 0, max: 20, label: 'Getting to Know Each Other', color: 'from-gray-400 to-gray-500', icon: Heart, badge: 'outline' as const },
  { min: 21, max: 40, label: 'Building Connection', color: 'from-blue-400 to-blue-500', icon: Heart, badge: 'royal' as const },
  { min: 41, max: 60, label: 'Growing Closer', color: 'from-purple-400 to-purple-500', icon: Zap, badge: 'gold' as const },
  { min: 61, max: 80, label: 'Deep Bond', color: 'from-pink-400 to-pink-500', icon: Crown, badge: 'ruby' as const },
  { min: 81, max: 100, label: 'Soulmate Connection', color: 'from-yellow-400 via-pink-500 to-purple-500', icon: Star, badge: 'legendary' as const },
];

export function IntimacyMeter({ currentLevel, maxLevel = 100, showDetails = true }: IntimacyMeterProps) {
  const percentage = Math.min((currentLevel / maxLevel) * 100, 100);
  const currentTier = INTIMACY_TIERS.find(tier => currentLevel >= tier.min && currentLevel <= tier.max) || INTIMACY_TIERS[0];
  const Icon = currentTier.icon;

  const nextTier = INTIMACY_TIERS.find(tier => currentLevel < tier.min);
  const pointsToNextTier = nextTier ? nextTier.min - currentLevel : 0;

  return (
    <div className="space-y-3">
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`bg-linear-to-br ${currentTier.color} rounded-full p-2 shadow-lg`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {currentTier.label}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Level {currentLevel}
              </div>
            </div>
          </div>
          <Badge variant={currentTier.badge} className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {Math.round(percentage)}%
          </Badge>
        </div>
      )}

      <div className="relative">
        {/* Background Track */}
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          {/* Progress Fill */}
          <div 
            className={`h-full bg-linear-to-r ${currentTier.color} transition-all duration-1000 ease-out relative`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Level Markers */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {INTIMACY_TIERS.slice(0, -1).map((tier) => {
            const markerPosition = (tier.max / maxLevel) * 100;
            const isPassed = currentLevel >= tier.max;
            return (
              <div
                key={tier.label}
                className="absolute w-1 h-6 -translate-x-1/2"
                style={{ left: `${markerPosition}%` }}
              >
                <div className={`w-full h-full rounded-full ${isPassed ? 'bg-white shadow-lg' : 'bg-gray-400 dark:bg-gray-600'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {showDetails && nextTier && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            Next: <span className="font-medium text-gray-900 dark:text-white">{nextTier.label}</span>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {pointsToNextTier} points needed
          </span>
        </div>
      )}
    </div>
  );
}

interface RelationshipStatsProps {
  totalMessages: number;
  daysActive: number;
  giftsReceived: number;
  milestonesUnlocked: number;
}

export function RelationshipStats({ totalMessages, daysActive, giftsReceived, milestonesUnlocked }: RelationshipStatsProps) {
  const stats = [
    { label: 'Messages', value: totalMessages.toLocaleString(), gradient: 'from-blue-500 to-cyan-500', badge: 'royal' as const },
    { label: 'Days Together', value: daysActive.toLocaleString(), gradient: 'from-purple-500 to-pink-500', badge: 'ruby' as const },
    { label: 'Gifts Received', value: giftsReceived.toLocaleString(), gradient: 'from-yellow-500 to-amber-500', badge: 'gold' as const },
    { label: 'Milestones', value: milestonesUnlocked.toLocaleString(), gradient: 'from-emerald-500 to-teal-500', badge: 'emerald' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-linear-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`text-2xl font-bold bg-linear-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
            {stat.value}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
            <Badge variant={stat.badge} className="text-xs px-2 py-0.5">
              ●
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

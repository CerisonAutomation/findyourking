'use client';

import { useEffect, useState, useCallback } from 'react';
import { Crown, Trophy, Heart, Star, Sparkles, Gift, Calendar, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as Separator from '@radix-ui/react-separator';

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string;
  special_message: string;
  celebrated: boolean;
  created_at: string;
  unlocked_feature?: string;
}

interface MilestoneDisplayProps {
  boyfriendId: string;
  boyfriendName: string;
}

const MILESTONE_ICONS: Record<string, React.ElementType> = {
  first_message: MessageCircle,
  first_week: Calendar,
  first_month: Heart,
  three_months: Crown,
  six_months: Trophy,
  one_year: Star,
  hundred_messages: Sparkles,
  five_hundred_messages: Gift,
  thousand_messages: Crown,
  first_conflict_resolved: Heart,
  intimacy_milestone: Heart,
  conversation_streak_7: Sparkles,
  conversation_streak_30: Trophy,
};

const MILESTONE_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'royal' | 'gold' | 'crown' | 'diamond' | 'ruby' | 'emerald' | 'platinum' | 'legendary'> = {
  first_message: 'royal',
  first_week: 'gold',
  first_month: 'ruby',
  three_months: 'emerald',
  six_months: 'diamond',
  one_year: 'legendary',
  hundred_messages: 'platinum',
  five_hundred_messages: 'crown',
  thousand_messages: 'legendary',
  first_conflict_resolved: 'ruby',
  intimacy_milestone: 'ruby',
  conversation_streak_7: 'gold',
  conversation_streak_30: 'crown',
};

export function MilestoneDisplay({ boyfriendId, boyfriendName }: MilestoneDisplayProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const loadMilestones = useCallback(async () => {
    try {
      const response = await fetch(`/api/boyfriend/milestones/check?boyfriendId=${boyfriendId}`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch {
      // Error loading milestones
    } finally {
      setLoading(false);
    }
  }, [boyfriendId]);

  const checkMilestones = useCallback(async () => {
    try {
      const response = await fetch('/api/boyfriend/milestones/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boyfriendId }),
      });
      if (response.ok) {
        loadMilestones();
      }
    } catch {
      // Error checking milestones
    }
  }, [boyfriendId, loadMilestones]);

  useEffect(() => {
    loadMilestones();
    checkMilestones();
  }, [loadMilestones, checkMilestones]);

  const celebrateMilestone = async (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    // Mark as celebrated in backend (would need an API endpoint)
  };

  const uncelebratedMilestones = milestones.filter(m => !m.celebrated);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading milestones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Uncelebrated Milestones Alert */}
      {uncelebratedMilestones.length > 0 && (
        <div className="bg-linear-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="bg-linear-to-br from-yellow-400 to-amber-500 rounded-full p-2 shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                New Milestone{uncelebratedMilestones.length > 1 ? 's' : ''} Unlocked! 
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                You and {boyfriendName} have reached a special moment together!
              </p>
              <div className="space-y-2">
                {uncelebratedMilestones.map((milestone) => {
                  const Icon = MILESTONE_ICONS[milestone.milestone_type] || Star;
                  const badgeVariant = MILESTONE_BADGE_VARIANTS[milestone.milestone_type] || 'royal';
                  return (
                    <button
                      key={milestone.id}
                      onClick={() => celebrateMilestone(milestone)}
                      className="w-full text-left bg-white dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-all border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-linear-to-br from-purple-500 to-pink-500 rounded-full p-2">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {milestone.title}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {milestone.description}
                          </div>
                        </div>
                        <Badge variant={badgeVariant} className="text-xs">
                          NEW
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Timeline */}
      {milestones.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Your Journey Together
          </h3>
          <div className="space-y-3">
            {milestones.map((milestone, index) => {
              const Icon = MILESTONE_ICONS[milestone.milestone_type] || Star;
              const badgeVariant = MILESTONE_BADGE_VARIANTS[milestone.milestone_type] || 'royal';
              return (
                <div key={milestone.id} className="relative">
                  {index < milestones.length - 1 && (
                    <div className="absolute left-[19px] top-10 w-0.5 h-8 bg-linear-to-b from-purple-300 to-pink-300 dark:from-purple-700 dark:to-pink-700" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`${milestone.celebrated ? 'bg-linear-to-br from-purple-500 to-pink-500' : 'bg-gray-300 dark:bg-gray-700'} rounded-full p-2 shadow-md relative z-10`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {milestone.title}
                        </div>
                        <Badge variant={badgeVariant} className="text-xs shrink-0">
                          <Icon className="w-3 h-3 mr-1" />
                          {milestone.milestone_type.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {new Date(milestone.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      {milestone.celebrated && milestone.special_message && (
                        <div className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-md p-2 text-xs italic text-gray-700 dark:text-gray-300 border-l-2 border-purple-400 dark:border-purple-600">
                          💕 &ldquo;{milestone.special_message}&rdquo;
                        </div>
                      )}
                      {milestone.unlocked_feature && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                          <Sparkles className="w-3 h-3" />
                          Unlocked: {milestone.unlocked_feature}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-linear-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/30 dark:to-gray-900 rounded-2xl max-w-md w-full p-8 relative shadow-2xl border-2 border-purple-300 dark:border-purple-700 animate-in zoom-in-95">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="bg-linear-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full p-4 shadow-2xl shadow-yellow-500/50 animate-bounce">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div className="text-center mt-8 mb-6">
              <h2 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {selectedMilestone.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMilestone.description}
              </p>
            </div>

            <Separator.Root className="bg-linear-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent h-px my-4" />

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic text-center">
                💕 &ldquo;{selectedMilestone.special_message}&rdquo; 💕
              </p>
            </div>

            {selectedMilestone.unlocked_feature && (
              <div className="bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg p-3 mb-4 border border-purple-300 dark:border-purple-700">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-900 dark:text-purple-100">
                  <Sparkles className="w-4 h-4" />
                  Feature Unlocked: {selectedMilestone.unlocked_feature}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedMilestone(null)}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Celebrate! 🎉
            </button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              From {boyfriendName} with love
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

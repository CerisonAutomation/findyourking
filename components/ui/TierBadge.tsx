import { Badge } from '@/components/ui/badge';
import { Crown, Award, Star, Sparkles } from 'lucide-react';

interface TierBadgeProps {
  tier: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = {
    FREE: {
      label: 'Free',
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      icon: null,
    },
    BRONZE: {
      label: 'Bronze',
      color: 'bg-orange-100 text-orange-700 border-orange-300',
      icon: <Award className="w-3 h-3" />,
    },
    SILVER: {
      label: 'Silver',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: <Star className="w-3 h-3" />,
    },
    GOLD: {
      label: 'Gold',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      icon: <Crown className="w-3 h-3" />,
    },
  };

  const tierConfig = config[tier] || config.FREE;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1';

  return (
    <Badge className={`${tierConfig.color} ${sizeClass} border flex items-center gap-1.5`} variant="outline">
      {tierConfig.icon}
      <span className="font-semibold">{tierConfig.label}</span>
    </Badge>
  );
}

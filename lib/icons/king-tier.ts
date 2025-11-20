/**
 * King Tier Icon System - Premium Elite Icons
 * Lucide-based icons for exclusive King profile features
 * Maximum Horus Level: Senior-grade, legendary-tier icon system
 */

export const KING_TIER_ICONS = {
  // Crown & Status Icons
  crown: 'Crown',
  trophy: 'Trophy',
  star: 'Star',
  zap: 'Zap',
  flame: 'Flame',
  sparkles: 'Sparkles',
  gem: 'Gem',
  shield: 'Shield',
  award: 'Award',
  medal: 'Medal',

  // Verification & Trust Icons
  checkCircle: 'CheckCircle',
  verifiedCheck: 'CheckCircle2',
  thumbsUp: 'ThumbsUp',
  lock: 'Lock',
  lockOpen: 'LockOpen',

  // Premium Features
  heart: 'Heart',
  heartHandshake: 'HeartHandshake',
  rotateCcw: 'RotateCcw',
  eye: 'Eye',
  eyeOff: 'EyeOff',
  megaphone: 'Megaphone',
  spotlight: 'Lightbulb',
  lightning: 'Zap',

  // Profile & Chat
  user: 'User',
  users: 'Users',
  userPlus: 'UserPlus',
  messageCircle: 'MessageCircle',
  messagePlus: 'MessageCirclePlus',
  messageSquare: 'MessageSquare',
  send: 'Send',
  reply: 'Reply',
  replyAll: 'ReplyAll',

  // Video & Media
  video: 'Video',
  videoOff: 'VideoOff',
  camera: 'Camera',
  cameraOff: 'CameraOff',
  image: 'Image',
  imageOff: 'ImageOff',
  film: 'Film',
  play: 'Play',
  pause: 'Pause',

  // Location & Map
  map: 'Map',
  mapPin: 'MapPin',
  compass: 'Compass',
  navigation: 'Navigation',
  navigation2: 'Navigation2',
  globe: 'Globe',

  // Interactions
  thumbsDown: 'ThumbsDown',
  activity: 'Activity',
  pulse: 'Pulse',
  trending: 'TrendingUp',
  volume: 'Volume2',
  volumeX: 'VolumeX',

  // Stats & Analytics
  barChart: 'BarChart3',
  pieChart: 'PieChart',
  trendingUp: 'TrendingUp',
  square: 'Square',
  calendar: 'Calendar',
  clock: 'Clock',

  // Actions
  download: 'Download',
  share: 'Share2',
  copy: 'Copy',
  trash: 'Trash2',
  edit: 'Edit',
  settings: 'Settings',
  moreHorizontal: 'MoreHorizontal',
  moreVertical: 'MoreVertical',
} as const;

/**
 * King Badge Icons - Visual representation for badges
 */
export const KING_BADGE_ICONS = {
  verified: 'CheckCircle',
  superstar: 'Star',
  most_liked: 'Heart',
  top_rated: 'Trophy',
  video_verified: 'Video',
  instant_chat: 'MessageCircle',
  spotlight_featured: 'Megaphone',
} as const;

/**
 * King Feature Colors - Premium color palette
 */
export const KING_FEATURE_COLORS = {
  verified: '#10b981', // emerald-500
  superstar: '#f59e0b', // amber-500
  most_liked: '#ef4444', // red-500
  top_rated: '#f59e0b', // amber-500
  video_verified: '#3b82f6', // blue-500
  instant_chat: '#8b5cf6', // violet-500
  spotlight_featured: '#eab308', // yellow-500
  crown: '#fbbf24', // amber-400
  premium: '#ec4899', // pink-500
} as const;

/**
 * King Feature Presets - Icon + color combinations
 */
export const KING_FEATURE_PRESETS = {
  verified_badge: {
    icon: KING_TIER_ICONS.checkCircle,
    color: KING_FEATURE_COLORS.verified,
    size: 20,
  },
  superstar_badge: {
    icon: KING_TIER_ICONS.star,
    color: KING_FEATURE_COLORS.superstar,
    size: 24,
  },
  crown_icon: {
    icon: KING_TIER_ICONS.crown,
    color: KING_FEATURE_COLORS.crown,
    size: 28,
  },
  instant_chat: {
    icon: KING_TIER_ICONS.messageCircle,
    color: KING_FEATURE_COLORS.instant_chat,
    size: 20,
  },
  spotlight: {
    icon: KING_TIER_ICONS.spotlight,
    color: KING_FEATURE_COLORS.spotlight_featured,
    size: 20,
  },
  video_verified: {
    icon: KING_TIER_ICONS.video,
    color: KING_FEATURE_COLORS.video_verified,
    size: 20,
  },
  super_like: {
    icon: KING_TIER_ICONS.heartHandshake,
    color: KING_FEATURE_COLORS.premium,
    size: 24,
  },
  rewind: {
    icon: KING_TIER_ICONS.rotateCcw,
    color: KING_FEATURE_COLORS.premium,
    size: 20,
  },
} as const;

/**
 * King Feature Icons by Category
 */
export const KING_FEATURE_CATEGORIES = {
  verification: {
    verified: KING_TIER_ICONS.checkCircle,
    photoVerified: KING_TIER_ICONS.image,
    videoVerified: KING_TIER_ICONS.video,
  },
  premium_actions: {
    superLike: KING_TIER_ICONS.heartHandshake,
    rewind: KING_TIER_ICONS.rotateCcw,
    spotlight: KING_TIER_ICONS.megaphone,
    unlimitedLikes: KING_TIER_ICONS.heart,
  },
  communication: {
    instantChat: KING_TIER_ICONS.messageCircle,
    priorityInbox: KING_TIER_ICONS.messagePlus,
    videoCall: KING_TIER_ICONS.video,
  },
  discovery: {
    advancedSearch: KING_TIER_ICONS.barChart,
    profileViews: KING_TIER_ICONS.eye,
    likesList: KING_TIER_ICONS.heart,
  },
  status: {
    crown: KING_TIER_ICONS.crown,
    badge: KING_TIER_ICONS.shield,
    elite: KING_TIER_ICONS.trophy,
  },
} as const;

/**
 * Get King icon name by key
 */
export function getKingIcon(
  key: keyof typeof KING_TIER_ICONS
): (typeof KING_TIER_ICONS)[keyof typeof KING_TIER_ICONS] {
  return KING_TIER_ICONS[key];
}

/**
 * Get King badge icon and color
 */
export function getKingBadgeIcon(
  badge: keyof typeof KING_BADGE_ICONS
): { icon: string; color: string } {
  return {
    icon: KING_BADGE_ICONS[badge],
    color: KING_FEATURE_COLORS[badge] || '#6b7280',
  };
}

/**
 * Get all King feature icons for a category
 */
export function getKingFeaturesByCategory(
  category: keyof typeof KING_FEATURE_CATEGORIES
): Record<string, string> {
  return KING_FEATURE_CATEGORIES[category] as Record<string, string>;
}

/**
 * King Icon Size Presets
 */
export const KING_ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

/**
 * Tailwind classes for King feature styling
 */
export const KING_TAILWIND_CLASSES = {
  badge: 'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold',
  badgeVerified: 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50',
  badgeSuperstar: 'bg-amber-500/20 text-amber-500 border border-amber-500/50',
  badgePremium: 'bg-pink-500/20 text-pink-500 border border-pink-500/50',
  crownIcon: 'text-amber-400 drop-shadow-lg',
  featureHighlight: 'text-pink-500 font-semibold',
} as const;

/**
 * King Premium Features List
 */
export const KING_PREMIUM_FEATURES = [
  {
    id: 'verified_badge',
    name: 'Verified Badge',
    description: 'Show trusted verified status',
    icon: KING_TIER_ICONS.checkCircle,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'unlimited_likes',
    name: 'Unlimited Likes',
    description: 'Like as many profiles as you want',
    icon: KING_TIER_ICONS.heart,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'super_like',
    name: 'Super Likes',
    description: '10 Super Likes per month',
    icon: KING_TIER_ICONS.heartHandshake,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'rewind',
    name: 'Rewind',
    description: 'Take back your last action',
    icon: KING_TIER_ICONS.rotateCcw,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    description: 'Get featured in discovery (5 per month)',
    icon: KING_TIER_ICONS.megaphone,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'advanced_search',
    name: 'Advanced Search',
    description: 'Filter by detailed preferences',
    icon: KING_TIER_ICONS.barChart,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'profile_views',
    name: 'Who Viewed Your Profile',
    description: 'See exactly who viewed you',
    icon: KING_TIER_ICONS.eye,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'likes_list',
    name: 'See All Likes',
    description: 'View all users who liked you',
    icon: KING_TIER_ICONS.heart,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'instant_chat',
    name: 'Instant Chat Priority',
    description: 'Messages appear at top of inbox',
    icon: KING_TIER_ICONS.messageCircle,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'video_verification',
    name: 'Video Verification',
    description: 'Get video verified badge',
    icon: KING_TIER_ICONS.video,
    tier: ['king', 'king_plus'],
  },
  {
    id: 'showcase_video',
    name: 'Profile Showcase Video',
    description: 'Add a 30-second intro video',
    icon: KING_TIER_ICONS.film,
    tier: ['king_plus'],
  },
  {
    id: 'priority_support',
    name: '24/7 Priority Support',
    description: 'Get help within 1 hour',
    icon: KING_TIER_ICONS.shield,
    tier: ['king_plus'],
  },
] as const;

export type KingPremiumFeature = (typeof KING_PREMIUM_FEATURES)[number];

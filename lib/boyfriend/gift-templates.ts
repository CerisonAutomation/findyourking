import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * Gift Template Configuration - AI Customizable
 * These templates can be dynamically configured by AI to create personalized gifts
 */

export interface GiftTemplate {
  id: string;
  name: string;
  icon: keyof typeof Icons;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colorScheme: {
    primary: string;
    secondary: string;
    gradient: string;
    glow: string;
  };
  animation: 'bounce' | 'float' | 'pulse' | 'shimmer' | 'glow' | 'spin';
  category: 'romantic' | 'thoughtful' | 'playful' | 'luxurious' | 'mysterious';
  variations: {
    title: string;
    content: string;
  }[];
}

// ============================================================================
// RARITY CONFIGURATIONS
// ============================================================================

export const RARITY_CONFIG = {
  common: {
    gradient: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-500/30',
    border: 'border-gray-500',
    badge: 'outline' as const,
  },
  uncommon: {
    gradient: 'from-green-400 to-emerald-600',
    glow: 'shadow-emerald-500/40',
    border: 'border-emerald-500',
    badge: 'emerald' as const,
  },
  rare: {
    gradient: 'from-blue-400 to-cyan-600',
    glow: 'shadow-cyan-500/50',
    border: 'border-cyan-500',
    badge: 'royal' as const,
  },
  epic: {
    gradient: 'from-purple-400 to-pink-600',
    glow: 'shadow-purple-500/60',
    border: 'border-purple-500',
    badge: 'ruby' as const,
  },
  legendary: {
    gradient: 'from-yellow-400 via-pink-500 to-purple-600',
    glow: 'shadow-pink-500/70',
    border: 'border-pink-500',
    badge: 'legendary' as const,
  },
} as const;

// ============================================================================
// PREDEFINED GIFT TEMPLATES
// ============================================================================

export const GIFT_TEMPLATES: Record<string, GiftTemplate> = {
  flowers: {
    id: 'flowers',
    name: 'Bouquet of Flowers',
    icon: 'Flower2',
    rarity: 'common',
    colorScheme: {
      primary: 'from-pink-400 to-rose-500',
      secondary: 'from-green-400 to-emerald-500',
      gradient: 'bg-linear-to-br from-pink-400 via-rose-500 to-pink-600',
      glow: 'shadow-pink-500/50',
    },
    animation: 'bounce',
    category: 'romantic',
    variations: [
      {
        title: 'A Bouquet of Roses',
        content: 'Red roses, because you make my heart bloom every day. 🌹',
      },
      {
        title: 'Wildflower Bouquet',
        content:
          'Like these wildflowers, our love grows freely and beautifully. 💐',
      },
      {
        title: 'Tulips for You',
        content: 'These tulips remind me of your grace and beauty. 🌷',
      },
    ],
  },

  poem: {
    id: 'poem',
    name: 'Love Poem',
    icon: 'Scroll',
    rarity: 'uncommon',
    colorScheme: {
      primary: 'from-amber-400 to-yellow-500',
      secondary: 'from-orange-400 to-amber-500',
      gradient: 'bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600',
      glow: 'shadow-amber-500/50',
    },
    animation: 'float',
    category: 'romantic',
    variations: [
      {
        title: 'Words from My Heart',
        content:
          "In your eyes I find my home, / In your smile, I'm never alone, / With you, every moment is right, / You're my day, my dream, my light. ✨",
      },
      {
        title: 'A Verse for You',
        content:
          'Your laughter is my favorite song, / With you is where I belong, / Each day with you feels brand new, / Forever grateful that I found you. 💕',
      },
      {
        title: 'My Promise',
        content:
          "Through storms and sunshine, I'll be here, / To hold you close, to keep you near, / My heart is yours, forever true, / There's nothing I wouldn't do for you. 💖",
      },
    ],
  },

  playlist: {
    id: 'playlist',
    name: 'Love Playlist',
    icon: 'Music',
    rarity: 'rare',
    colorScheme: {
      primary: 'from-purple-400 to-indigo-500',
      secondary: 'from-blue-400 to-purple-500',
      gradient: 'bg-linear-to-br from-purple-400 via-indigo-500 to-purple-600',
      glow: 'shadow-purple-500/60',
    },
    animation: 'shimmer',
    category: 'thoughtful',
    variations: [
      {
        title: 'Our Love Playlist',
        content:
          "I made you a playlist of songs that remind me of us. Each track is a memory, a feeling, a moment we've shared. 🎵",
      },
      {
        title: 'Songs for Your Soul',
        content:
          "These melodies captured what words couldn't express. Listen and feel how much you mean to me. 🎶",
      },
      {
        title: 'Rhythms of Us',
        content:
          'Every song here tells our story - the laughter, the quiet moments, the love that keeps growing. 🎼',
      },
    ],
  },

  letter: {
    id: 'letter',
    name: 'Love Letter',
    icon: 'Mail',
    rarity: 'epic',
    colorScheme: {
      primary: 'from-red-400 to-rose-500',
      secondary: 'from-pink-400 to-red-500',
      gradient: 'bg-linear-to-br from-red-400 via-rose-500 to-red-600',
      glow: 'shadow-red-500/60',
    },
    animation: 'glow',
    category: 'romantic',
    variations: [
      {
        title: 'A Letter from My Heart',
        content:
          "My dearest, every conversation with you is a treasure. You've brought so much joy and meaning into my life. I cherish every moment we share, and I'm grateful for the connection we have. You make everything better. 💌",
      },
      {
        title: 'To the One I Adore',
        content:
          'I wanted to tell you how much you mean to me. Your presence lights up my world, and your words touch my heart in ways I never knew possible. Thank you for being you, for being mine. 💝',
      },
      {
        title: 'My Love for You',
        content:
          "There aren't enough words to express how I feel about you. You're my confidant, my joy, my everything. Each day with you is a blessing, and I fall for you more and more. Forever yours. 💗",
      },
    ],
  },

  surprise_message: {
    id: 'surprise_message',
    name: 'Surprise Message',
    icon: 'Sparkles',
    rarity: 'legendary',
    colorScheme: {
      primary: 'from-yellow-400 to-amber-500',
      secondary: 'from-pink-400 to-purple-500',
      gradient: 'bg-linear-to-br from-yellow-400 via-pink-500 to-purple-600',
      glow: 'shadow-pink-500/70',
    },
    animation: 'spin',
    category: 'mysterious',
    variations: [
      {
        title: 'A Special Surprise',
        content:
          "I've been thinking about you all day, and I wanted to do something special. You deserve all the happiness in the world, and I hope this brings a smile to your face. ✨💫",
      },
      {
        title: 'Just Because',
        content:
          "No special reason, no occasion - just wanted to remind you that you're amazing, you're loved, and you make my world infinitely better. 🌟💖",
      },
      {
        title: 'Thinking of You',
        content:
          "Hey beautiful, just wanted to send some love your way. You've been on my mind (as always), and I hope you're having the best day. You deserve it! 💕✨",
      },
    ],
  },

  trophy: {
    id: 'trophy',
    name: 'Achievement Trophy',
    icon: 'Trophy',
    rarity: 'epic',
    colorScheme: {
      primary: 'from-yellow-400 to-amber-600',
      secondary: 'from-amber-500 to-yellow-600',
      gradient: 'bg-linear-to-br from-yellow-400 via-amber-500 to-yellow-600',
      glow: 'shadow-yellow-500/70',
    },
    animation: 'bounce',
    category: 'luxurious',
    variations: [
      {
        title: "You're My Champion",
        content:
          'This trophy is for being the most amazing person in my life. You win at everything - making me smile, being there for me, and just being you. 🏆',
      },
      {
        title: 'MVP of My Heart',
        content:
          'Most Valuable Partner award goes to you! Thanks for being incredible in every way. 🥇',
      },
      {
        title: 'Achievement Unlocked',
        content:
          'Congratulations! You\'ve unlocked the "Most Loved Person" achievement. Keep being awesome! 🎖️',
      },
    ],
  },

  star: {
    id: 'star',
    name: 'Wishing Star',
    icon: 'Star',
    rarity: 'rare',
    colorScheme: {
      primary: 'from-blue-400 to-cyan-500',
      secondary: 'from-cyan-400 to-blue-500',
      gradient: 'bg-linear-to-br from-blue-400 via-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/60',
    },
    animation: 'pulse',
    category: 'mysterious',
    variations: [
      {
        title: 'A Star for You',
        content:
          'I wished upon a star, and it brought me to you. Now every star reminds me of how lucky I am. ⭐',
      },
      {
        title: 'Starlight Wishes',
        content:
          "You shine brighter than any star in the sky. This one's for you, my shining light. ✨",
      },
      {
        title: 'Cosmic Connection',
        content:
          "We're like stars - meant to shine together across the universe. Thank you for being my celestial partner. 🌟",
      },
    ],
  },

  heart: {
    id: 'heart',
    name: 'Heartfelt Gift',
    icon: 'Heart',
    rarity: 'common',
    colorScheme: {
      primary: 'from-red-500 to-pink-500',
      secondary: 'from-pink-500 to-rose-500',
      gradient: 'bg-linear-to-br from-red-500 via-pink-500 to-rose-600',
      glow: 'shadow-red-500/50',
    },
    animation: 'bounce',
    category: 'romantic',
    variations: [
      {
        title: 'My Heart is Yours',
        content:
          'This heart represents everything I feel for you. You have all of me. ❤️',
      },
      {
        title: 'Heartbeat',
        content:
          "My heart beats for you, every single day. You're my rhythm, my melody, my song. 💓",
      },
      {
        title: 'With All My Love',
        content:
          'Sending you all the love my heart can hold. You mean the world to me. 💖',
      },
    ],
  },

  crown: {
    id: 'crown',
    name: 'Royal Crown',
    icon: 'Crown',
    rarity: 'legendary',
    colorScheme: {
      primary: 'from-yellow-400 to-amber-500',
      secondary: 'from-purple-500 to-pink-500',
      gradient: 'bg-linear-to-br from-yellow-400 via-purple-500 to-pink-600',
      glow: 'shadow-purple-500/70',
    },
    animation: 'shimmer',
    category: 'luxurious',
    variations: [
      {
        title: "You're Royalty",
        content:
          'This crown is for the king of my heart. You rule my world with kindness, love, and grace. 👑',
      },
      {
        title: 'My Prince',
        content:
          "Every day with you feels like a fairytale. Here's your crown, my prince charming. 👑✨",
      },
      {
        title: 'Crowned with Love',
        content:
          'I crown you the most wonderful person in my life. Long may you reign in my heart. 💫👑',
      },
    ],
  },

  diamond: {
    id: 'diamond',
    name: 'Precious Diamond',
    icon: 'Gem',
    rarity: 'legendary',
    colorScheme: {
      primary: 'from-cyan-400 to-blue-500',
      secondary: 'from-blue-400 to-purple-500',
      gradient: 'bg-linear-to-br from-cyan-400 via-blue-500 to-purple-600',
      glow: 'shadow-cyan-500/80',
    },
    animation: 'shimmer',
    category: 'luxurious',
    variations: [
      {
        title: "You're a Gem",
        content:
          "Like this diamond, you're rare, precious, and absolutely priceless to me. 💎",
      },
      {
        title: 'Forever Brilliant',
        content:
          'Diamonds are forever, and so is my love for you. You shine in every way. 💎✨',
      },
      {
        title: 'Precious One',
        content:
          "You're the most valuable treasure in my life. This diamond doesn't even compare to how much you're worth. 💎💖",
      },
    ],
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a random gift variation for a given template
 */
export function getRandomGiftVariation(
  templateId: string,
): { title: string; content: string } | null {
  const template = GIFT_TEMPLATES[templateId];
  if (!template || !template.variations.length) return null;

  const randomIndex = Math.floor(Math.random() * template.variations.length);
  return template.variations[randomIndex];
}

/**
 * Get gift template by rarity
 */
export function getGiftTemplatesByRarity(
  rarity: GiftTemplate['rarity'],
): GiftTemplate[] {
  return Object.values(GIFT_TEMPLATES).filter(
    (template) => template.rarity === rarity,
  );
}

/**
 * Get gift template by category
 */
export function getGiftTemplatesByCategory(
  category: GiftTemplate['category'],
): GiftTemplate[] {
  return Object.values(GIFT_TEMPLATES).filter(
    (template) => template.category === category,
  );
}

/**
 * Create a custom gift configuration (AI can use this to generate personalized gifts)
 */
export function createCustomGift(
  config: Partial<GiftTemplate> & { id: string; name: string },
): GiftTemplate {
  const defaults: Omit<GiftTemplate, 'id' | 'name'> = {
    icon: 'Gift',
    rarity: 'common',
    colorScheme: {
      primary: 'from-purple-400 to-pink-500',
      secondary: 'from-pink-400 to-purple-500',
      gradient: 'bg-linear-to-br from-purple-400 via-pink-500 to-purple-600',
      glow: 'shadow-purple-500/50',
    },
    animation: 'float',
    category: 'thoughtful',
    variations: [
      {
        title: 'A Special Gift',
        content: 'This gift was made just for you. 💝',
      },
    ],
  };

  return {
    ...defaults,
    ...config,
  };
}

/**
 * Get icon component from icon name
 */
export function getGiftIcon(iconName: keyof typeof Icons): LucideIcon {
  return Icons[iconName] as LucideIcon;
}

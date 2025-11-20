/**
 * Find Your King - Design System Tokens
 * Masculine, Futuristic, Royal Theme - Vercel Awards Worthy
 * Centralized design tokens for consistent theming across the application
 */

// ============================================================================
// COLOR PALETTE - Masculine Royal Futuristic
// ============================================================================

export const colors = {
  // Primary - Royal Purple & Deep Indigo (Power, Luxury, Royalty)
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Base royal purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  // Secondary - Gold & Amber (Wealth, Success, Achievement)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Base gold
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Accent - Deep Cyan & Electric Blue (Technology, Innovation)
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Base cyan
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },

  // Neutral - Obsidian Black & Slate Gray (Sophistication, Depth)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b', // Deep slate
    900: '#0f172a', // Near black
    950: '#020617', // Obsidian black
  },

  // Ruby Red (Passion, Love, Romance for boyfriend features)
  ruby: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Emerald Green (Growth, Connection, Harmony)
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // Platinum Silver (Premium, Metallic, Exclusive)
  platinum: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

// ============================================================================
// GRADIENT PRESETS - Futuristic Royal Gradients
// ============================================================================

export const gradients = {
  // Primary gradients
  royal: 'bg-linear-to-br from-purple-600 via-indigo-600 to-purple-800',
  royalText:
    'bg-linear-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent',

  // Luxury gradients
  gold: 'bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600',
  goldText:
    'bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent',

  // Tech gradients
  cyber: 'bg-linear-to-br from-cyan-500 via-blue-600 to-purple-700',
  cyberText:
    'bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent',

  // Combined luxury
  legendary: 'bg-linear-to-br from-pink-500 via-purple-600 to-indigo-700',
  legendaryText:
    'bg-linear-to-r from-pink-500 via-purple-600 to-indigo-700 bg-clip-text text-transparent',

  // Dark sophisticated
  obsidian: 'bg-linear-to-br from-neutral-900 via-neutral-950 to-black',

  // Metallic
  platinum: 'bg-linear-to-br from-gray-300 via-gray-400 to-gray-500',

  // Romance
  ruby: 'bg-linear-to-br from-rose-500 via-red-600 to-pink-700',

  // Premium shine
  chrome: 'bg-linear-to-br from-gray-100 via-white to-gray-200',

  // Glass effect overlays
  glass: 'bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl',
  glassDark: 'bg-linear-to-br from-black/20 to-black/10 backdrop-blur-xl',
} as const;

// ============================================================================
// SHADOWS - Depth & Elevation System
// ============================================================================

export const shadows = {
  // Standard shadows
  sm: 'shadow-sm',
  base: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',

  // Colored glow shadows
  glow: {
    purple: 'shadow-2xl shadow-purple-500/50',
    gold: 'shadow-2xl shadow-amber-500/50',
    cyan: 'shadow-2xl shadow-cyan-500/50',
    ruby: 'shadow-2xl shadow-red-500/50',
    emerald: 'shadow-2xl shadow-emerald-500/50',
  },

  // Inner shadows for depth
  inner: 'shadow-inner',

  // No shadow
  none: 'shadow-none',
} as const;

// ============================================================================
// SPACING SCALE - Consistent Spacing System
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
} as const;

// ============================================================================
// TYPOGRAPHY - Font System
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// ============================================================================
// BORDER RADIUS - Rounded Corners System
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================================================
// ANIMATION PRESETS - Motion System
// ============================================================================

export const animations = {
  // Timing functions
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Duration presets
  duration: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Tailwind animation classes
  spin: 'animate-spin',
  ping: 'animate-ping',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',

  // Custom animations (to be defined in Tailwind config)
  shimmer: 'animate-shimmer',
  float: 'animate-float',
  glow: 'animate-glow',
  slideIn: 'animate-slide-in',
  fadeIn: 'animate-fade-in',
  scaleIn: 'animate-scale-in',
} as const;

// ============================================================================
// BACKDROP BLUR - Glass Morphism
// ============================================================================

export const blur = {
  none: 'backdrop-blur-none',
  sm: 'backdrop-blur-sm',
  base: 'backdrop-blur',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
  '3xl': 'backdrop-blur-3xl',
} as const;

// ============================================================================
// Z-INDEX LAYERS - Stacking Context
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
} as const;

// ============================================================================
// COMPONENT VARIANTS - Reusable Combinations
// ============================================================================

export const variants = {
  card: {
    glass: `${gradients.glass} ${blur.xl} border border-white/20 ${shadows.xl}`,
    solid: `bg-neutral-900 border border-neutral-800 ${shadows.lg}`,
    gradient: `${gradients.royal} ${shadows.glow.purple}`,
  },

  button: {
    primary: `${gradients.royal} text-white font-semibold ${shadows.lg} hover:${shadows.glow.purple}`,
    secondary: `${gradients.gold} text-white font-semibold ${shadows.lg} hover:${shadows.glow.gold}`,
    ghost:
      'bg-transparent text-neutral-300 hover:bg-white/10 border border-neutral-700',
    glass: `${gradients.glass} ${blur.xl} border border-white/20 text-white hover:bg-white/20`,
  },

  input: {
    default: `bg-neutral-900/50 border border-neutral-700 ${blur.md} text-white placeholder:text-neutral-500`,
    glass: `${gradients.glass} ${blur.xl} border border-white/20 text-white placeholder:text-white/50`,
  },
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  colors,
  gradients,
  shadows,
  spacing,
  typography,
  borderRadius,
  animations,
  blur,
  zIndex,
  variants,
} as const;

export default designTokens;

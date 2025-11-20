/**
 * Enterprise Icon System
 * 
 * Unified, high-end icon system replacing cheap emojis with Lucide icons
 * Provides consistent, accessible, and professional iconography throughout the app
 * 
 * Lucide docs: https://lucide.dev
 * Accessibility: WCAG 2.1 AA compliant with proper aria labels
 */

import {
  Heart,
  X,
  Flame,
  Users,
  MessageCircle,
  Bell,
  User,
  LogOut,
  Settings,
  Search,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Calendar,
  MapPin,
  Sparkles,
  Star,
  Trophy,
  BadgeCheckIcon,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Download,
  Upload,
  Camera,
  Image,
  Video,
  Phone,
  Send,
  Smile,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Navigation,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  Grid,
  List,
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  Link2,
  Bookmark,
  Flag,
  Activity,
  Wifi,
  WifiOff,
  Globe,
  Inbox,
  Loader,
  LoaderCircle,
} from 'lucide-react';

// Icon size presets (in px)
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

export interface IconProps {
  size?: IconSize;
  className?: string;
  ariaLabel?: string;
  strokeWidth?: number;
}

// Icon component map
export const ICONS = {
  // Action icons
  heart: Heart,
  dismiss: X,
  flame: Flame,
  users: Users,
  chat: MessageCircle,
  notification: Bell,
  profile: User,
  logout: LogOut,
  settings: Settings,
  search: Search,
  add: Plus,
  confirm: Check,
  next: ArrowRight,
  previous: ArrowLeft,
  lightning: Zap,
  security: Shield,
  show: Eye,
  hide: EyeOff,
  lock: Lock,
  unlock: Unlock,
  calendar: Calendar,
  location: MapPin,
  sparkle: Sparkles,
  star: Star,
  award: Trophy,
  verified: BadgeCheckIcon,
  menu: MoreVertical,
  edit: Edit,
  delete: Trash2,
  share: Share2,
  download: Download,
  upload: Upload,
  camera: Camera,
  gallery: Image,
  video: Video,
  call: Phone,
  send: Send,
  emoji: Smile,
  alert: AlertCircle,
  success: CheckCircle,
  error: XCircle,
  info: Info,
  clock: Clock,
  navigate: Navigation,
  soundOn: Volume2,
  soundOff: VolumeX,
  expand: Maximize,
  collapse: Minimize,
  nextMedia: SkipForward,
  prevMedia: SkipBack,
  play: Play,
  pause: Pause,
  grid: Grid,
  list: List,
  hamburger: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  indicator: Circle,
  copy: Copy,
  link: Link2,
  bookmark: Bookmark,
  block: Flag,
  report: Flag,
  activity: Activity,
  online: Wifi,
  offline: WifiOff,
  globe: Globe,
  inbox: Inbox,
  loading: Loader,
  loadingSpinner: LoaderCircle,
} as const;

export type IconName = keyof typeof ICONS;

/**
 * Get icon component by name
 * Usage: const HeartIcon = getIcon('heart')
 */
export function getIcon(name: IconName) {
  return ICONS[name];
}

// Preset icon combinations for common UI patterns
export const ICON_COMBINATIONS = {
  // Match actions
  like: { icon: 'heart', color: 'text-red-500' },
  pass: { icon: 'dismiss', color: 'text-gray-500' },
  superlike: { icon: 'sparkle', color: 'text-blue-500' },

  // Authentication
  locked: { icon: 'lock', color: 'text-gray-600' },
  unlocked: { icon: 'unlock', color: 'text-green-600' },

  // Status
  online: { icon: 'online', color: 'text-green-500' },
  offline: { icon: 'offline', color: 'text-gray-500' },
  verified: { icon: 'verified', color: 'text-blue-500' },

  // Messaging
  unread: { icon: 'notification', color: 'text-orange-500' },
  sent: { icon: 'confirm', color: 'text-gray-500' },
  delivered: { icon: 'confirm', color: 'text-blue-500' },

  // Media
  photo: { icon: 'gallery', color: 'text-gray-600' },
  videoMedia: { icon: 'video', color: 'text-purple-600' },
  audio: { icon: 'call', color: 'text-gray-600' },

  // Alerts
  successAlert: { icon: 'success', color: 'text-green-500' },
  warning: { icon: 'alert', color: 'text-yellow-500' },
  errorAlert: { icon: 'error', color: 'text-red-500' },
  infoAlert: { icon: 'info', color: 'text-blue-500' },

  // Actions
  loading: { icon: 'loadingSpinner', color: 'text-gray-500 animate-spin' },
  addAction: { icon: 'add', color: 'text-primary' },
  remove: { icon: 'delete', color: 'text-destructive' },
  editAction: { icon: 'edit', color: 'text-secondary' },
} as const;

/**
 * Common icon sizing presets
 */
export const ICON_PRESETS = {
  nav: { size: 'md' as const, className: 'text-gray-700 dark:text-gray-300' },
  button: { size: 'md' as const, className: 'text-white' },
  card: { size: 'lg' as const, className: 'text-gray-800 dark:text-gray-200' },
  badge: { size: 'sm' as const, className: 'text-current' },
  inline: { size: 'md' as const, className: 'text-current inline' },
  large: { size: 'xl' as const, className: 'text-primary' },
  small: { size: 'sm' as const, className: 'text-gray-600 dark:text-gray-400' },
} as const;

export default ICONS;

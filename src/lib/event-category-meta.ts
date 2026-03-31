/**
 * Single source of truth for every event-category visual: icon, colour, and
 * display label.  Import this wherever you need to render a category pill,
 * icon tile, or filter chip — never hardcode colours or labels inline.
 *
 * Usage:
 *   import { EVENT_CATEGORY_META, CategoryIcon } from '@/lib/event-category-meta';
 *   const meta = EVENT_CATEGORY_META[event.category];
 *   <meta.Icon className={cn('size-5', meta.iconCls)} />
 */

import {
  Dumbbell,
  Film,
  Utensils,
  Coffee,
  Wine,
  Mountain,
  Trophy,
  Gamepad2,
  PartyPopper,
  HandshakeIcon,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EventCategory } from '@/lib/types';

export interface EventCategoryMeta {
  /** Display label shown in UI */
  label: string;
  /** Lucide icon component */
  Icon: LucideIcon;
  /** Tailwind text-color class for the icon */
  iconCls: string;
  /** Tailwind bg-color class for the tile background */
  bgCls: string;
  /** Tailwind border-color class used when tile is selected */
  borderCls: string;
}

export const EVENT_CATEGORY_META: Record<EventCategory, EventCategoryMeta> = {
  gym: {
    label:     'Gym',
    Icon:      Dumbbell,
    iconCls:   'text-orange-500',
    bgCls:     'bg-orange-500/10',
    borderCls: 'border-orange-500',
  },
  cinema: {
    label:     'Cinema',
    Icon:      Film,
    iconCls:   'text-purple-500',
    bgCls:     'bg-purple-500/10',
    borderCls: 'border-purple-500',
  },
  dinner: {
    label:     'Dinner',
    Icon:      Utensils,
    iconCls:   'text-amber-500',
    bgCls:     'bg-amber-500/10',
    borderCls: 'border-amber-500',
  },
  coffee: {
    label:     'Coffee',
    Icon:      Coffee,
    iconCls:   'text-yellow-600',
    bgCls:     'bg-yellow-500/10',
    borderCls: 'border-yellow-500',
  },
  drinks: {
    label:     'Drinks',
    Icon:      Wine,
    iconCls:   'text-rose-500',
    bgCls:     'bg-rose-500/10',
    borderCls: 'border-rose-500',
  },
  hiking: {
    label:     'Hiking',
    Icon:      Mountain,
    iconCls:   'text-green-600',
    bgCls:     'bg-green-500/10',
    borderCls: 'border-green-500',
  },
  sports: {
    label:     'Sports',
    Icon:      Trophy,
    iconCls:   'text-blue-500',
    bgCls:     'bg-blue-500/10',
    borderCls: 'border-blue-500',
  },
  gaming: {
    label:     'Gaming',
    Icon:      Gamepad2,
    iconCls:   'text-indigo-500',
    bgCls:     'bg-indigo-500/10',
    borderCls: 'border-indigo-500',
  },
  party: {
    label:     'Party',
    Icon:      PartyPopper,
    iconCls:   'text-pink-500',
    bgCls:     'bg-pink-500/10',
    borderCls: 'border-pink-500',
  },
  meet: {
    label:     'Meet',
    Icon:      HandshakeIcon,
    iconCls:   'text-teal-500',
    bgCls:     'bg-teal-500/10',
    borderCls: 'border-teal-500',
  },
  other: {
    label:     'Other',
    Icon:      Sparkles,
    iconCls:   'text-slate-400',
    bgCls:     'bg-slate-500/10',
    borderCls: 'border-slate-400',
  },
};

/** Ordered list used to render the type-picker grid (matches screenshot order). */
export const EVENT_CATEGORY_ORDER: EventCategory[] = [
  'gym', 'cinema', 'dinner', 'coffee', 'drinks',
  'hiking', 'sports', 'gaming', 'party', 'meet', 'other',
];

import type {
  profiles,
  users,
  messages,
  meetNowCards,
  favorites,
  bookings,
  subscriptions,
  notifications,
  adminSettings,
  tribes,
  interests
} from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type UserProfile = InferSelectModel<typeof profiles> & {
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  } | null;
};
export type Message = InferSelectModel<typeof messages>;
export type MeetNowCard = InferSelectModel<typeof meetNowCards>;
export type Favorite = InferSelectModel<typeof favorites>;
export type Booking = InferSelectModel<typeof bookings>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Notification = InferSelectModel<typeof notifications>;
export type AdminSetting = InferSelectModel<typeof adminSettings>;
export type Tribe = InferSelectModel<typeof tribes>;
export type Interest = InferSelectModel<typeof interests>;

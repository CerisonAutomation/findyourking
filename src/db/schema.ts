import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  uuid,
  varchar,
  jsonb,
  index,
  pgEnum,
  boolean,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['seeker', 'provider', 'admin']);
export const statusEnum = pgEnum('status', [
  'active', 'inactive', 'banned', 'pending', 'completed', 'cancelled',
]);
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free', 'premium', 'platinum',
]);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'message', 'booking', 'favorite', 'match', 'system', 'event',
]);

/**
 * Chill-inspired event categories — mirrors the icon-grid type picker.
 * DB migration required when adding/removing values.
 */
export const eventCategoryEnum = pgEnum('event_category', [
  'gym',
  'cinema',
  'dinner',
  'coffee',
  'drinks',
  'hiking',
  'sports',
  'gaming',
  'party',
  'meet',
  'other',
]);

export const rsvpStatusEnum = pgEnum('rsvp_status', [
  'going', 'maybe', 'declined',
]);

// ─── Core Tables ─────────────────────────────────────────────────────────────

/** Mirrors auth.users — only the UUID lives here; profile data in `profiles`. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
});

export const profiles = pgTable(
  'profiles',
  {
    userId:             uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
    displayName:        varchar('display_name', { length: 100 }),
    bio:                text('bio'),
    age:                integer('age'),
    location:           text('location'),
    /** WKT geography point — set via SQL: ST_MakePoint(lng, lat)::geography */
    locationPoint:      text('location_point'),
    height:             integer('height'),
    avatarUrl:          text('avatar_url'),
    photos:             jsonb('photos').$type<string[]>().default([]),
    interests:          jsonb('interests').$type<string[]>().default([]),
    tribes:             jsonb('tribes').$type<string[]>().default([]),
    lookingFor:         jsonb('looking_for').$type<string[]>().default([]),
    onboarded:          boolean('onboarded').default(false),
    role:               userRoleEnum('role').default('seeker'),
    subscriptionTier:   subscriptionTierEnum('subscription_tier').default('free'),
    verificationStatus: statusEnum('verification_status').default('pending'),
    isVerified:         boolean('is_verified').default(false),
    hourlyRate:         numeric('hourly_rate', { precision: 10, scale: 2 }),
    availability:       jsonb('availability'),
    stats:              jsonb('stats')
                          .$type<{ views: number; favorites: number; matches: number }>()
                          .default({ views: 0, favorites: 0, matches: 0 }),
    createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    ageIdx:          index('profiles_age_idx').on(t.age),
    roleIdx:         index('profiles_role_idx').on(t.role),
    subscriptionIdx: index('profiles_subscription_idx').on(t.subscriptionTier),
    updatedIdx:      index('profiles_updated_idx').on(t.updatedAt),
  }),
);

// ─── Presence (online status) ─────────────────────────────────────────────────

export const userPresence = pgTable('user_presence', {
  userId:         uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  isOnline:       boolean('is_online').default(false),
  lastSeen:       timestamp('last_seen', { withTimezone: true }).defaultNow(),
  locationPoint:  text('location_point'),
});

// ─── Conversations & Messages ─────────────────────────────────────────────────

export const conversations = pgTable(
  'conversations',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    participantOne: uuid('participant_one').references(() => users.id, { onDelete: 'cascade' }),
    participantTwo: uuid('participant_two').references(() => users.id, { onDelete: 'cascade' }),
    lastMessageAt:  timestamp('last_message_at', { withTimezone: true }).defaultNow(),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    participantsIdx: index('conversations_participants_idx').on(t.participantOne, t.participantTwo),
    lastMessageIdx:  index('conversations_last_message_idx').on(t.lastMessageAt),
  }),
);

export const messages = pgTable(
  'messages',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
                      .references(() => conversations.id, { onDelete: 'cascade' })
                      .notNull(),
    senderId:       uuid('sender_id')
                      .references(() => users.id, { onDelete: 'cascade' })
                      .notNull(),
    content:        text('content').notNull(),
    isRead:         boolean('is_read').default(false),
    readAt:         timestamp('read_at', { withTimezone: true }),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    convIdx:    index('messages_conv_idx').on(t.conversationId),
    senderIdx:  index('messages_sender_idx').on(t.senderId),
    createdIdx: index('messages_created_idx').on(t.createdAt),
    readIdx:    index('messages_read_idx').on(t.isRead),
  }),
);

// ─── Favorites ───────────────────────────────────────────────────────────────

export const favorites = pgTable(
  'favorites',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    userId:          uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    favoritedUserId: uuid('favorited_user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx:       index('favorites_user_idx').on(t.userId),
    favoritedIdx:  index('favorites_favorited_idx').on(t.favoritedUserId),
    uniqueFav:     index('favorites_unique_idx').on(t.userId, t.favoritedUserId).unique(),
  }),
);

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookings = pgTable(
  'bookings',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    seekerId:        uuid('seeker_id').references(() => users.id, { onDelete: 'cascade' }),
    providerId:      uuid('provider_id').references(() => users.id, { onDelete: 'cascade' }),
    date:            timestamp('date', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    location:        text('location'),
    locationPoint:   text('location_point'),
    status:          bookingStatusEnum('status').default('pending'),
    paymentId:       text('payment_id'),
    notes:           text('notes'),
    totalAmount:     numeric('total_amount', { precision: 10, scale: 2 }),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    seekerIdx:   index('bookings_seeker_idx').on(t.seekerId),
    providerIdx: index('bookings_provider_idx').on(t.providerId),
    dateIdx:     index('bookings_date_idx').on(t.date),
    statusIdx:   index('bookings_status_idx').on(t.status),
  }),
);

// ─── Events & RSVPs ──────────────────────────────────────────────────────────

export const events = pgTable(
  'events',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    hostId:        uuid('host_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title:         varchar('title', { length: 200 }).notNull(),
    description:   text('description'),
    /** Chill-style category — matches the type-picker icon grid */
    category:      eventCategoryEnum('category').default('meet').notNull(),
    location:      text('location'),
    locationPoint: text('location_point'),
    address:       text('address'),
    startAt:       timestamp('start_at', { withTimezone: true }).notNull(),
    endAt:         timestamp('end_at', { withTimezone: true }),
    maxAttendees:  integer('max_attendees'),
    isPublic:      boolean('is_public').default(true),
    isCancelled:   boolean('is_cancelled').default(false),
    imageUrl:      text('image_url'),
    tags:          jsonb('tags').$type<string[]>().default([]),
    createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    hostIdx:      index('events_host_idx').on(t.hostId),
    startAtIdx:   index('events_start_at_idx').on(t.startAt),
    categoryIdx:  index('events_category_idx').on(t.category),
    publicIdx:    index('events_public_idx').on(t.isPublic),
    cancelledIdx: index('events_cancelled_idx').on(t.isCancelled),
  }),
);

export const eventRsvps = pgTable(
  'event_rsvps',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    eventId:   uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
    userId:    uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status:    rsvpStatusEnum('status').default('going').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    eventIdx:   index('rsvps_event_idx').on(t.eventId),
    userIdx:    index('rsvps_user_idx').on(t.userId),
    uniqueRsvp: index('rsvps_unique_idx').on(t.eventId, t.userId).unique(),
  }),
);

// ─── Meet Now Cards ───────────────────────────────────────────────────────────

export const meetNowCards = pgTable(
  'meet_now_cards',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    userId:        uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    userName:      varchar('user_name', { length: 255 }).notNull(),
    userAvatar:    text('user_avatar'),
    activity:      varchar('activity', { length: 255 }).notNull(),
    location:      varchar('location', { length: 255 }).notNull(),
    locationPoint: text('location_point'),
    /** When this card auto-expires (default 4 hours from creation) */
    expiresAt:     timestamp('expires_at', { withTimezone: true }).notNull(),
    isActive:      boolean('is_active').default(true),
    createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx:    index('meet_now_user_idx').on(t.userId),
    createdIdx: index('meet_now_created_idx').on(t.createdAt),
    activeIdx:  index('meet_now_active_idx').on(t.isActive),
    expiresIdx: index('meet_now_expires_idx').on(t.expiresAt),
  }),
);

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  'subscriptions',
  {
    id:                   uuid('id').primaryKey().defaultRandom(),
    userId:               uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    tier:                 subscriptionTierEnum('tier').default('free'),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    stripeCustomerId:     text('stripe_customer_id'),
    status:               statusEnum('status').default('active'),
    currentPeriodStart:   timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd:     timestamp('current_period_end', { withTimezone: true }),
    expiresAt:            timestamp('expires_at', { withTimezone: true }),
    createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx:   index('subscriptions_user_idx').on(t.userId),
    stripeIdx: index('subscriptions_stripe_idx').on(t.stripeSubscriptionId),
    statusIdx: index('subscriptions_status_idx').on(t.status),
  }),
);

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    type:      notificationTypeEnum('type').notNull(),
    title:     text('title').notNull(),
    message:   text('message').notNull(),
    isRead:    boolean('is_read').default(false),
    data:      jsonb('data'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx:    index('notifications_user_idx').on(t.userId),
    typeIdx:    index('notifications_type_idx').on(t.type),
    readIdx:    index('notifications_read_idx').on(t.isRead),
    createdIdx: index('notifications_created_idx').on(t.createdAt),
  }),
);

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminSettings = pgTable('admin_settings', {
  key:       text('key').primaryKey(),
  value:     jsonb('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const tribes = pgTable(
  'tribes',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    name:        text('name').unique().notNull(),
    description: text('description'),
    iconUrl:     text('icon_url'),
    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({ nameIdx: index('tribes_name_idx').on(t.name) }),
);

export const interests = pgTable(
  'interests',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    name:      text('name').unique().notNull(),
    category:  text('category'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    nameIdx:     index('interests_name_idx').on(t.name),
    categoryIdx: index('interests_category_idx').on(t.category),
  }),
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile:          one(profiles,      { fields: [users.id], references: [profiles.userId] }),
  presence:         one(userPresence,  { fields: [users.id], references: [userPresence.userId] }),
  favorites:        many(favorites,    { relationName: 'userFavorites' }),
  favoritedBy:      many(favorites,    { relationName: 'favoritedBy' }),
  seekerBookings:   many(bookings,     { relationName: 'seekerBookings' }),
  providerBookings: many(bookings,     { relationName: 'providerBookings' }),
  hostedEvents:     many(events,       { relationName: 'hostedEvents' }),
  eventRsvps:       many(eventRsvps),
  subscriptions:    many(subscriptions),
  notifications:    many(notifications),
  meetNowCards:     many(meetNowCards),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender:       one(users,         { fields: [messages.senderId],       references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user:          one(users, { fields: [favorites.userId],          references: [users.id], relationName: 'userFavorites' }),
  favoritedUser: one(users, { fields: [favorites.favoritedUserId], references: [users.id], relationName: 'favoritedBy' }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  seeker:   one(users, { fields: [bookings.seekerId],   references: [users.id], relationName: 'seekerBookings' }),
  provider: one(users, { fields: [bookings.providerId], references: [users.id], relationName: 'providerBookings' }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host:  one(users,      { fields: [events.hostId], references: [users.id], relationName: 'hostedEvents' }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, { fields: [eventRsvps.eventId], references: [events.id] }),
  user:  one(users,  { fields: [eventRsvps.userId],  references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const meetNowRelations = relations(meetNowCards, ({ one }) => ({
  user:    one(users,    { fields: [meetNowCards.userId], references: [users.id] }),
  profile: one(profiles, { fields: [meetNowCards.userId], references: [profiles.userId] }),
}));

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
  vector,
  boolean,
  serial,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ENUMS
export const userRoleEnum = pgEnum("user_role", ["seeker", "provider", "admin"])
export const statusEnum = pgEnum("status", ["active", "inactive", "banned", "pending", "completed", "cancelled"])
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
  "platinum",
])
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "completed", "cancelled"])
export const notificationTypeEnum = pgEnum("notification_type", ["message", "booking", "favorite", "match", "system"])

// TABLES
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
    id: varchar("id", { length: 255 }).unique().notNull(),
    bio: text("bio"),
    age: integer("age"),
    location: text("location"),
    height: integer("height"),
    avatarUrl: text("avatar_url"),
    interests: jsonb("interests").$type<string[]>().default([]),
    tribes: jsonb("tribes").$type<string[]>().default([]),
    onboarded: boolean("onboarded").default(false),
    role: userRoleEnum("role").default("seeker"),
    subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
    verificationStatus: statusEnum("verification_status").default("pending"),
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
    availability: jsonb("availability"),
    lookingFor: jsonb("looking_for"),
    stats: jsonb("stats").$type<{views: number, favorites: number, matches: number}>().default({views: 0, favorites: 0, matches: 0}),
    embedding: vector('embedding', { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    idIdx: index().on(table.id),
    ageIdx: index().on(table.age),
    roleIdx: index().on(table.role),
    subscriptionIdx: index().on(table.subscriptionTier),
  }),
)

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    favoritedUserId: uuid("favorited_user_id").references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index().on(table.userId),
    favoritedIdx: index().on(table.favoritedUserId),
    uniqueFavorite: index().on(table.userId, table.favoritedUserId).unique(),
  }),
)

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seekerId: uuid("seeker_id").references(() => users.id, { onDelete: 'cascade' }),
    providerId: uuid("provider_id").references(() => users.id, { onDelete: 'cascade' }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    duration: integer("duration").notNull(), // in minutes
    location: text("location"),
    status: bookingStatusEnum("status").default("pending"),
    paymentId: text("payment_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    seekerIdx: index().on(table.seekerId),
    providerIdx: index().on(table.providerId),
    dateIdx: index().on(table.date),
    statusIdx: index().on(table.status),
  }),
)

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    tier: subscriptionTierEnum("tier").default("free"),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    status: statusEnum("status").default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index().on(table.userId),
    stripeIdx: index().on(table.stripeSubscriptionId),
    statusIdx: index().on(table.status),
  }),
)

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false),
    data: jsonb("data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index().on(table.userId),
    typeIdx: index().on(table.type),
    readIdx: index().on(table.read),
    createdIdx: index().on(table.createdAt),
  }),
)

export const adminSettings = pgTable(
  "admin_settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
)

export const tribes = pgTable(
  "tribes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").unique().notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameIdx: index().on(table.name),
  }),
)

export const interests = pgTable(
  "interests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").unique().notNull(),
    category: text("category"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameIdx: index().on(table.name),
    categoryIdx: index().on(table.category),
  }),
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    // other user-specific fields from auth.users can be mirrored here if needed
  },
)


export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantOne: uuid("participant_one").references(() => users.id),
    participantTwo: uuid("participant_two").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    participantsIdx: index().on(table.participantOne, table.participantTwo),
  }),
)

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: varchar("conversation_id").notNull(),
    sender_id: uuid("sender_id").references(() => users.id).notNull(),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    convIdx: index().on(table.conversationId),
    senderIdx: index().on(table.sender_id),
    createdIdx: index().on(table.created_at),
  }),
)

export const meetNowCards = pgTable(
  'meet_now_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    userName: varchar('user_name', { length: 255 }).notNull(),
    userAvatar: text('user_avatar'),
    activity: varchar('activity', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    time: varchar('time', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
      userIdx: index().on(table.userId),
      createdIdx: index().on(table.createdAt),
  })
);


// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId]
  }),
  favorites: many(favorites, { relationName: 'userFavorites' }),
  favoritedBy: many(favorites, { relationName: 'favoritedBy' }),
  seekerBookings: many(bookings, { relationName: 'seekerBookings' }),
  providerBookings: many(bookings, { relationName: 'providerBookings' }),
  subscriptions: many(subscriptions),
  notifications: many(notifications),
}))

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, {
    fields: [conversations.participantOne],
    references: [users.id],
    relationName: 'participant1'
  }),
  participant2: one(users, {
    fields: [conversations.participantTwo],
    references: [users.id],
    relationName: 'participant2'
  }),
}));

export const meetNowRelations = relations(meetNowCards, ({ one }) => ({
  author: one(profiles, {
    fields: [meetNowCards.userId],
    references: [profiles.userId],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
    relationName: 'userFavorites'
  }),
  favoritedUser: one(users, {
    fields: [favorites.favoritedUserId],
    references: [users.id],
    relationName: 'favoritedBy'
  }),
}))

export const bookingsRelations = relations(bookings, ({ one }) => ({
  seeker: one(users, {
    fields: [bookings.seekerId],
    references: [users.id],
    relationName: 'seekerBookings'
  }),
  provider: one(users, {
    fields: [bookings.providerId],
    references: [users.id],
    relationName: 'providerBookings'
  }),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

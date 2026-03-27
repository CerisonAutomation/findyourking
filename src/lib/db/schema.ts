/**
 * Database Schema - Drizzle ORM with PostgreSQL
 * Replacing Supabase with direct PostgreSQL + Redis
 */

import {boolean, decimal, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator'])
export const genderEnum = pgEnum('gender', ['male', 'female', 'non_binary', 'other'])
export const matchDirectionEnum = pgEnum('match_direction', ['left', 'right', 'up'])
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'voice', 'video', 'reaction'])
export const eventCategoryEnum = pgEnum('event_category', ['social', 'party', 'meetup', 'festival', 'online'])

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    username: text('username').unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').default('user'),
    isVerified: boolean('is_verified').default(false),
    isActive: boolean('is_active').default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

// Profiles table
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    birthDate: timestamp('birth_date'),
    gender: genderEnum('gender'),
    location: text('location'), // JSON string {lat, lng, city}
    interests: jsonb('interests').$type<string[]>(),
    lookingFor: jsonb('looking_for').$type<string[]>(),
    languages: jsonb('languages').$type<string[]>(),
    work: text('work'),
    education: text('education'),
    height: integer('height'), // cm
    bodyType: text('body_type'),
    relationshipStatus: text('relationship_status'),
    drinking: text('drinking'),
    smoking: text('smoking'),
    showOnlineStatus: boolean('show_online_status').default(true),
    showDistance: boolean('show_distance').default(true),
    showAge: boolean('show_age').default(true),
    allowMessagesFrom: text('allow_messages_from').default('everyone'), // everyone, matches_only, nobody
    maxDistance: integer('max_distance').default(50), // km
    ageRangeMin: integer('age_range_min').default(18),
    ageRangeMax: integer('age_range_max').default(100),
    isPremium: boolean('is_premium').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

// Matches/Swipes table
export const matches = pgTable('matches', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id).notNull(),
    direction: matchDirectionEnum('direction').notNull(),
    isMatch: boolean('is_match').default(false),
    matchedAt: timestamp('matched_at'),
    createdAt: timestamp('created_at').defaultNow()
})

// Conversations table
export const conversations = pgTable('conversations', {
    id: uuid('id').primaryKey().defaultRandom(),
    participantAId: uuid('participant_a_id').references(() => users.id).notNull(),
    participantBId: uuid('participant_b_id').references(() => users.id).notNull(),
    lastMessageAt: timestamp('last_message_at'),
    lastMessagePreview: text('last_message_preview'),
    unreadCountA: integer('unread_count_a').default(0),
    unreadCountB: integer('unread_count_b').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow()
})

// Messages table
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
    senderId: uuid('sender_id').references(() => users.id).notNull(),
    content: text('content').notNull(),
    type: messageTypeEnum('type').default('text'),
    attachments: jsonb('attachments').$type<string[]>(),
    isEdited: boolean('is_edited').default(false),
    isDeleted: boolean('is_deleted').default(false),
    isRead: boolean('is_read').default(false),
    reactions: jsonb('reactions').$type<Record<string, string[]>>(),
    p2pDelivered: boolean('p2p_delivered').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

// Events table
export const events = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizerId: uuid('organizer_id').references(() => users.id).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: eventCategoryEnum('category').notNull(),
    location: text('location'), // JSON string {lat, lng, venue}
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    capacity: integer('capacity'),
    currentAttendees: integer('current_attendees').default(0),
    price: decimal('price', {precision: 10, scale: 2}),
    imageUrl: text('image_url'),
    isPublic: boolean('is_public').default(true),
    tags: jsonb('tags').$type<string[]>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

// Event RSVPs
export const eventRsvps = pgTable('event_rsvps', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').references(() => events.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    status: text('status').default('going'), // going, maybe, not_going
    createdAt: timestamp('created_at').defaultNow()
})

// User location tracking
export const userLocations = pgTable('user_locations', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    latitude: decimal('latitude', {precision: 10, scale: 8}).notNull(),
    longitude: decimal('longitude', {precision: 11, scale: 8}).notNull(),
    accuracy: integer('accuracy'), // meters
    timestamp: timestamp('timestamp').defaultNow()
})

// User presence (for Redis sync)
export const userPresence = pgTable('user_presence', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    isOnline: boolean('is_online').default(false),
    isTyping: boolean('is_typing').default(false),
    lastSeen: timestamp('last_seen'),
    currentConversationId: uuid('current_conversation_id').references(() => conversations.id),
    updatedAt: timestamp('updated_at').defaultNow()
})

// Blocks
export const blocks = pgTable('blocks', {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerId: uuid('blocker_id').references(() => users.id).notNull(),
    blockedId: uuid('blocked_id').references(() => users.id).notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow()
})

// Reports
export const reports = pgTable('reports', {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id').references(() => users.id).notNull(),
    reportedId: uuid('reported_id').references(() => users.id),
    reportedContentId: uuid('reported_content_id'),
    contentType: text('content_type'), // user, message, event
    reason: text('reason').notNull(),
    description: text('description'),
    status: text('status').default('pending'), // pending, reviewed, resolved
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow()
})

// Auth tables for Better Auth
export const accounts = pgTable('accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

export const verifications = pgTable('verifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow()
})

// AI Feature Tables
export const autoReplyRules = pgTable('auto_reply_rules', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    name: text('name').notNull(),
    priority: integer('priority').default(5),
    triggers: jsonb('triggers').notNull(),
    response: jsonb('response').notNull(),
    conditions: jsonb('conditions').default('{}'),
    isEnabled: boolean('is_enabled').default(true),
    usageCount: integer('usage_count').default(0),
    successRate: decimal('success_rate', {precision: 3, scale: 2}).default('0.00'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
    userIdIdx: index('idx_auto_reply_user_id').on(table.userId),
    priorityIdx: index('idx_auto_reply_priority').on(table.priority),
    enabledIdx: index('idx_auto_reply_enabled').on(table.isEnabled)
}))

export const voiceCommands = pgTable('voice_commands', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
    commandText: text('command_text').notNull(),
    commandType: text('command_type').notNull(),
    parameters: jsonb('parameters').default('{}'),
    executionStatus: text('execution_status').default('pending'),
    confidenceScore: decimal('confidence_score', {precision: 3, scale: 2}),
    createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
    userIdIdx: index('idx_voice_cmd_user_id').on(table.userId),
    commandTypeIdx: index('idx_voice_cmd_type').on(table.commandType),
    statusIdx: index('idx_voice_cmd_status').on(table.executionStatus)
}))

export const translationCache = pgTable('translation_cache', {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceText: text('source_text').notNull(),
    sourceLanguage: text('source_language').notNull(),
    targetLanguage: text('target_language').notNull(),
    translatedText: text('translated_text').notNull(),
    confidenceScore: decimal('confidence_score', {precision: 3, scale: 2}),
    usageCount: integer('usage_count').default(1),
    createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
    sourceTextIdx: index('idx_translation_source').on(table.sourceText),
    languagePairIdx: index('idx_translation_languages').on(table.sourceLanguage, table.targetLanguage),
    uniqueTranslation: index('idx_translation_unique').on(table.sourceText, table.sourceLanguage, table.targetLanguage)
}))

// Relations
export const usersRelations = relations(users, ({many}) => ({
    profiles: many(profiles),
    matchesSent: many(matches),
    matchesReceived: many(matches),
    conversationsA: many(conversations),
    conversationsB: many(conversations),
    messagesSent: many(messages),
    eventsOrganized: many(events),
    eventRsvps: many(eventRsvps),
    locations: many(userLocations),
    presence: many(userPresence),
    blocksSent: many(blocks),
    blocksReceived: many(blocks),
    reportsSent: many(reports),
    reportsReceived: many(reports),
    accounts: many(accounts),
    sessions: many(sessions),
    autoReplyRules: many(autoReplyRules),
    voiceCommands: many(voiceCommands)
}))

export const profilesRelations = relations(profiles, ({one}) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id]
    })
}))

export const matchesRelations = relations(matches, ({one}) => ({
    user: one(users, {
        fields: [matches.userId],
        references: [users.id]
    }),
    targetUser: one(users, {
        fields: [matches.targetUserId],
        references: [users.id]
    })
}))

export const conversationsRelations = relations(conversations, ({one, many}) => ({
    participantA: one(users, {
        fields: [conversations.participantAId],
        references: [users.id]
    }),
    participantB: one(users, {
        fields: [conversations.participantBId],
        references: [users.id]
    }),
    messages: many(messages)
}))

export const messagesRelations = relations(messages, ({one}) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id]
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id]
    })
}))

export const eventsRelations = relations(events, ({one, many}) => ({
    organizer: one(users, {
        fields: [events.organizerId],
        references: [users.id]
    }),
    rsvps: many(eventRsvps)
}))

export const autoReplyRulesRelations = relations(autoReplyRules, ({one}) => ({
    user: one(users, {
        fields: [autoReplyRules.userId],
        references: [users.id]
    })
}))

export const voiceCommandsRelations = relations(voiceCommands, ({one}) => ({
    user: one(users, {
        fields: [voiceCommands.userId],
        references: [users.id]
    })
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type EventRsvp = typeof eventRsvps.$inferSelect
export type NewEventRsvp = typeof eventRsvps.$inferInsert
export type UserLocation = typeof userLocations.$inferSelect
export type NewUserLocation = typeof userLocations.$inferInsert
export type UserPresence = typeof userPresence.$inferSelect
export type NewUserPresence = typeof userPresence.$inferInsert
export type Block = typeof blocks.$inferSelect
export type NewBlock = typeof blocks.$inferInsert
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Verification = typeof verifications.$inferSelect
export type NewVerification = typeof verifications.$inferInsert
export type AutoReplyRule = typeof autoReplyRules.$inferSelect
export type NewAutoReplyRule = typeof autoReplyRules.$inferInsert
export type VoiceCommand = typeof voiceCommands.$inferSelect
export type NewVoiceCommand = typeof voiceCommands.$inferInsert
export type TranslationCacheEntry = typeof translationCache.$inferSelect
export type NewTranslationCacheEntry = typeof translationCache.$inferInsert
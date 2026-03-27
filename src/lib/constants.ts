/**
 * Constants - Consolidated Application Constants
 * Centralized constants for the Find Your King dating platform
 */

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        CALLBACK: '/api/auth/callback',
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
    },
    PROFILES: {
        BASE: '/api/profiles',
        SEARCH: '/api/profiles/search',
        ME: '/api/profiles/me',
        PHOTO: '/api/profiles/photo',
    },
    MESSAGES: {
        BASE: '/api/messages',
        CONVERSATIONS: '/api/messages/conversations',
        TYPING: '/api/messages/typing',
    },
    EVENTS: {
        BASE: '/api/events',
        ATTEND: '/api/events/attend',
        MY_EVENTS: '/api/events/my-events',
    },
    LOCATION: {
        UPDATE: '/api/location/update',
        NEARBY: '/api/location/nearby',
    },
    MATCHES: {
        BASE: '/api/matches',
        SWIPE: '/api/matches/swipe',
    },
    ADMIN: {
        STATS: '/api/admin/stats',
        USERS: '/api/admin/users',
        REPORTS: '/api/admin/reports',
        ANALYTICS: '/api/admin/analytics',
    },
} as const

// Event Categories
export const EVENT_CATEGORIES = {
    SOCIAL: 'social',
    PARTY: 'party',
    MEETUP: 'meetup',
    FESTIVAL: 'festival',
    ONLINE: 'online',
} as const

// Message Types
export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    SYSTEM: 'system',
} as const

// User Status
export const USER_STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    AWAY: 'away',
    BUSY: 'busy',
} as const

// Report Reasons
export const REPORT_REASONS = {
    FAKE_PROFILE: 'fake_profile',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    HARASSMENT: 'harassment',
    SPAM: 'spam',
    UNDERAGE: 'underage',
    OTHER: 'other',
} as const

// Privacy Settings
export const PRIVACY_SETTINGS = {
    SHOW_ONLINE_STATUS: 'show_online_status',
    SHOW_DISTANCE: 'show_distance',
    SHOW_AGE: 'show_age',
    ALLOW_MESSAGES_FROM: 'allow_messages_from',
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
    MESSAGE: 'message',
    MATCH: 'match',
    EVENT_REMINDER: 'event_reminder',
    PROFILE_VIEW: 'profile_view',
    SYSTEM: 'system',
} as const

// Pagination Defaults
export const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0,
} as const

// Rate Limiting
export const RATE_LIMITS = {
    MESSAGES_PER_MINUTE: 30,
    SWIPES_PER_HOUR: 100,
    PROFILE_UPDATES_PER_DAY: 5,
    EVENTS_PER_WEEK: 3,
} as const

// File Upload Limits
export const UPLOAD_LIMITS = {
    MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
} as const

// Location Settings
export const LOCATION_SETTINGS = {
    DEFAULT_RADIUS: 10, // km
    MAX_RADIUS: 500, // km
    UPDATE_INTERVAL: 30000, // 30 seconds
} as const

// P2P Settings
export const P2P_SETTINGS = {
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 1000, // ms
    HEARTBEAT_INTERVAL: 5000, // ms
    CONNECTION_TIMEOUT: 10000, // ms
} as const

// Performance Monitoring
export const PERFORMANCE_THRESHOLDS = {
    LCP_TARGET: 2500, // Largest Contentful Paint (ms)
    FID_TARGET: 100, // First Input Delay (ms)
    CLS_TARGET: 0.1, // Cumulative Layout Shift
    FCP_TARGET: 1800, // First Contentful Paint (ms)
    TTFB_TARGET: 800, // Time to First Byte (ms)
} as const
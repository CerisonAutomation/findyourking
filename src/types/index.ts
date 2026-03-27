/**
 * Find Your King - Consolidated Type Definitions
 * Single source of truth from Drizzle ORM schema
 */

// ============================================================
// DATABASE TYPES - From Drizzle Schema (Single Source of Truth)
// ============================================================
export type {
    User,
    NewUser,
    Profile,
    NewProfile,
    Conversation,
    NewConversation,
    Message,
    NewMessage,
    AutoReplyRule,
    NewAutoReplyRule,
    VoiceCommand,
    NewVoiceCommand,
    TranslationCache,
    NewTranslationCache
} from '@/lib/db/schema'

// ============================================================
// ENTERPRISE TYPES
// ============================================================
export type {
    LocationData,
    P2PConfig,
    P2PMessage,
    P2PCall,
    UserProfile,
    MatchScore,
    SignalingStrategy,
    AIAnalysis,
    PerformanceMetrics,
    AccessibilityFeatures,
    SecuritySettings,
    NotificationSettings,
    EnterpriseConfig
} from './enterprise'

// ============================================================
// API TYPES
// ============================================================
export type {
    ApiResponse,
    PaginatedResponse,
    ErrorResponse
} from './api'

// ============================================================
// COMPONENT TYPES
// ============================================================
export type {
    ThemeMode,
    ThemeColors
} from './theme'

// ============================================================
// UTILITY TYPES
// ============================================================
export type {
    Optional,
    RequiredFields,
    DeepPartial
} from './utility'

// ============================================================
// RE-EXPORT ALL DB SCHEMA TYPES FOR CONVENIENCE
// ============================================================
export * from '@/lib/db/schema'
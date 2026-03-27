/**
 * Find Your King - Consolidated Core Library
 * Enterprise-grade unified exports for the dating platform
 */

// ============================================================
// DATABASE - Single Source of Truth (Drizzle + PostgreSQL + Redis)
// ============================================================
export {db, redis, cache, sessions, presence, rateLimit} from './db'
export * from './db/schema'

// ============================================================
// AUTHENTICATION - Better Auth with Drizzle
// ============================================================
export {auth} from './auth/better-auth'
export {Session} from './auth/better-auth'

// ============================================================
// AI SERVICES
// ============================================================
export {AIMatchingEngine} from './ai'
export {useConversationCoach} from './ai/conversation-coach'
export {useMessageAutocomplete} from './ai/message-autocomplete'
export {useTranslationService} from './ai/translation-service'

// ============================================================
// P2P ENGINE - Unified P2P Communication
// ============================================================
export {createP2PEngine, createChatP2PEngine, createPresenceP2PEngine} from './p2p'
export type {P2PEngine} from './p2p'

// ============================================================
// ENTERPRISE FEATURES
// ============================================================
export {ZeroKnowledgeEncryption} from './enterprise/encryption/ZeroKnowledgeEncryption'
export {AccessibilityManager} from './enterprise/accessibility/AccessibilityManager'
export {PerformanceMonitor} from './enterprise/performance/PerformanceMonitor'
export {SignalingStrategy, HybridSignalingStrategy} from './enterprise/p2p/SignalingStrategy'
export {SecurityManager} from './security/security-manager'

// ============================================================
// AUTOMATION
// ============================================================
export {useAutoReplyEngine} from './automation/auto-reply-engine'

// ============================================================
// VOICE
// ============================================================
export {VoiceController} from './voice/voice-controller'

// ============================================================
// PREMIUM
// ============================================================
export {PremiumManager} from './premium/premium-manager'

// ============================================================
// REALTIME
// ============================================================
export {RealtimeManager} from './realtime/realtime-manager'

// ============================================================
// INTERNATIONALIZATION
// ============================================================
export {default as i18n} from './i18n/config'

// ============================================================
// HOOKS
// ============================================================
export {usePresenceStore, usePresenceChannel, useTypingIndicator} from '../hooks'

// ============================================================
// UTILITIES
// ============================================================
export {cn} from './utils'

// ============================================================
// CONSTANTS
// ============================================================
export {API_ENDPOINTS, EVENT_CATEGORIES, MESSAGE_TYPES} from './constants'

// ============================================================
// FEATURE REGISTRY
// ============================================================
export {Features} from './feature-registry'

// ============================================================
// TRPC
// ============================================================
export {api, publicProcedure, protectedProcedure, createContext} from './trpc'

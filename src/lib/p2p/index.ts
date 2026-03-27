/**
 * P2P Engine - Consolidated WebRTC & Trystero Implementation
 * Primary P2P communication engine for Zenith dating platform
 */

export {createP2PEngine, createChatP2PEngine, createPresenceP2PEngine} from './engine'
export type {P2PEngine} from './engine'

// Re-export enterprise signaling strategies
export {
    SignalingStrategy,
    WebRTCStrategy,
    SupabaseRealtimeStrategy,
    NostrStrategy,
    createSignalingStrategy,
    HybridSignalingStrategy
} from '../enterprise/p2p/SignalingStrategy'
export type {SignalingConfig, SignalingMessage} from '../enterprise/p2p/SignalingStrategy'
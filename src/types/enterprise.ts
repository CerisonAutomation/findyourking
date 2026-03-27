/**
 * Enterprise Types for Hybrid P2P Dating Platform
 * Production-ready type definitions for 15/10 enterprise system
 */

export interface LocationData {
    latitude: number
    longitude: number
    accuracy: number
    geohash: string
    timestamp: Date
    privacy: 'exact' | 'street' | 'city' | 'region'
}

export interface P2PConfig {
    enableWebRTC: boolean
    enableBitTorrent: boolean
    enableNostr: boolean
    enableMQTT: boolean
    enableIPFS: boolean
    stunServers: string[]
    turnServers: string[]
    maxConnections: number
    heartbeatInterval: number
    encryptionLevel: 'standard' | 'enhanced' | 'maximum'
}

export interface P2PMessage {
    id: string
    fromUserId: string
    toUserId: string
    content: string
    type: 'text' | 'image' | 'voice' | 'video'
    timestamp: Date
    isEncrypted: boolean
    isEphemeral: boolean
    metadata?: {
        strategy?: string
        checksum?: string
        fileUrl?: string
        fileName?: string
        fileSize?: number
    }
}

export interface P2PCall {
    id: string
    fromUserId: string
    toUserId: string
    status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed'
    startTime: Date
    endTime?: Date
    duration?: number
    mediaConstraints?: MediaStreamConstraints
    encryptionEnabled: boolean
    metadata?: {
        strategy?: string
        offer?: RTCSessionDescriptionInit
        answer?: RTCSessionDescriptionInit
        iceCandidates?: RTCIceCandidate[]
    }
}

export interface UserProfile {
    id: string
    displayName: string
    age: number
    bio: string
    location: {
        city?: string
        distance?: number
        latitude?: number
        longitude?: number
    }
    photos: Array<{
        id: string
        url: string
        thumbnailUrl: string
        isPrimary: boolean
        uploadedAt: Date
    }>
    verification: {
        ageVerified: boolean
        photoVerified: boolean
        idVerified: boolean
        phoneVerified: boolean
    }
    stats: {
        compatibilityScore?: number
        responseRate: number
        trustScore: number
        profileViews: number
        profileLikes: number
        matches: number
        averageResponseTime: number
    }
    preferences: {
        ageRange: [number, number]
        maxDistance: number
        interestedIn: string[]
        relationshipType: string
    }
    isOnline: boolean
    isPremium: boolean
    lastActive: Date
    geohash?: string
    aiCompatibilityScore?: number
    personalityTraits?: string[]
    interests: string[]
}

export interface MatchScore {
    userId: string
    overallScore: number
    compatibilityFactors: {
        interests: number
        values: number
        lifestyle: number
        communication: number
        physical: number
        emotional: number
    }
    personalityMatch: number
    recommendationStrength: 'weak' | 'moderate' | 'strong' | 'excellent'
    explanation: string[]
    improvementSuggestions: string[]
}

export interface SignalingStrategy {
    name: string

    isAvailable(): boolean

    initialize(): Promise<void>

    sendMessage(message: P2PMessage): Promise<void>

    initiateCall(call: P2PCall): Promise<void>

    cleanup(): Promise<void>
}

export interface AIAnalysis {
    profileCompleteness: number
    photoQuality: number
    bioEngagement: number
    attractivenessScore: number
    personalityInsights: string[]
    improvementSuggestions: string[]
    compatibilityFactors: {
        interests: number
        values: number
        lifestyle: number
        communication: number
    }
    behavioralPatterns: {
        responseTime: number
        messageFrequency: number
        peakActivityHours: number[]
        sentimentAnalysis: number
    }
}

export interface PerformanceMetrics {
    webVitals: {
        lcp: number // Largest Contentful Paint
        fid: number // First Input Delay
        cls: number // Cumulative Layout Shift
        fcp: number // First Contentful Paint
        ttfb: number // Time to First Byte
    }
    resources: {
        memoryUsage: number
        cpuUsage: number
        networkLatency: number
        bundleSize: number
    }
    userExperience: {
        errorRate: number
        crashRate: number
        loadTime: number
        interactionTime: number
    }
}

export interface AccessibilityFeatures {
    screenReader: {
        enabled: boolean
        voiceCommands: boolean
        brailleSupport: boolean
    }
    keyboardNavigation: {
        enabled: boolean
        shortcuts: Record<string, string>
        focusManagement: boolean
    }
    visualAids: {
        highContrast: boolean
        largeText: boolean
        reducedMotion: boolean
        colorBlindMode: boolean
    }
    cognitive: {
        simpleMode: boolean
        readingLevel: 'basic' | 'intermediate' | 'advanced'
        distractionFree: boolean
    }
}

export interface SecuritySettings {
    twoFactorAuth: boolean
    biometricAuth: boolean
    sessionTimeout: number
    loginAlerts: boolean
    deviceManagement: boolean
    encryptionLevel: 'standard' | 'enhanced' | 'maximum'
    dataBackup: boolean
    privacyMode: boolean
    screenshotProtection: boolean
    auditLogging: boolean
}

export interface NotificationSettings {
    pushNotifications: boolean
    emailNotifications: boolean
    smsNotifications: boolean
    messageNotifications: boolean
    likeNotifications: boolean
    matchNotifications: boolean
    profileViewNotifications: boolean
    quietHours: boolean
    quietHoursStart: string
    quietHoursEnd: string
    soundEnabled: boolean
    vibrationEnabled: boolean
}

export interface EnterpriseConfig {
    performance: PerformanceMetrics
    accessibility: AccessibilityFeatures
    security: SecuritySettings
    notifications: NotificationSettings
    ai: {
        enabled: boolean
        model: string
        apiKey?: string
        behavioralAnalysis: boolean
        compatibilityAnalysis: boolean
        contentModeration: boolean
    }
    p2p: P2PConfig
    monitoring: {
        enabled: boolean
        alertThresholds: Record<string, number>
        reportingInterval: number
        logRetention: number
    }
}

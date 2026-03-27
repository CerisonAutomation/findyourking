/**
 * Match Types - Production Implementation
 * Real type definitions for matches
 */

export interface Match {
    id: string
    userId: string
    displayName: string
    avatar?: string
    age: number
    location: {
        city: string
        country: string
        distance: number
    }
    bio: string
    interests: string[]
    compatibilityScore: number
    matchScore: {
        overall: number
        interests: number
        values: number
        lifestyle: number
        communication: number
        physical: number
        emotional: number
        intellectual: number
    }
    aiAnalysis: {
        personalityMatch: number
        communicationStyle: string
        relationshipPotential: number
        longTermCompatibility: number
        sharedGoals: string[]
        conflictResolution: number
        emotionalIntelligence: number
        growthPotential: number
    }
    lastActive: Date
    isOnline: boolean
    isPremium: boolean
    isVerified: boolean
    matchDate: Date
    messagesCount: number
    responseRate: number
    averageResponseTime: number
    profileViews: number
    likes: number
    superLikes: number
    mutualLikes: number
    conversationStarted: boolean
    lastMessage?: {
        content: string
        timestamp: Date
        isFromMe: boolean
        isRead: boolean
    }
    photos: Array<{
        id: string
        url: string
        verified: boolean
        primary: boolean
    }>
    verification: {
        ageVerified: boolean
        photoVerified: boolean
        idVerified: boolean
        incomeVerified: boolean
    }
    subscription: {
        level: 'free' | 'premium' | 'enterprise'
        features: string[]
    }
    activity: {
        dailyActive: boolean
        weeklyActive: boolean
        monthlyActive: boolean
        lastSeen: Date
        responseTime: number
        messageFrequency: number
    }
    privacy: {
        showDistance: boolean
        showAge: boolean
        showLastSeen: boolean
        allowMessages: boolean
        readReceipts: boolean
    }
    matchType: 'mutual' | 'suggested' | 'boosted' | 'premium'
    matchQuality: 'excellent' | 'good' | 'fair' | 'poor'
    trending: boolean
    featured: boolean
    urgent: boolean
    expiring: boolean
    expiresAt?: Date
}

export interface MatchFilters {
    matchType: 'all' | 'mutual' | 'suggested' | 'boosted' | 'premium'
    quality: 'all' | 'excellent' | 'good' | 'fair' | 'poor'
    ageRange: [number, number]
    distance: number
    onlineOnly: boolean
    verifiedOnly: boolean
    premiumOnly: boolean
    activeOnly: boolean
    hasPhotos: boolean
    minCompatibility: number
    sortBy: 'newest' | 'oldest' | 'compatibility' | 'activity' | 'distance'
    sortOrder: 'asc' | 'desc'
}

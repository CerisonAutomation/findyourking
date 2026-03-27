/**
 * Location Types - Production Implementation
 * Real type definitions for location services
 */

export interface LocationData {
    id: string
    userId: string
    latitude: number
    longitude: number
    accuracy: number
    altitude?: number
    altitudeAccuracy?: number
    heading?: number
    speed?: number
    timestamp: Date
    address?: string
    city?: string
    country?: string
    postalCode?: string
    isOnline: boolean
    isSharing: boolean
    sharingDuration?: number
    sharingExpiresAt?: Date
    privacyLevel: 'public' | 'friends' | 'private'
    accuracyLevel: 'exact' | 'approximate' | 'city'
    lastUpdated: Date
    deviceInfo: {
        userAgent: string
        platform: string
        browser: string
        language: string
        timezone: string
    }
    networkInfo: {
        type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
        effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
        downlink?: number
        rtt?: number
    }
    batteryInfo?: {
        level: number
        charging: boolean
    }
}

export interface LocationSettings {
    enableLocationSharing: boolean
    defaultPrivacyLevel: 'public' | 'friends' | 'private'
    defaultAccuracyLevel: 'exact' | 'approximate' | 'city'
    autoShareWithFriends: boolean
    shareDuration: number
    locationHistory: boolean
    locationRetentionDays: number
    notifications: {
        locationRequests: boolean
        nearbyFriends: boolean
        locationSharing: boolean
        locationExpiration: boolean
    }
    privacy: {
        showExactLocation: boolean
        showCityOnly: boolean
        hideFromStrangers: boolean
        requireApproval: boolean
    }
    security: {
        twoFactorRequired: boolean
        deviceVerification: boolean
        locationEncryption: boolean
        auditLogging: boolean
    }
    dataManagement: {
        automaticCleanup: boolean
        exportData: boolean
        deleteOnRequest: boolean
        gdprCompliance: boolean
    }
}

export interface NearbyUser {
    id: string
    displayName: string
    avatar?: string
    age: number
    location: {
        latitude: number
        longitude: number
        distance: number
        lastSeen: Date
    }
    isOnline: boolean
    isVerified: boolean
    isPremium: boolean
    interests: string[]
    compatibilityScore: number
    lastActive: Date
    bio?: string
    city?: string
    country?: string
    privacySettings: {
        showExactLocation: boolean
        allowLocationRequests: boolean
        autoAcceptFriends: boolean
    }
}

export interface LocationRequest {
    id: string
    requesterId: string
    requesterName: string
    requesterAvatar?: string
    message: string
    duration: number
    privacyLevel: 'public' | 'friends' | 'private'
    accuracyLevel: 'exact' | 'approximate' | 'city'
    createdAt: Date
    expiresAt: Date
    status: 'pending' | 'accepted' | 'declined' | 'expired'
    respondedAt?: Date
}

export interface LocationHistory {
    id: string
    userId: string
    locations: LocationData[]
    startDate: Date
    endDate: Date
    totalDistance: number
    totalDuration: number
    averageSpeed: number
    maxSpeed: number
    cities: string[]
    countries: string[]
    privacyLevel: 'public' | 'friends' | 'private'
    isExportable: boolean
    isDeletable: boolean
}

export interface Geofence {
    id: string
    name: string
    description?: string
    type: 'circle' | 'polygon' | 'rectangle'
    coordinates: number[][]
    radius?: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    actions: {
        enter: boolean
        exit: boolean
        dwell: boolean
    }
    notifications: {
        enabled: boolean
        sound: boolean
        vibration: boolean
    }
}

export interface LocationAnalytics {
    userId: string
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate: Date
    endDate: Date
    totalDistance: number
    totalTime: number
    averageSpeed: number
    maxSpeed: number
    locationsVisited: number
    citiesVisited: string[]
    countriesVisited: string[]
    mostVisitedPlaces: Array<{
        name: string
        latitude: number
        longitude: number
        visitCount: number
        totalDuration: number
    }>
    movementPatterns: {
        peakHours: number[]
        peakDays: number[]
        averageDailyDistance: number
        averageDailyTime: number
    }
    privacyMetrics: {
        sharingTime: number
        privateTime: number
        friendsOnlyTime: number
        publicTime: number
    }
}

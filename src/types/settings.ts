/**
 * Settings Types - Production Implementation
 * Real type definitions for settings
 */

export interface NotificationSettings {
    email: {
        newMatches: boolean
        messages: boolean
        likes: boolean
        profileViews: boolean
        events: boolean
        newsletters: boolean
        promotions: boolean
        securityAlerts: boolean
        accountUpdates: boolean
    }
    push: {
        newMatches: boolean
        messages: boolean
        likes: boolean
        profileViews: boolean
        events: boolean
        nearbyUsers: boolean
        chatRequests: boolean
        superLikes: boolean
        expiringMatches: boolean
    }
    sms: {
        securityAlerts: boolean
        accountUpdates: boolean
        emergencyNotifications: boolean
    }
    inApp: {
        sound: boolean
        vibration: boolean
        desktopNotifications: boolean
        badgeCount: boolean
        previewMessages: boolean
        onlineStatus: boolean
        typingIndicators: boolean
        readReceipts: boolean
    }
    frequency: {
        immediate: boolean
        hourly: boolean
        daily: boolean
        weekly: boolean
        monthly: boolean
    }
    quietHours: {
        enabled: boolean
        startTime: string
        endTime: string
        timezone: string
        weekends: boolean
    }
}

export interface PrivacySettings {
    profile: {
        showAge: boolean
        showDistance: boolean
        showLastSeen: boolean
        showOnlineStatus: boolean
        allowProfileViews: boolean
        allowScreenshots: boolean
        publicProfile: boolean
        searchEngineIndexing: boolean
    }
    location: {
        shareLocation: boolean
        accuracyLevel: 'exact' | 'approximate' | 'city'
        showCityOnly: boolean
        autoShareWithFriends: boolean
        locationHistory: boolean
        locationRetentionDays: number
    }
    photos: {
        publicPhotos: boolean
        allowDownload: boolean
        allowScreenshots: boolean
        photoVerification: boolean
        autoDeleteExpired: boolean
        watermarkPhotos: boolean
    }
    messages: {
        allowMessages: boolean
        allowFromStrangers: boolean
        messageRequests: boolean
        autoAcceptFriends: boolean
        readReceipts: boolean
        typingIndicators: boolean
        messageEncryption: boolean
        messageRetention: number
    }
    data: {
        analyticsTracking: boolean
        advertisingPersonalization: boolean
        thirdPartySharing: boolean
        dataBrokers: boolean
        researchParticipation: boolean
        gdprCompliance: boolean
        ccpaCompliance: boolean
    }
    blocking: {
        blockedUsers: string[]
        hideFromBlocked: boolean
        preventContact: boolean
        hideFromSearch: boolean
        anonymousBrowsing: boolean
    }
}

export interface SecuritySettings {
    authentication: {
        twoFactorEnabled: boolean
        twoFactorMethod: 'sms' | 'authenticator' | 'email'
        biometricEnabled: boolean
        sessionTimeout: number
        autoLogout: boolean
        loginNotifications: boolean
        trustedDevices: Array<{
            id: string
            name: string
            lastUsed: Date
            trusted: boolean
        }>
    }
    password: {
        minLength: number
        requireUppercase: boolean
        requireLowercase: boolean
        requireNumbers: boolean
        requireSpecialChars: boolean
        passwordHistory: number
        expirationDays: number
        lastChanged: Date
    }
    sessions: {
        activeSessions: Array<{
            id: string
            device: string
            location: string
            ipAddress: string
            startTime: Date
            lastActivity: Date
            current: boolean
        }>
        maxSessions: number
        autoRevoke: boolean
        revokeAfter: number
    }
    encryption: {
        endToEndEncryption: boolean
        keyRotation: boolean
        keyRotationInterval: number
        secureBackup: boolean
        cloudSync: boolean
        localStorage: boolean
    }
    monitoring: {
        loginAttempts: boolean
        failedAttempts: boolean
        suspiciousActivity: boolean
        dataBreaches: boolean
        thirdPartyAccess: boolean
        apiUsage: boolean
    }
    recovery: {
        recoveryEmail: string
        recoveryPhone: string
        recoveryQuestions: Array<{
            question: string
            answer: string
        }>
        backupCodes: string[]
        emergencyContact: string
    }
}

export interface AppearanceSettings {
    theme: {
        mode: 'light' | 'dark' | 'auto' | 'system'
        primaryColor: string
        accentColor: string
        customColors: boolean
        colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    }
    layout: {
        density: 'compact' | 'comfortable' | 'spacious'
        sidebarPosition: 'left' | 'right' | 'hidden'
        navigationStyle: 'tabs' | 'sidebar' | 'top'
        cardSize: 'small' | 'medium' | 'large'
        gridColumns: number
    }
    typography: {
        fontFamily: string
        fontSize: 'small' | 'medium' | 'large' | 'extra-large'
        lineHeight: 'compact' | 'normal' | 'relaxed'
        fontWeight: 'light' | 'normal' | 'bold'
        customFont: boolean
    }
    animations: {
        enabled: boolean
        speed: 'slow' | 'normal' | 'fast'
        reducedMotion: boolean
        parallax: boolean
        transitions: boolean
        hoverEffects: boolean
    }
    accessibility: {
        highContrast: boolean
        largeText: boolean
        screenReader: boolean
        keyboardNavigation: boolean
        focusIndicators: boolean
        altText: boolean
        captions: boolean
    }
    profile: {
        photoLayout: 'grid' | 'carousel' | 'stack'
        bioLength: number
        interestsDisplay: 'tags' | 'list' | 'cloud'
        verificationBadges: boolean
        compatibilityScores: boolean
        aiInsights: boolean
    }
}

export interface PerformanceSettings {
    loading: {
        preloadImages: boolean
        lazyLoading: boolean
        imageQuality: 'low' | 'medium' | 'high' | 'auto'
        cacheSize: number
        backgroundRefresh: boolean
        offlineMode: boolean
    }
    network: {
        dataSaver: boolean
        compressImages: boolean
        compressVideos: boolean
        adaptiveStreaming: boolean
        bandwidthLimit: number
        wifiOnly: boolean
    }
    battery: {
        powerSaver: boolean
        reduceAnimations: boolean
        backgroundSync: boolean
        locationTracking: boolean
        pushNotifications: boolean
        autoRefresh: boolean
    }
    storage: {
        clearCache: boolean
        clearCookies: boolean
        clearHistory: boolean
        maxStorage: number
        autoCleanup: boolean
        cleanupInterval: number
    }
    monitoring: {
        performanceTracking: boolean
        errorReporting: boolean
        usageAnalytics: boolean
        crashReports: boolean
        networkMonitoring: boolean
        memoryMonitoring: boolean
    }
    optimization: {
        predictiveLoading: boolean
        smartCaching: boolean
        contentPrioritization: boolean
        resourceBundling: boolean
        codeSplitting: boolean
        treeShaking: boolean
    }
}

export interface AccountSettings {
    personal: {
        displayName: string
        username: string
        email: string
        phone: string
        dateOfBirth: Date
        gender: string
        pronouns: string
        bio: string
        interests: string[]
        location: {
            city: string
            country: string
            coordinates?: {
                latitude: number
                longitude: number
            }
        }
    }
    preferences: {
        language: string
        timezone: string
        currency: string
        dateFormat: string
        timeFormat: '12h' | '24h'
        weekStart: 'sunday' | 'monday'
        measurementSystem: 'metric' | 'imperial'
    }
    subscription: {
        plan: 'free' | 'premium' | 'enterprise'
        status: 'active' | 'inactive' | 'cancelled' | 'expired'
        renewalDate: Date
        billingCycle: 'monthly' | 'yearly'
        paymentMethod: string
        autoRenew: boolean
        features: string[]
    }
    verification: {
        emailVerified: boolean
        phoneVerified: boolean
        ageVerified: boolean
        photoVerified: boolean
        idVerified: boolean
        incomeVerified: boolean
        backgroundCheck: boolean
        professionalVerified: boolean
    }
    limits: {
        dailyLikes: number
        dailyMessages: number
        monthlyEvents: number
        photoUploads: number
        profileViews: number
        searchRadius: number
        ageRange: [number, number]
    }
    status: {
        accountStatus: 'active' | 'suspended' | 'banned' | 'deleted'
        moderationStatus: 'pending' | 'approved' | 'rejected'
        lastLogin: Date
        loginCount: number
        profileCompletion: number
        reputationScore: number
    }
}

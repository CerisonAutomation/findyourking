/**
 * Event Types - Production Implementation
 * Real type definitions for events
 */

export interface Event {
    id: string
    title: string
    description: string
    type: 'party' | 'meetup' | 'event' | 'workshop' | 'conference' | 'festival'
    category: string
    location: {
        name: string
        address: string
        latitude: number
        longitude: number
        city: string
        country: string
    }
    organizer: {
        id: string
        name: string
        avatar?: string
        verified: boolean
        rating: number
        eventsHosted: number
    }
    startTime: Date
    endTime: Date
    maxAttendees: number
    currentAttendees: number
    isOnline: boolean
    isPrivate: boolean
    price?: number
    currency?: string
    tags: string[]
    images: string[]
    requirements?: string[]
    ageRestriction?: number
    dressCode?: string
    weatherBackup?: string
    parking: boolean
    publicTransport: boolean
    accessibility: boolean
    verified: boolean
    featured: boolean
    trending: boolean
    popular: boolean
    capacity: number
    waitlist: boolean
    ticketUrl?: string
    liveStream: boolean
    recordingAllowed: boolean
    cancellationPolicy: string
    refundPolicy: string
    contactInfo: {
        email: string
        phone?: string
        website?: string
    }
    socialLinks: {
        facebook?: string
        instagram?: string
        twitter?: string
        linkedin?: string
    }
    amenities: string[]
    transportation: {
        parkingAvailable: boolean
        publicTransportAccess: boolean
        shuttleService: boolean
    }
    foodAndBeverage: {
        catering: boolean
        bar: boolean
        vegetarian: boolean
        vegan: boolean
        glutenFree: boolean
    }
    entertainment: {
        music: boolean
        dj: boolean
        liveBand: boolean
        performances: boolean
    }
    networking: {
        structured: boolean
        speedDating: boolean
        minglingAreas: boolean
    }
    safety: {
        security: boolean
        firstAid: boolean
        emergencyExits: boolean
        covidProtocols: boolean
    }
    reviews: {
        total: number
        average: number
        distribution: {
            5: number
            4: number
            3: number
            2: number
            1: number
        }
    }
    attendees: Array<{
        id: string
        name: string
        avatar?: string
        verified: boolean
        joinedAt: Date
    }>
    userStatus?: {
        isAttending: boolean
        isWaitlisted: boolean
        isInterested: boolean
        hasTicket: boolean
        joinedAt?: Date
    }
}

export interface EventFilters {
    type: string
    category: string
    priceRange: string
    ageRange: string
    distance: number
    onlineOnly: boolean
    verifiedOnly: boolean
    featuredOnly: boolean
    sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'distance' | 'date'
    sortOrder: 'asc' | 'desc'
}

export interface Profile {
    id: string
    username: string
    bio?: string
    interests: string[]
    age: number
    location?: string
    verified: boolean
    languages: string[]
    last_active?: string
    events_attended?: number
    photos_count?: number
    // Additional profile fields for matching
    relationship_type?: string
    height?: number
    education?: string
    job?: string
    zodiac?: string
    politics?: string
    religion?: string
    exercise?: string
    drinking?: string
    smoking?: string
    kids?: string
    pets?: string
}

export interface CompatibilityScore {
    total: number
    breakdown: Record<string, number>
    reasons: string[]
}

export interface MatchingWeights {
    interests: number
    age_range: number
    location: number
    verified: number
    activity: number
    events: number
    languages: number
    lifestyle: number
    values: number
}

export class AIMatchingEngine {
    private static readonly DEFAULT_WEIGHTS: MatchingWeights = {
        interests: 0.30,
        age_range: 0.15,
        location: 0.20,
        verified: 0.10,
        activity: 0.10,
        events: 0.15,
        languages: 0.05,
        lifestyle: 0.10,
        values: 0.05,
    }

    private static readonly AGE_PREFERENCES = {
        // Age compatibility matrix (age difference -> score)
        0: 1.0,   // Same age
        1: 0.95,  // 1 year difference
        2: 0.90,  // 2 years
        3: 0.85,  // 3 years
        4: 0.80,  // 4 years
        5: 0.75,  // 5 years
        7: 0.60,  // 7 years
        10: 0.40, // 10 years
        15: 0.20, // 15 years
        20: 0.10, // 20 years
    }

    /**
     * Calculate comprehensive compatibility score between two profiles
     */
    static scoreCompatibility(
        profileA: Profile,
        profileB: Profile,
        customWeights?: Partial<MatchingWeights>
    ): CompatibilityScore {
        const weights = {...this.DEFAULT_WEIGHTS, ...customWeights}
        const breakdown: Record<string, number> = {}
        const reasons: string[] = []

        // 1. Interests compatibility (30%)
        const interestsScore = this.calculateInterestsScore(profileA.interests, profileB.interests)
        breakdown.interests = interestsScore * weights.interests
        if (interestsScore > 0.5) {
            reasons.push(`Shared ${this.getSharedInterests(profileA.interests, profileB.interests).length} interests`)
        }

        // 2. Age range compatibility (15%)
        const ageScore = this.calculateAgeScore(profileA.age, profileB.age)
        breakdown.age_range = ageScore * weights.age_range
        if (ageScore > 0.7) {
            reasons.push('Compatible age range')
        }

        // 3. Location proximity (20%)
        const locationScore = this.calculateLocationScore(profileA.location, profileB.location)
        breakdown.location = locationScore * weights.location
        if (locationScore > 0.5 && profileA.location && profileB.location) {
            reasons.push('Nearby locations')
        }

        // 4. Verification status (10%)
        const verifiedScore = this.calculateVerifiedScore(profileA.verified, profileB.verified)
        breakdown.verified = verifiedScore * weights.verified
        if (verifiedScore > 0.5) {
            reasons.push('Verified profiles')
        }

        // 5. Activity level (10%)
        const activityScore = this.calculateActivityScore(profileA.last_active, profileB.last_active)
        breakdown.activity = activityScore * weights.activity
        if (activityScore > 0.7) {
            reasons.push('Both recently active')
        }

        // 6. Events compatibility (15%)
        const eventsScore = this.calculateEventsScore(profileA.events_attended, profileB.events_attended)
        breakdown.events = eventsScore * weights.events
        if (eventsScore > 0.5) {
            reasons.push('Similar event activity')
        }

        // 7. Languages compatibility (5%)
        const languagesScore = this.calculateLanguagesScore(profileA.languages, profileB.languages)
        breakdown.languages = languagesScore * weights.languages
        if (languagesScore > 0.5) {
            reasons.push('Common languages')
        }

        // 8. Lifestyle compatibility (10%)
        const lifestyleScore = this.calculateLifestyleScore(profileA, profileB)
        breakdown.lifestyle = lifestyleScore * weights.lifestyle
        if (lifestyleScore > 0.6) {
            reasons.push('Compatible lifestyle')
        }

        // 9. Values compatibility (5%)
        const valuesScore = this.calculateValuesScore(profileA, profileB)
        breakdown.values = valuesScore * weights.values
        if (valuesScore > 0.6) {
            reasons.push('Shared values')
        }

        // Calculate total score
        const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

        return {
            total: Math.min(100, Math.max(0, total * 100)),
            breakdown,
            reasons: reasons.length > 0 ? reasons : ['Basic compatibility'],
        }
    }

    /**
     * Generate match recommendations for a profile
     */
    static generateMatchRecommendations(
        userProfile: Profile,
        candidateProfiles: Profile[],
        limit: number = 10
    ): Array<{ profile: Profile; score: CompatibilityScore }> {
        const scored = candidateProfiles
            .filter(candidate => candidate.id !== userProfile.id)
            .map(candidate => ({
                profile: candidate,
                score: this.scoreCompatibility(userProfile, candidate),
            }))
            .sort((a, b) => b.score.total - a.score.total)
            .slice(0, limit)

        return scored
    }

    /**
     * Get personalized matching insights
     */
    static getMatchingInsights(userProfile: Profile, matches: Array<{ profile: Profile; score: CompatibilityScore }>): {
        topInterests: string[]
        commonAgeRange: { min: number; max: number }
        locationDensity: string
        averageScore: number
    } {
        const allInterests = matches.flatMap(m => m.profile.interests)
        const interestFrequency = allInterests.reduce((acc, interest) => {
            acc[interest] = (acc[interest] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const topInterests = Object.entries(interestFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([interest]) => interest)

        const ages = matches.map(m => m.profile.age)
        const commonAgeRange = {
            min: Math.min(...ages),
            max: Math.max(...ages),
        }

        const locations = matches.map(m => m.profile.location).filter(Boolean)
        const locationFrequency = locations.reduce((acc, location) => {
            const city = location!.split(',')[0].trim()
            acc[city] = (acc[city] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const locationDensity = Object.entries(locationFrequency)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Various'

        const averageScore = matches.reduce((sum, m) => sum + m.score.total, 0) / matches.length

        return {
            topInterests,
            commonAgeRange,
            locationDensity,
            averageScore,
        }
    }

    /**
     * Calculate interests compatibility based on shared interests
     */
    private static calculateInterestsScore(interestsA: string[], interestsB: string[]): number {
        if (interestsA.length === 0 || interestsB.length === 0) {
            return 0.3 // Neutral score if no interests specified
        }

        const shared = this.getSharedInterests(interestsA, interestsB)
        const totalUnique = new Set([...interestsA, ...interestsB]).size

        if (totalUnique === 0) return 0.3

        // Jaccard similarity: |A ∩ B| / |A ∪ B|
        const jaccardSimilarity = shared.length / totalUnique

        // Boost score for more shared interests
        const sharedBonus = Math.min(shared.length * 0.1, 0.3)

        return Math.min(1, jaccardSimilarity + sharedBonus)
    }

    private static getSharedInterests(interestsA: string[], interestsB: string[]): string[] {
        return interestsA.filter(interest =>
            interestsB.some(bInterest =>
                interest.toLowerCase() === bInterest.toLowerCase()
            )
        )
    }

    /**
     * Calculate age compatibility based on age difference
     */
    private static calculateAgeScore(ageA: number, ageB: number): number {
        const ageDiff = Math.abs(ageA - ageB)

        // Find closest age difference in our matrix
        const ageDiffs = Object.keys(this.AGE_PREFERENCES).map(Number).sort((a, b) => a - b)
        const closestDiff = ageDiffs.find(diff => ageDiff <= diff) || ageDiffs[ageDiffs.length - 1]

        return this.AGE_PREFERENCES[closestDiff as keyof typeof this.AGE_PREFERENCES] || 0.1
    }

    /**
     * Calculate location compatibility (simplified - would use real geolocation in production)
     */
    private static calculateLocationScore(locationA?: string, locationB?: string): number {
        if (!locationA || !locationB) {
            return 0.5 // Neutral score if location not specified
        }

        // Simple string matching - in production use geocoding and distance calculation
        if (locationA.toLowerCase() === locationB.toLowerCase()) {
            return 1.0
        }

        // Check for same city/area
        const cityA = locationA.split(',')[0].trim().toLowerCase()
        const cityB = locationB.split(',')[0].trim().toLowerCase()

        if (cityA === cityB) {
            return 0.8
        }

        // Check for same state/region
        const regionA = locationA.split(',').slice(1).join(',').trim().toLowerCase()
        const regionB = locationB.split(',').slice(1).join(',').trim().toLowerCase()

        if (regionA === regionB && regionA !== '') {
            return 0.6
        }

        return 0.2 // Different locations
    }

    /**
     * Calculate verification status compatibility
     */
    private static calculateVerifiedScore(verifiedA: boolean, verifiedB: boolean): number {
        if (verifiedA && verifiedB) return 1.0
        if (verifiedA || verifiedB) return 0.7
        return 0.3
    }

    /**
     * Calculate activity score based on last active time
     */
    private static calculateActivityScore(lastActiveA?: string, lastActiveB?: string): number {
        if (!lastActiveA || !lastActiveB) {
            return 0.5 // Neutral score if activity data missing
        }

        const now = new Date()
        const daysA = this.getDaysSince(lastActiveA, now)
        const daysB = this.getDaysSince(lastActiveB, now)

        // Score based on recency (more recent = higher score)
        const scoreA = Math.max(0, 1 - daysA / 30) // Decay over 30 days
        const scoreB = Math.max(0, 1 - daysB / 30)

        return (scoreA + scoreB) / 2
    }

    private static getDaysSince(dateString: string, now: Date): number {
        const date = new Date(dateString)
        const diffTime = Math.abs(now.getTime() - date.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    /**
     * Calculate events compatibility based on event attendance
     */
    private static calculateEventsScore(eventsA?: number, eventsB?: number): number {
        if (eventsA === undefined || eventsB === undefined) {
            return 0.5 // Neutral score if data missing
        }

        const total = eventsA + eventsB
        if (total === 0) return 0.3 // Both haven't attended events

        // Similar attendance levels get higher scores
        const diff = Math.abs(eventsA - eventsB)
        const maxEvents = Math.max(eventsA, eventsB)

        if (maxEvents === 0) return 0.3

        const similarity = 1 - (diff / maxEvents)

        // Bonus for active event goers
        const activityBonus = Math.min(total / 20, 0.3)

        return Math.min(1, similarity + activityBonus)
    }

    /**
     * Calculate languages compatibility
     */
    private static calculateLanguagesScore(languagesA: string[], languagesB: string[]): number {
        if (languagesA.length === 0 || languagesB.length === 0) {
            return 0.3 // Neutral score if languages not specified
        }

        const shared = this.getSharedInterests(languagesA, languagesB)

        if (shared.length === 0) return 0.2

        const totalUnique = new Set([...languagesA, ...languagesB]).size
        const jaccardSimilarity = shared.length / totalUnique

        return Math.min(1, jaccardSimilarity + 0.2) // Boost for having shared languages
    }

    /**
     * Calculate lifestyle compatibility
     */
    private static calculateLifestyleScore(profileA: Profile, profileB: Profile): number {
        let score = 0
        let factors = 0

        // Exercise compatibility
        if (profileA.exercise && profileB.exercise) {
            factors++
            if (profileA.exercise === profileB.exercise) score += 1
            else if (this.areCompatibleLifestyle(profileA.exercise, profileB.exercise)) score += 0.7
            else score += 0.3
        }

        // Drinking compatibility
        if (profileA.drinking && profileB.drinking) {
            factors++
            if (profileA.drinking === profileB.drinking) score += 1
            else if (this.areCompatibleLifestyle(profileA.drinking, profileB.drinking)) score += 0.7
            else score += 0.3
        }

        // Smoking compatibility
        if (profileA.smoking && profileB.smoking) {
            factors++
            if (profileA.smoking === profileB.smoking) score += 1
            else if (this.areCompatibleLifestyle(profileA.smoking, profileB.smoking)) score += 0.7
            else score += 0.3
        }

        // Kids compatibility
        if (profileA.kids && profileB.kids) {
            factors++
            if (profileA.kids === profileB.kids) score += 1
            else if (this.areCompatibleKidsPreference(profileA.kids, profileB.kids)) score += 0.8
            else score += 0.2
        }

        return factors > 0 ? score / factors : 0.5
    }

    private static areCompatibleLifestyle(prefA: string, prefB: string): boolean {
        const compatible = {
            'never': ['rarely', 'never'],
            'rarely': ['never', 'rarely', 'socially'],
            'socially': ['rarely', 'socially', 'often'],
            'often': ['socially', 'often', 'very'],
            'very': ['often', 'very'],
        }

        return compatible[prefA as keyof typeof compatible]?.includes(prefB) || false
    }

    private static areCompatibleKidsPreference(prefA: string, prefB: string): boolean {
        const compatible = {
            'no': ['no', 'unsure'],
            'yes': ['yes', 'someday'],
            'someday': ['yes', 'someday', 'unsure'],
            'unsure': ['unsure', 'someday', 'no'],
        }

        return compatible[prefA as keyof typeof compatible]?.includes(prefB) || false
    }

    /**
     * Calculate values compatibility
     */
    private static calculateValuesScore(profileA: Profile, profileB: Profile): number {
        let score = 0
        let factors = 0

        // Politics compatibility
        if (profileA.politics && profileB.politics) {
            factors++
            if (profileA.politics === profileB.politics) score += 1
            else if (this.areCompatiblePolitics(profileA.politics, profileB.politics)) score += 0.6
            else score += 0.2
        }

        // Religion compatibility
        if (profileA.religion && profileB.religion) {
            factors++
            if (profileA.religion === profileB.religion) score += 1
            else if (this.areCompatibleReligion(profileA.religion, profileB.religion)) score += 0.7
            else score += 0.3
        }

        return factors > 0 ? score / factors : 0.5
    }

    private static areCompatiblePolitics(prefA: string, prefB: string): boolean {
        const compatible = {
            'liberal': ['liberal', 'moderate'],
            'moderate': ['liberal', 'moderate', 'conservative'],
            'conservative': ['moderate', 'conservative'],
        }

        return compatible[prefA as keyof typeof compatible]?.includes(prefB) || false
    }

    private static areCompatibleReligion(prefA: string, prefB: string): boolean {
        const compatible = {
            'atheist': ['atheist', 'agnostic'],
            'agnostic': ['atheist', 'agnostic', 'spiritual'],
            'spiritual': ['agnostic', 'spiritual', 'religious'],
            'religious': ['spiritual', 'religious'],
        }

        return compatible[prefA as keyof typeof compatible]?.includes(prefB) || false
    }
}
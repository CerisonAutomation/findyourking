import {createClient} from '@/lib/supabase/client'

const supabase = createClient()

export interface PremiumFeatures {
    superLikes: number
    profileViews: number
    boostDuration: number
    advancedFilters: boolean
    incognitoMode: boolean
    readReceipts: boolean
    unlimitedSwipes: boolean
    prioritySupport: boolean
    exclusiveEvents: boolean
}

export interface SubscriptionPlan {
    id: string
    name: string
    price: number
    duration: number // in months
    features: PremiumFeatures
    stripePriceId: string
    popular?: boolean
}

export interface PremiumUpgrade {
    planId: string
    userId: string
    status: 'pending' | 'active' | 'cancelled' | 'expired'
    startDate?: string
    endDate?: string
    trialEndsAt?: string
}

const subscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic',
        price: 0,
        duration: 1,
        features: {
            superLikes: 5,
            profileViews: 10,
            boostDuration: 0,
            advancedFilters: false,
            incognitoMode: false,
            readReceipts: false,
            unlimitedSwipes: false,
            prioritySupport: false,
            exclusiveEvents: false,
        },
        stripePriceId: '',
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 29.99,
        duration: 1,
        features: {
            superLikes: 50,
            profileViews: 100,
            boostDuration: 30,
            advancedFilters: true,
            incognitoMode: true,
            readReceipts: true,
            unlimitedSwipes: true,
            prioritySupport: true,
            exclusiveEvents: false,
        },
        stripePriceId: 'price_1HdKsRvKsJvZfY2ZfY2',
    },
    {
        id: 'platinum',
        name: 'Platinum',
        price: 49.99,
        duration: 1,
        features: {
            superLikes: 200,
            profileViews: 500,
            boostDuration: 60,
            advancedFilters: true,
            incognitoMode: true,
            readReceipts: true,
            unlimitedSwipes: true,
            prioritySupport: true,
            exclusiveEvents: true,
        },
        stripePriceId: 'price_1JdKsRvKsJvZfY2ZfY2',
    },
]

export class PremiumManager {
    async getUserSubscription(userId: string): Promise<SubscriptionPlan | null> {
        try {
            const {data: subscription} = await supabase
                .from('subscriptions')
                .select(`
          *,
          plan:subscription_plans(*)
        `)
                .eq('user_id', userId)
                .eq('status', 'active')
                .single()

            return subscription?.plan || null
        } catch (error) {
            console.error('Get subscription error:', error)
            return null
        }
    }

    async upgradePlan(userId: string, planId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const plan = subscriptionPlans.find(p => p.id === planId)
            if (!plan) {
                return {success: false, error: 'Invalid plan'}
            }

            const {error} = await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                })

            if (error) throw error

            return {success: true}
        } catch (error) {
            console.error('Upgrade plan error:', error)
            return {success: false, error: error instanceof Error ? error.message : 'Upgrade failed'}
        }
    }

    async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const {error} = await supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .eq('status', 'active')

            if (error) throw error

            return {success: true}
        } catch (error) {
            console.error('Cancel subscription error:', error)
            return {success: false, error: error instanceof Error ? error.message : 'Cancellation failed'}
        }
    }

    async useSuperLike(userId: string, targetUserId: string): Promise<{
        success: boolean;
        remaining: number;
        error?: string
    }> {
        try {
            const {data: subscription} = await this.getUserSubscription(userId)
            const superLikesRemaining = subscription?.features?.superLikes || 5

            if (superLikesRemaining <= 0) {
                return {success: false, remaining: 0, error: 'No super likes remaining'}
            }

            const {error} = await supabase
                .from('super_likes')
                .insert({
                    user_id: userId,
                    target_user_id: targetUserId,
                    created_at: new Date().toISOString(),
                })

            if (error) throw error

            const newRemaining = superLikesRemaining - 1
            await supabase
                .from('user_stats')
                .update({
                    super_likes_remaining: newRemaining,
                })
                .eq('user_id', userId)

            return {success: true, remaining: newRemaining}
        } catch (error) {
            console.error('Super like error:', error)
            return {success: false, remaining: 0, error: error instanceof Error ? error.message : 'Super like failed'}
        }
    }

    async activateBoost(userId: string, duration: number = 30): Promise<{ success: boolean; error?: string }> {
        try {
            const {data: subscription} = await this.getUserSubscription(userId)
            const boostDuration = subscription?.features?.boostDuration || 0

            if (boostDuration > 0) {
                return {success: false, error: 'Boost already active'}
            }

            const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString()

            const {error} = await supabase
                .from('profile_boosts')
                .insert({
                    user_id: userId,
                    expires_at: expiresAt,
                    duration_minutes: duration,
                    created_at: new Date().toISOString(),
                })

            if (error) throw error

            return {success: true}
        } catch (error) {
            console.error('Activate boost error:', error)
            return {success: false, error: error instanceof Error ? error.message : 'Boost activation failed'}
        }
    }

    async viewProfileIncognito(userId: string, targetUserId: string): Promise<{
        success: boolean;
        remaining: number;
        error?: string
    }> {
        try {
            const {data: subscription} = await this.getUserSubscription(userId)
            const profileViews = subscription?.features?.profileViews || 10

            if (profileViews <= 0) {
                return {success: false, remaining: 0, error: 'No profile views remaining'}
            }

            const {error} = await supabase
                .from('profile_views')
                .insert({
                    viewer_id: userId,
                    profile_id: targetUserId,
                    incognito: true,
                    created_at: new Date().toISOString(),
                })

            if (error) throw error

            const newRemaining = profileViews - 1
            await supabase
                .from('user_stats')
                .update({
                    profile_views_remaining: newRemaining,
                })
                .eq('user_id', userId)

            return {success: true, remaining: newRemaining}
        } catch (error) {
            console.error('Incognito view error:', error)
            return {
                success: false,
                remaining: 0,
                error: error instanceof Error ? error.message : 'Incognito view failed'
            }
        }
    }

    async createExclusiveEvent(userId: string, eventData: any): Promise<{ success: boolean; error?: string }> {
        try {
            const {data: subscription} = await this.getUserSubscription(userId)

            if (!subscription?.features?.exclusiveEvents) {
                return {success: false, error: 'Exclusive events require premium subscription'}
            }

            const {error} = await supabase
                .from('events')
                .insert({
                    ...eventData,
                    user_id: userId,
                    is_exclusive: true,
                    created_at: new Date().toISOString(),
                })

            if (error) throw error

            return {success: true}
        } catch (error) {
            console.error('Create exclusive event error:', error)
            return {success: false, error: error instanceof Error ? error.message : 'Event creation failed'}
        }
    }

    async getPremiumFeatures(userId: string): Promise<PremiumFeatures> {
        try {
            const {data: subscription} = await this.getUserSubscription(userId)

            if (subscription) {
                return subscription.features
            }

            return {
                superLikes: 5,
                profileViews: 10,
                boostDuration: 0,
                advancedFilters: false,
                incognitoMode: false,
                readReceipts: false,
                unlimitedSwipes: false,
                prioritySupport: false,
                exclusiveEvents: false,
            }
        } catch (error) {
            console.error('Get premium features error:', error)
            return {
                superLikes: 0,
                profileViews: 0,
                boostDuration: 0,
                advancedFilters: false,
                incognitoMode: false,
                readReceipts: false,
                unlimitedSwipes: false,
                prioritySupport: false,
                exclusiveEvents: false,
            }
        }
    }

    getAvailablePlans(): SubscriptionPlan[] {
        return subscriptionPlans
    }

    async getSubscriptionHistory(userId: string): Promise<PremiumUpgrade[]> {
        try {
            const {data, error} = await supabase
                .from('subscriptions')
                .select(`
          *,
          plan:subscription_plans(*)
        `)
                .eq('user_id', userId)
                .order('created_at', {ascending: false})

            if (error) throw error

            return data || []
        } catch (error) {
            console.error('Get subscription history error:', error)
            return []
        }
    }

    isPremiumUser(features: PremiumFeatures): boolean {
        return features.advancedFilters ||
            features.incognitoMode ||
            features.readReceipts ||
            features.unlimitedSwipes ||
            features.prioritySupport ||
            features.exclusiveEvents
    }
}

export {subscriptionPlans, PremiumManager}
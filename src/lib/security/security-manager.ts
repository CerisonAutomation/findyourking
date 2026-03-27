import {createClient} from '@/lib/supabase/client'
import {z} from 'zod'
import crypto from 'crypto'

const supabase = createClient()

export interface SecurityEvent {
    id: string
    userId: string
    type: 'login' | 'signup' | 'password_change' | 'profile_update' | 'suspicious_activity' | 'violation' | 'report'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    ipAddress: string
    userAgent: string
    location?: string
    metadata?: Record<string, any>
    createdAt: string
}

export interface SecuritySettings {
    userId: string
    twoFactorEnabled: boolean
    loginNotifications: boolean
    profileViewNotifications: boolean
    messageNotifications: boolean
    autoLogoutMinutes: number
    allowedDevices: string[]
    blockedUsers: string[]
    blockedCountries: string[]
    privacyLevel: 'public' | 'friends' | 'private'
}

export interface RiskAssessment {
    userId: string
    riskScore: number // 0-100
    riskFactors: string[]
    recommendations: string[]
    lastAssessed: string
    requiresVerification: boolean
}

const securityEventSchema = z.object({
    type: z.enum(['login', 'signup', 'password_change', 'profile_update', 'suspicious_activity', 'violation', 'report']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().min(1),
    ipAddress: z.string().ip(),
    userAgent: z.string().min(1),
    location: z.string().optional(),
    metadata: z.record(z.any()).optional(),
})

export class SecurityManager {
    async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<string> {
        try {
            const eventId = crypto.randomUUID()

            const {error} = await supabase
                .from('security_events')
                .insert({
                    id: eventId,
                    userId: event.userId,
                    type: event.type,
                    severity: event.severity,
                    description: event.description,
                    ip_address: event.ipAddress,
                    user_agent: event.userAgent,
                    location: event.location,
                    metadata: event.metadata,
                    created_at: new Date().toISOString(),
                })

            if (error) throw error

            return eventId
        } catch (error) {
            console.error('Log security event error:', error)
            throw error
        }
    }

    async assessUserRisk(userId: string): Promise<RiskAssessment> {
        try {
            const {data: events} = await supabase
                .from('security_events')
                .select('*')
                .eq('userId', userId)
                .order('created_at', {ascending: false})
                .limit(50)

            const riskFactors: string[] = []
            let riskScore = 0

            if (!events || events.length === 0) {
                return {
                    userId,
                    riskScore: 50,
                    riskFactors: ['No security history'],
                    recommendations: ['Complete profile verification', 'Enable two-factor authentication'],
                    lastAssessed: new Date().toISOString(),
                    requiresVerification: true,
                }
            }

            const recentEvents = events.filter(e => {
                const eventDate = new Date(e.created_at)
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                return eventDate > thirtyDaysAgo
            })

            const loginEvents = recentEvents.filter(e => e.type === 'login')
            const uniqueIPs = new Set(loginEvents.map(e => e.ip_address))
            const uniqueDevices = new Set(loginEvents.map(e => e.metadata?.deviceFingerprint))

            if (uniqueIPs.size > 5) {
                riskScore += 20
                riskFactors.push('Multiple IP addresses detected')
            }

            if (uniqueDevices.size > 3) {
                riskScore += 15
                riskFactors.push('Multiple devices detected')
            }

            const profileChanges = recentEvents.filter(e => e.type === 'profile_update')
            if (profileChanges.length > 10) {
                riskScore += 10
                riskFactors.push('Frequent profile changes')
            }

            const violations = recentEvents.filter(e => e.type === 'violation' || e.type === 'report')
            if (violations.length > 0) {
                riskScore += violations.length * 15
                riskFactors.push(`${violations.length} security violations reported`)
            }

            const {data: user} = await supabase
                .from('profiles')
                .select('created_at')
                .eq('id', userId)
                .single()

            if (user) {
                const accountAge = Date.now() - new Date(user.created_at).getTime()
                const daysOld = accountAge / (1000 * 60 * 60 * 24)

                if (daysOld < 7) {
                    riskScore += 25
                    riskFactors.push('Very new account')
                } else if (daysOld < 30) {
                    riskScore += 10
                    riskFactors.push('New account')
                }
            }

            const recommendations: string[] = []
            if (riskScore > 60) {
                recommendations.push('Immediate verification required')
                recommendations.push('Enable two-factor authentication')
            } else if (riskScore > 40) {
                recommendations.push('Profile verification recommended')
            }

            return {
                userId,
                riskScore: Math.min(100, Math.max(0, 100 - riskScore)),
                riskFactors,
                recommendations,
                lastAssessed: new Date().toISOString(),
                requiresVerification: riskScore > 40,
            }
        } catch (error) {
            console.error('Risk assessment error:', error)
            return {
                userId,
                riskScore: 50,
                riskFactors: ['Error assessing risk'],
                recommendations: ['Try again later'],
                lastAssessed: new Date().toISOString(),
                requiresVerification: true,
            }
        }
    }

    async getSecuritySettings(userId: string): Promise<SecuritySettings | null> {
        try {
            const {data, error} = await supabase
                .from('security_settings')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (error) throw error

            return data
        } catch (error) {
            console.error('Get security settings error:', error)
            return null
        }
    }
}

export {SecurityManager}
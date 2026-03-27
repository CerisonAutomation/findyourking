import {betterAuth} from 'better-auth'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {db} from '@/lib/db'
import {accounts, sessions, users, verifications} from '@/lib/db/schema'

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-change-in-production',
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            users,
            accounts,
            sessions,
            verifications,
        },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'github'],
        },
    },
    advanced: {
        generateId: false, // Use UUID from database
        crossSubDomainCookies: {
            enabled: false,
        },
    },
})

export type Session = typeof auth.$Infer.Session

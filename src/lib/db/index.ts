/**
 * Database Connection Layer
 * PostgreSQL + Redis with connection pooling and caching
 */

import {drizzle} from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {createClient} from 'redis'
import * as schema from './schema'

// PostgreSQL connection with connection pooling
const connectionString = process.env.POSTGRES_URL!
const client = postgres(connectionString, {
    max: 20, // connection pool size
    idle_timeout: 20,
    connect_timeout: 10
})

export const db = drizzle(client, {schema})

// Redis connection for caching and sessions
export const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
})

// Redis connection with error handling
redis.on('error', (err) => {
    console.error('Redis Client Error:', err)
})

redis.on('connect', () => {
    console.log('Redis Client Connected')
})

// Initialize Redis connection
await redis.connect()

// Cache helpers
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redis.get(key)
            return value ? JSON.parse(value) : null
        } catch {
            return null
        }
    },

    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        try {
            await redis.setEx(key, ttlSeconds, JSON.stringify(value))
        } catch (error) {
            console.error('Cache set error:', error)
        }
    },

    async del(key: string): Promise<void> {
        try {
            await redis.del(key)
        } catch (error) {
            console.error('Cache delete error:', error)
        }
    },

    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await redis.keys(pattern)
            if (keys.length > 0) {
                await redis.del(keys)
            }
        } catch (error) {
            console.error('Cache invalidate pattern error:', error)
        }
    }
}

// Session management
export const sessions = {
    async create(userId: string, sessionId: string, data: any): Promise<void> {
        const key = `session:${sessionId}`
        await cache.set(key, {userId, ...data}, 86400) // 24 hours
        await redis.sAdd(`user_sessions:${userId}`, sessionId)
    },

    async get(sessionId: string): Promise<any> {
        return cache.get(`session:${sessionId}`)
    },

    async update(sessionId: string, data: any): Promise<void> {
        const key = `session:${sessionId}`
        const existing = await cache.get(key)
        if (existing) {
            await cache.set(key, {...existing, ...data}, 86400)
        }
    },

    async delete(sessionId: string, userId?: string): Promise<void> {
        await cache.del(`session:${sessionId}`)
        if (userId) {
            await redis.sRem(`user_sessions:${userId}`, sessionId)
        }
    },

    async invalidateUser(userId: string): Promise<void> {
        const sessionIds = await redis.sMembers(`user_sessions:${userId}`)
        if (sessionIds.length > 0) {
            const keys = sessionIds.map(id => `session:${id}`)
            await redis.del(keys)
            await redis.del(`user_sessions:${userId}`)
        }
    }
}

// Presence management (real-time user status)
export const presence = {
    async setOnline(userId: string): Promise<void> {
        const key = `presence:${userId}`
        await cache.set(key, {
            online: true,
            lastSeen: new Date().toISOString()
        }, 300) // 5 minutes TTL

        await redis.sAdd('online_users', userId)
    },

    async setOffline(userId: string): Promise<void> {
        const key = `presence:${userId}`
        await cache.set(key, {
            online: false,
            lastSeen: new Date().toISOString()
        }, 86400) // 24 hours

        await redis.sRem('online_users', userId)
    },

    async isOnline(userId: string): Promise<boolean> {
        interface PresenceData { online: boolean; lastSeen: string }
        const presence = await cache.get<PresenceData>(`presence:${userId}`)
        return presence?.online || false
    },

    async getOnlineUsers(): Promise<string[]> {
        return redis.sMembers('online_users')
    },

    async setTyping(userId: string, conversationId: string, isTyping: boolean): Promise<void> {
        const key = `typing:${conversationId}:${userId}`
        if (isTyping) {
            await cache.set(key, true, 10) // 10 seconds
        } else {
            await cache.del(key)
        }
    },

    async getTypingUsers(conversationId: string): Promise<string[]> {
        const pattern = `typing:${conversationId}:*`
        const keys = await redis.keys(pattern)
        return keys.map(key => key.split(':')[2])
    }
}

// Rate limiting
export const rateLimit = {
    async check(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
        const current = await redis.incr(key)
        if (current === 1) {
            await redis.expire(key, windowSeconds)
        }

        return {
            allowed: current <= limit,
            remaining: Math.max(0, limit - current)
        }
    }
}

export default db
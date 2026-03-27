/**
 * Matches API Route
 * Simplified to work with existing Drizzle schema
 */

import {NextRequest, NextResponse} from 'next/server'
import {and, desc, eq} from 'drizzle-orm'
import {db} from '@/lib/db'
import {matches, profiles, users} from '@/lib/db/schema'
import {z} from 'zod'

const matchesQuerySchema = z.object({
    type: z.enum(['all', 'mutual', 'sent', 'received']).default('all'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
})

// GET - Get matches for current user
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const {searchParams} = new URL(request.url)
        const filters = matchesQuerySchema.parse({
            type: searchParams.get('type') || 'all',
            page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
            limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
        })

        const offset = (filters.page - 1) * filters.limit

        let query = db
            .select({
                id: matches.id,
                userId: matches.userId,
                targetUserId: matches.targetUserId,
                direction: matches.direction,
                isMatch: matches.isMatch,
                matchedAt: matches.matchedAt,
                createdAt: matches.createdAt,
                targetProfile: {
                    displayName: profiles.displayName,
                    bio: profiles.bio,
                    avatarUrl: profiles.avatarUrl,
                    birthDate: profiles.birthDate
                },
                targetUser: {
                    username: users.username,
                    isVerified: users.isVerified
                }
            })
            .from(matches)
            .innerJoin(profiles, eq(matches.targetUserId, profiles.userId))
            .innerJoin(users, eq(matches.targetUserId, users.id))

        // Apply filters
        if (filters.type === 'mutual') {
            query = query.where(
                and(
                    eq(matches.userId, userId),
                    eq(matches.isMatch, true)
                )
            ).orderBy(desc(matches.matchedAt)).limit(filters.limit).offset(offset)
        } else if (filters.type === 'sent') {
            query = query.where(
                and(
                    eq(matches.userId, userId),
                    eq(matches.direction, 'right')
                )
            ).orderBy(desc(matches.createdAt)).limit(filters.limit).offset(offset)
        } else if (filters.type === 'received') {
            // For received, join on userId instead of targetUserId
            query = db
                .select({
                    id: matches.id,
                    userId: matches.userId,
                    targetUserId: matches.targetUserId,
                    direction: matches.direction,
                    isMatch: matches.isMatch,
                    createdAt: matches.createdAt,
                    sourceProfile: {
                        displayName: profiles.displayName,
                        bio: profiles.bio,
                        avatarUrl: profiles.avatarUrl
                    },
                    sourceUser: {
                        username: users.username,
                        isVerified: users.isVerified
                    }
                })
                .from(matches)
                .innerJoin(profiles, eq(matches.userId, profiles.userId))
                .innerJoin(users, eq(matches.userId, users.id))
                .where(
                    and(
                        eq(matches.targetUserId, userId),
                        eq(matches.direction, 'right'),
                        eq(matches.isMatch, false)
                    )
                )
                .limit(filters.limit)
                .offset(offset)
                .orderBy(desc(matches.createdAt))
        } else {
            query = query.where(eq(matches.userId, userId))
                .orderBy(desc(matches.createdAt)).limit(filters.limit).offset(offset)
        }

        const results = await query

        return NextResponse.json({
            matches: results,
            page: filters.page,
            limit: filters.limit,
            hasMore: results.length === filters.limit
        })
    } catch (error) {
        console.error('Matches API error:', error)
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

/**
 * Profiles API Route
 * Replacing Supabase with PostgreSQL + Drizzle
 */

import {NextRequest, NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {and, eq, ilike, or, not, inArray, sql} from 'drizzle-orm'
import {db} from '@/lib/db'
import {profiles, users} from '@/lib/db/schema'
import {z} from 'zod'

const profileSearchSchema = z.object({
    query: z.string().optional(),
    min_age: z.number().min(18).max(100).optional(),
    max_age: z.number().min(18).max(100).optional(),
    max_distance: z.number().min(0).max(500).optional(),
    interests: z.array(z.string()).optional(),
    verified_only: z.boolean().default(false),
    online_only: z.boolean().default(false),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20)
})

const profileUpdateSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(1000).optional(),
    avatarUrl: z.string().url().optional(),
    birthDate: z.string().datetime().optional(),
    gender: z.enum(['male', 'female', 'non_binary', 'other']).optional(),
    location: z.string().optional(),
    interests: z.array(z.string()).optional(),
    lookingFor: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    work: z.string().max(200).optional(),
    education: z.string().max(200).optional(),
    height: z.number().min(100).max(300).optional(),
    bodyType: z.string().max(50).optional(),
    relationshipStatus: z.string().max(50).optional(),
    drinking: z.string().max(50).optional(),
    smoking: z.string().max(50).optional(),
    showOnlineStatus: z.boolean().optional(),
    showDistance: z.boolean().optional(),
    showAge: z.boolean().optional(),
    allowMessagesFrom: z.enum(['everyone', 'matches_only', 'nobody']).optional(),
    maxDistance: z.number().min(0).max(500).optional(),
    ageRangeMin: z.number().min(18).max(100).optional(),
    ageRangeMax: z.number().min(18).max(100).optional()
})

// GET - Search profiles
export async function GET(request: NextRequest) {
    try {
        // Use header-based auth temporarily
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const {searchParams} = new URL(request.url)
        const filters = profileSearchSchema.parse({
            query: searchParams.get('query') || undefined,
            min_age: searchParams.get('min_age') ? Number(searchParams.get('min_age')) : undefined,
            max_age: searchParams.get('max_age') ? Number(searchParams.get('max_age')) : undefined,
            max_distance: searchParams.get('max_distance') ? Number(searchParams.get('max_distance')) : undefined,
            interests: searchParams.get('interests') ? searchParams.get('interests')!.split(',') : undefined,
            verified_only: searchParams.get('verified_only') === 'true',
            online_only: searchParams.get('online_only') === 'true',
            page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
            limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
        })

        // Build query
        const conditions: any[] = [
            eq(users.isActive, true),
            not(eq(profiles.userId, userId)) // Don't show self
        ]

        if (filters.query) {
            conditions.push(
                ilike(profiles.displayName, `%${filters.query}%`)
            )
        }

        if (filters.verified_only) {
            conditions.push(eq(users.isVerified, true))
        }

        if (filters.online_only) {
            // TODO: Check Redis for online users
            // For now, skip this filter
        }

        if (filters.interests && filters.interests.length > 0) {
            conditions.push(
                // JSON contains any of the interests
                sql`${profiles.interests} ?| ${JSON.stringify(filters.interests)}`
            )
        }

        const offset = (filters.page - 1) * filters.limit

        const results = await db
            .select({
                id: profiles.id,
                userId: profiles.userId,
                displayName: profiles.displayName,
                bio: profiles.bio,
                avatarUrl: profiles.avatarUrl,
                birthDate: profiles.birthDate,
                gender: profiles.gender,
                location: profiles.location,
                interests: profiles.interests,
                verified: users.isVerified,
                isPremium: profiles.isPremium,
                username: users.username,
                userActive: users.isActive
            })
            .from(profiles)
            .leftJoin(users, eq(profiles.userId, users.id))
            .where(and(...conditions))
            .limit(filters.limit)
            .offset(offset)
            .orderBy(profiles.updatedAt)

        const response = {
            profiles: results,
            page: filters.page,
            limit: filters.limit,
            hasMore: results.length === filters.limit
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Profile search error:', error)
        return NextResponse.json(
            {error: 'Failed to search profiles'},
            {status: 500}
        )
    }
}

// PATCH - Update profile
export async function PATCH(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const body = await request.json()
        const rawUpdates = profileUpdateSchema.parse(body)

        // Convert birthDate string to Date if present
        const updates: any = {...rawUpdates}
        if (rawUpdates.birthDate) {
            updates.birthDate = new Date(rawUpdates.birthDate)
        }

        // Update profile
        const updatedProfile = await db
            .update(profiles)
            .set({
                ...updates,
                updatedAt: new Date()
            })
            .where(eq(profiles.userId, userId))
            .returning()

        if (updatedProfile.length === 0) {
            return NextResponse.json({error: 'Profile not found'}, {status: 404})
        }

        return NextResponse.json({
            success: true,
            profile: updatedProfile[0]
        })
    } catch (error) {
        console.error('Profile update error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: 'Invalid input', details: error.issues},
                {status: 400}
            )
        }

        return NextResponse.json(
            {error: 'Failed to update profile'},
            {status: 500}
        )
    }
}
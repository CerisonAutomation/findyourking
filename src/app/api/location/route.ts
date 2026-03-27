/**
 * Location API Route
 * Simplified to work with existing Drizzle schema
 */

import {NextRequest, NextResponse} from 'next/server'
import {and, desc, eq} from 'drizzle-orm'
import {db} from '@/lib/db'
import {userLocations, profiles, users} from '@/lib/db/schema'
import {z} from 'zod'

const updateLocationSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional()
})

// POST - Update user location
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const body = await request.json()
        const {latitude, longitude, accuracy} = updateLocationSchema.parse(body)

        // Insert new location record
        const [location] = await db
            .insert(userLocations)
            .values({
                userId,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                accuracy: accuracy || null
            })
            .returning()

        return NextResponse.json({
            success: true,
            location
        })
    } catch (error) {
        console.error('Location API error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: 'Invalid input', details: error.issues},
                {status: 400}
            )
        }

        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

// GET - Get nearby users
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const {searchParams} = new URL(request.url)
        const radius = Number(searchParams.get('radius')) || 50 // km
        const limit = Number(searchParams.get('limit')) || 20

        // Get current user's latest location
        const userLocation = await db
            .select()
            .from(userLocations)
            .where(eq(userLocations.userId, userId))
            .orderBy(desc(userLocations.timestamp))
            .limit(1)

        if (userLocation.length === 0) {
            return NextResponse.json({
                users: [],
                message: 'No location data available'
            })
        }

        // Get all other users' latest locations with their profiles
        const nearbyUsers = await db
            .select({
                location: userLocations,
                profile: {
                    displayName: profiles.displayName,
                    bio: profiles.bio,
                    avatarUrl: profiles.avatarUrl
                },
                user: {
                    id: users.id,
                    username: users.username,
                    isVerified: users.isVerified
                }
            })
            .from(userLocations)
            .innerJoin(profiles, eq(userLocations.userId, profiles.userId))
            .innerJoin(users, eq(userLocations.userId, users.id))
            .where(
                and(
                    eq(userLocations.userId, userId),
                    // Simple approximation: within radius would need proper geospatial query
                    // For now, return recent locations
                )
            )
            .limit(limit)

        return NextResponse.json({
            users: nearbyUsers,
            radius,
            count: nearbyUsers.length
        })
    } catch (error) {
        console.error('Get nearby users error:', error)
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

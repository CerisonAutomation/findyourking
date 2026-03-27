/**
 * Events API Route
 * Simplified to match database schema
 */

import {NextRequest, NextResponse} from 'next/server'
import {db} from '@/lib/db'
import {events, users} from '@/lib/db/schema'
import {and, eq, gte, lte, ilike, or} from 'drizzle-orm'
import {z} from 'zod'

const eventsQuerySchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
})

const createEventSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    category: z.enum(['social', 'party', 'meetup', 'festival', 'online']),
    location: z.string(), // JSON string
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    capacity: z.number().min(1).max(10000),
    price: z.number().min(0).default(0),
    imageUrl: z.string().url().optional(),
    isPublic: z.boolean().default(true),
    tags: z.array(z.string()).max(10).default([])
})

// GET - List events
export async function GET(request: NextRequest) {
    try {
        const {searchParams} = new URL(request.url)
        const filters = eventsQuerySchema.parse({
            category: searchParams.get('category') || undefined,
            search: searchParams.get('search') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            page: searchParams.get('page') || 1,
            limit: searchParams.get('limit') || 20
        })

        const conditions: any[] = []

        if (filters.category) {
            conditions.push(eq(events.category, filters.category as any))
        }

        if (filters.search) {
            conditions.push(
                or(
                    ilike(events.title, `%${filters.search}%`),
                    ilike(events.description, `%${filters.search}%`)
                )
            )
        }

        if (filters.startDate) {
            conditions.push(gte(events.startDate, new Date(filters.startDate)))
        }

        if (filters.endDate) {
            conditions.push(lte(events.endDate, new Date(filters.endDate)))
        }

        const offset = (filters.page - 1) * filters.limit

        const results = await db
            .select({
                id: events.id,
                title: events.title,
                description: events.description,
                category: events.category,
                location: events.location,
                startDate: events.startDate,
                endDate: events.endDate,
                capacity: events.capacity,
                currentAttendees: events.currentAttendees,
                price: events.price,
                imageUrl: events.imageUrl,
                isPublic: events.isPublic,
                tags: events.tags,
                createdAt: events.createdAt,
                organizerId: events.organizerId,
                organizer: {
                    id: users.id,
                    username: users.username
                }
            })
            .from(events)
            .leftJoin(users, eq(events.organizerId, users.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(filters.limit)
            .offset(offset)
            .orderBy(events.startDate)

        return NextResponse.json({
            events: results,
            page: filters.page,
            limit: filters.limit,
            hasMore: results.length === filters.limit
        })
    } catch (error) {
        console.error('Events API error:', error)
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

// POST - Create event
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const body = await request.json()
        const rawData = createEventSchema.parse(body)

        // Convert dates and map to DB field names
        const eventData = {
            title: rawData.title,
            description: rawData.description,
            category: rawData.category,
            location: rawData.location,
            startDate: new Date(rawData.startDate),
            endDate: rawData.endDate ? new Date(rawData.endDate) : undefined,
            capacity: rawData.capacity,
            price: rawData.price.toString(), // Decimal field needs string
            imageUrl: rawData.imageUrl,
            isPublic: rawData.isPublic,
            tags: rawData.tags
        }

        const [event] = await db
            .insert(events)
            .values({
                title: eventData.title,
                description: eventData.description,
                category: eventData.category as any,
                location: eventData.location,
                startDate: eventData.startDate,
                endDate: eventData.endDate,
                capacity: eventData.capacity,
                price: eventData.price,
                imageUrl: eventData.imageUrl,
                isPublic: eventData.isPublic,
                tags: eventData.tags,
                organizerId: userId,
                currentAttendees: 0
            })
            .returning()

        return NextResponse.json(event)
    } catch (error) {
        console.error('Events POST API error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: 'Invalid input', details: error.issues},
                {status: 400}
            )
        }

        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

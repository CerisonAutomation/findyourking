/**
 * Swipes API Route
 * Handles swipe actions (like, pass, super_like) and match creation
 */

import {NextRequest, NextResponse} from 'next/server'
import {and, eq, or} from 'drizzle-orm'
import {db} from '@/lib/db'
import {matches, conversations} from '@/lib/db/schema'
import {z} from 'zod'

const swipeSchema = z.object({
    target_id: z.string().uuid(),
    direction: z.enum(['like', 'pass', 'super_like'])
})

// POST - Record a swipe action
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const body = await request.json()
        const {target_id, direction} = swipeSchema.parse(body)

        // Don't allow swiping on yourself
        if (userId === target_id) {
            return NextResponse.json(
                {error: 'Cannot swipe on yourself'},
                {status: 400}
            )
        }

        // Check if already swiped
        const existingSwipe = await db.query.matches.findFirst({
            where: and(
                eq(matches.userId, userId),
                eq(matches.targetUserId, target_id)
            )
        })

        if (existingSwipe) {
            return NextResponse.json(
                {error: 'Already swiped on this user'},
                {status: 409}
            )
        }

        // Map direction to match_direction enum
        const directionMap = {
            like: 'right',
            pass: 'left',
            super_like: 'up'
        } as const

        // Record the swipe
        const [newMatch] = await db
            .insert(matches)
            .values({
                userId,
                targetUserId: target_id,
                direction: directionMap[direction],
                isMatch: false
            })
            .returning()

        // Check for mutual match (they liked us back)
        const mutualSwipe = await db.query.matches.findFirst({
            where: and(
                eq(matches.userId, target_id),
                eq(matches.targetUserId, userId),
                or(
                    eq(matches.direction, 'right'),
                    eq(matches.direction, 'up')
                )
            )
        })

        let isMatch = false
        let conversation = null

        if (mutualSwipe && (direction === 'like' || direction === 'super_like')) {
            // It's a match!
            isMatch = true

            // Update both records to mark as matched
            await db
                .update(matches)
                .set({isMatch: true, matchedAt: new Date()})
                .where(
                    or(
                        eq(matches.id, newMatch.id),
                        eq(matches.id, mutualSwipe.id)
                    )
                )

            // Create conversation
            const [newConversation] = await db
                .insert(conversations)
                .values({
                    participantAId: userId,
                    participantBId: target_id,
                    isActive: true
                })
                .returning()

            conversation = newConversation
        }

        return NextResponse.json({
            success: true,
            match: {
                ...newMatch,
                isMatch
            },
            conversation,
            message: isMatch ? "It's a match!" : 'Swipe recorded'
        })
    } catch (error) {
        console.error('Swipe error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: 'Invalid input', details: error.issues},
                {status: 400}
            )
        }

        return NextResponse.json(
            {error: 'Failed to record swipe'},
            {status: 500}
        )
    }
}

// GET - Get user's swipe history and matches
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const {searchParams} = new URL(request.url)
        const type = searchParams.get('type') || 'all' // all, matches, sent

        let query
        if (type === 'matches') {
            // Get mutual matches
            query = await db.query.matches.findMany({
                where: and(
                    eq(matches.userId, userId),
                    eq(matches.isMatch, true)
                ),
                with: {
                    targetUser: true
                },
                orderBy: (matches, {desc}) => [desc(matches.matchedAt)]
            })
        } else if (type === 'sent') {
            // Get swipes sent by user
            query = await db.query.matches.findMany({
                where: eq(matches.userId, userId),
                with: {
                    targetUser: true
                },
                orderBy: (matches, {desc}) => [desc(matches.createdAt)]
            })
        } else {
            // Get all - both sent and received
            const sent = await db.query.matches.findMany({
                where: eq(matches.userId, userId),
                with: {
                    targetUser: true
                }
            })

            const received = await db.query.matches.findMany({
                where: eq(matches.targetUserId, userId),
                with: {
                    user: true
                }
            })

            return NextResponse.json({
                sent,
                received,
                total: sent.length + received.length
            })
        }

        return NextResponse.json({matches: query})
    } catch (error) {
        console.error('Get swipes error:', error)
        return NextResponse.json(
            {error: 'Failed to get swipes'},
            {status: 500}
        )
    }
}

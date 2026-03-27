/**
 * Messages API Route
 * Enhanced with P2P support and caching
 */

import {NextRequest, NextResponse} from 'next/server'
import {and, desc, eq, gt, or, sql} from 'drizzle-orm'
import {db} from '@/lib/db'
import {conversations, messages, users, profiles} from '@/lib/db/schema'
import {z} from 'zod'

const sendMessageSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(2000),
    type: z.enum(['text', 'image', 'voice', 'video']).default('text'),
    attachments: z.array(z.string().url()).max(5).optional()
})

const conversationFilterSchema = z.object({
    unread_only: z.boolean().default(false),
    search: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20)
})

// GET - Get conversations
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const {searchParams} = new URL(request.url)
        const filters = conversationFilterSchema.parse({
            unread_only: searchParams.get('unread_only') === 'true',
            search: searchParams.get('search') || undefined,
            page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
            limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
        })

        // Build query
        const conditions: any[] = [
            or(
                eq(conversations.participantAId, userId),
                eq(conversations.participantBId, userId)
            ),
            eq(conversations.isActive, true)
        ]

        if (filters.unread_only) {
            conditions.push(
                or(
                    and(
                        eq(conversations.participantAId, userId),
                        gt(conversations.unreadCountA, 0)
                    ),
                    and(
                        eq(conversations.participantBId, userId),
                        gt(conversations.unreadCountB, 0)
                    )
                )
            )
        }

        const offset = (filters.page - 1) * filters.limit

        const results = await db
            .select({
                id: conversations.id,
                participantAId: conversations.participantAId,
                participantBId: conversations.participantBId,
                lastMessageAt: conversations.lastMessageAt,
                lastMessagePreview: conversations.lastMessagePreview,
                unreadCount: sql<number>`
                    CASE
                        WHEN ${conversations.participantAId} = ${userId}
                        THEN ${conversations.unreadCountA}
                        ELSE ${conversations.unreadCountB}
                    END
                `,
                isActive: conversations.isActive,
                createdAt: conversations.createdAt
            })
            .from(conversations)
            .where(and(...conditions))
            .limit(filters.limit)
            .offset(offset)
            .orderBy(desc(conversations.lastMessageAt))

        const response = {
            conversations: results,
            page: filters.page,
            limit: filters.limit,
            hasMore: results.length === filters.limit
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Get conversations error:', error)
        return NextResponse.json(
            {error: 'Failed to get conversations'},
            {status: 500}
        )
    }
}

// POST - Send message
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const body = await request.json()
        const {conversationId, content, type, attachments} = sendMessageSchema.parse(body)

        // Verify conversation access
        const conversation = await db
            .select()
            .from(conversations)
            .where(and(
                eq(conversations.id, conversationId),
                or(
                    eq(conversations.participantAId, userId),
                    eq(conversations.participantBId, userId)
                ),
                eq(conversations.isActive, true)
            ))
            .limit(1)

        if (conversation.length === 0) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404})
        }

        const conv = conversation[0]
        const otherUserId = conv.participantAId === userId
            ? conv.participantBId
            : conv.participantAId

        // Create message
        const [newMessage] = await db
            .insert(messages)
            .values({
                conversationId,
                senderId: userId,
                content,
                type,
                attachments: attachments || []
            })
            .returning()

        // Update conversation
        const updateData: any = {
            lastMessageAt: new Date(),
            lastMessagePreview: content.length > 100 ? content.substring(0, 100) + '...' : content
        }

        if (conv.participantAId === userId) {
            updateData.unreadCountB = sql`${conversations.unreadCountB} + 1`
        } else {
            updateData.unreadCountA = sql`${conversations.unreadCountA} + 1`
        }

        await db
            .update(conversations)
            .set(updateData)
            .where(eq(conversations.id, conversationId))

        return NextResponse.json({
            success: true,
            message: newMessage
        })
    } catch (error) {
        console.error('Send message error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {error: 'Invalid input', details: error.issues},
                {status: 400}
            )
        }

        return NextResponse.json(
            {error: 'Failed to send message'},
            {status: 500}
        )
    }
}
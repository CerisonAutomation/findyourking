import {z} from 'zod'

// Shared constants
export const MIN_CONTENT_LENGTH = 1
export const MAX_CONTENT_LENGTH = 2000
export const MAX_ATTACHMENTS = 5

// Message schemas
export const messageContentSchema = z.object({
    content: z.string()
        .min(MIN_CONTENT_LENGTH, 'Message cannot be empty')
        .max(MAX_CONTENT_LENGTH, `Message must be no more than ${MAX_CONTENT_LENGTH} characters`),
    attachments: z.array(z.string().url('Invalid attachment URL'))
        .max(MAX_ATTACHMENTS, `Maximum ${MAX_ATTACHMENTS} attachments allowed`)
        .optional(),
})

export const sendMessageSchema = messageContentSchema.extend({
    conversation_id: z.string().uuid('Invalid conversation ID'),
})

export const createConversationSchema = z.object({
    participant_id: z.string().uuid('Invalid participant ID'),
    initial_message: z.string()
        .min(MIN_CONTENT_LENGTH, 'Initial message cannot be empty')
        .max(MAX_CONTENT_LENGTH, `Message must be no more than ${MAX_CONTENT_LENGTH} characters`)
        .optional(),
})

export const conversationFilterSchema = z.object({
    unread_only: z.boolean().default(false),
    search: z.string()
        .min(1, 'Search term must be at least 1 character')
        .max(100, 'Search term too long')
        .optional(),
})

// Export types
export type MessageContentInput = z.infer<typeof messageContentSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type ConversationFilterInput = z.infer<typeof conversationFilterSchema>
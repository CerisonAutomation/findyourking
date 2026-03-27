/**
 * Service Types - Consolidated Service Type Definitions
 * Type definitions for service layer
 */

export interface ProfileData {
    id: string
    username: string
    bio?: string
    interests: string[]
    age: number
    location?: string
    verified: boolean
    avatar_url?: string
    created_at: string
    last_active?: string
}

export interface MessageData {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    attachments?: string[]
    type: 'text' | 'image' | 'file'
    created_at: string
    read_at?: string
}

export interface EventData {
    id: string
    title: string
    description?: string
    location?: string
    date: string
    capacity: number
    category: 'social' | 'party' | 'meetup' | 'festival' | 'online'
    created_by: string
    attendees_count: number
}

export interface ReportData {
    id: string
    type: 'user' | 'message' | 'event'
    reason: string
    description: string
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
    created_at: string
    priority: 'low' | 'medium' | 'high'
}
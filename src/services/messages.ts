import {createClient} from '@/lib/supabase/client'
import type {Database} from '@/types/supabase'

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']
type Conversation = Database['public']['Tables']['conversations']['Row']
type ConversationInsert = Database['public']['Tables']['conversations']['Insert']

export interface ConversationWithLastMessage extends Conversation {
    lastMessage?: Message
    otherUser?: {
        id: string
        full_name: string | null
        avatar_url: string | null
    }
}

export class MessagesService {
    private supabase = createClient()

    async getConversation(id: string): Promise<Conversation | null> {
        const {data, error} = await this.supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async getConversations(userId: string): Promise<ConversationWithLastMessage[]> {
        const {data, error} = await this.supabase
            .from('conversations')
            .select(`
                *,
                user1_profile:profiles!conversations_user1_id_fkey(id, full_name, avatar_url),
                user2_profile:profiles!conversations_user2_id_fkey(id, full_name, avatar_url),
                last_message:messages!inner(*)
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('last_message_at', {ascending: false})

        if (error) throw error

        return (data || []).map((conv) => {
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
            const otherUser = conv.user1_id === userId ? conv.user2_profile : conv.user1_profile

            return {
                ...conv,
                otherUser: otherUser || undefined,
                lastMessage: conv.last_message?.[0] || undefined,
            }
        })
    }

    async createConversation(
        user1Id: string,
        user2Id: string
    ): Promise<Conversation> {
        // Check if conversation already exists
        const {data: existing} = await this.supabase
            .from('conversations')
            .select('*')
            .or(
                `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
            )
            .single()

        if (existing) return existing

        const {data, error} = await this.supabase
            .from('conversations')
            .insert({
                user1_id: user1Id,
                user2_id: user2Id,
                last_message_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async getMessages(
        conversationId: string,
        limit = 50,
        before?: string
    ): Promise<Message[]> {
        let query = this.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', {ascending: false})
            .limit(limit)

        if (before) {
            query = query.lt('created_at', before)
        }

        const {data, error} = await query

        if (error) throw error
        return (data || []).reverse()
    }

    async sendMessage(message: MessageInsert): Promise<Message> {
        const {data, error} = await this.supabase
            .from('messages')
            .insert(message)
            .select()
            .single()

        if (error) throw error

        // Update conversation last_message_at
        await this.supabase
            .from('conversations')
            .update({last_message_at: new Date().toISOString()})
            .eq('id', message.conversation_id)

        return data
    }

    async markAsRead(conversationId: string, userId: string): Promise<void> {
        const {error} = await this.supabase
            .from('messages')
            .update({is_read: true})
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false)

        if (error) throw error
    }

    async getUnreadCount(userId: string): Promise<number> {
        // Get all conversations for this user
        const {data: conversations} = await this.supabase
            .from('conversations')
            .select('id')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

        if (!conversations) return 0

        const conversationIds = conversations.map((c) => c.id)

        const {count, error} = await this.supabase
            .from('messages')
            .select('*', {count: 'exact', head: true})
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .eq('is_read', false)

        if (error) throw error
        return count || 0
    }

    async deleteMessage(messageId: string): Promise<void> {
        const {error} = await this.supabase
            .from('messages')
            .delete()
            .eq('id', messageId)

        if (error) throw error
    }

    subscribeToMessages(
        conversationId: string,
        onMessage: (message: Message) => void
    ) {
        return this.supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    onMessage(payload.new as Message)
                }
            )
            .subscribe()
    }

    subscribeToConversations(
        userId: string,
        onUpdate: (conversation: Conversation) => void
    ) {
        return this.supabase
            .channel(`conversations:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                (payload) => {
                    onUpdate(payload.new as Conversation)
                }
            )
            .subscribe()
    }
}

export const messagesService = new MessagesService()

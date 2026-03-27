import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {RealtimeChannel} from '@supabase/supabase-js'

const supabase = createClient()

export interface RealtimeEvent {
    type: 'user_status' | 'message' | 'match' | 'typing' | 'location_update' | 'reaction'
    data: any
    userId?: string
    timestamp: number
}

export interface TypingIndicator {
    userId: string
    isTyping: boolean
    lastSeen: number
}

export interface PresenceUser {
    id: string
    status: 'online' | 'away' | 'busy' | 'invisible'
    lastSeen: string
    location?: {
        lat: number
        lng: number
        city?: string
    }
    activity?: string
}

export class RealtimeManager {
    private channels: Map<string, RealtimeChannel> = new Map()
    private typingIndicators: Map<string, TypingIndicator> = new Map()
    private presenceCallbacks: Set<(users: PresenceUser[]) => void> = new Set()
    private messageCallbacks: Set<(message: any) => void> = new Set()
    private typingCallbacks: Set<(typing: TypingIndicator[]) => void> = new Set()

    // Presence management
    async subscribeToPresence(userId: string): Promise<RealtimeChannel> {
        try {
            const channelName = `presence:${userId}`

            if (this.channels.has(channelName)) {
                return this.channels.get(channelName)!
            }

            const channel = supabase
                .channel(channelName)
                .on('presence', {event: 'sync'}, (payload) => {
                    this.handlePresenceUpdate(payload)
                })
                .on('broadcast', {event: 'location_update'}, (payload) => {
                    this.handleLocationUpdate(payload)
                })

            const subscription = await channel.subscribe()

            this.channels.set(channelName, channel)
            return channel
        } catch (error) {
            console.error('Presence subscription error:', error)
            throw error
        }
    }

    async subscribeToMessages(conversationId: string): Promise<RealtimeChannel> {
        try {
            const channelName = `messages:${conversationId}`

            if (this.channels.has(channelName)) {
                return this.channels.get(channelName)!
            }

            const channel = supabase
                .channel(channelName)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                }, (payload) => {
                    this.handleNewMessage(payload)
                })
                .on('broadcast', {event: 'typing'}, (payload) => {
                    this.handleTypingIndicator(payload)
                })

            const subscription = await channel.subscribe()

            this.channels.set(channelName, channel)
            return channel
        } catch (error) {
            console.error('Message subscription error:', error)
            throw error
        }
    }

    async subscribeToMatches(userId: string): Promise<RealtimeChannel> {
        try {
            const channelName = `matches:${userId}`

            if (this.channels.has(channelName)) {
                return this.channels.get(channelName)!
            }

            const channel = supabase
                .channel(channelName)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                    filter: `user_id=eq.${userId}`
                }, (payload) => {
                    this.handleNewMatch(payload)
                })

            const subscription = await channel.subscribe()

            this.channels.set(channelName, channel)
            return channel
        } catch (error) {
            console.error('Match subscription error:', error)
            throw error
        }
    }

    async broadcastPresence(userId: string, presence: Partial<PresenceUser>): Promise<void> {
        try {
            const channel = this.channels.get(`presence:${userId}`)
            if (!channel) return

            await channel.send({
                type: 'broadcast',
                event: 'presence_update',
                payload: {
                    userId,
                    ...presence,
                    timestamp: Date.now(),
                }
            })
        } catch (error) {
            console.error('Broadcast presence error:', error)
        }
    }

    async broadcastTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
        try {
            const channel = this.channels.get(`messages:${conversationId}`)
            if (!channel) return

            // Update local typing indicator
            this.typingIndicators.set(userId, {
                userId,
                isTyping,
                lastSeen: Date.now(),
            })

            await channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: {
                    userId,
                    isTyping,
                    conversationId,
                    timestamp: Date.now(),
                }
            })

            // Notify typing callbacks
            this.notifyTypingCallbacks()
        } catch (error) {
            console.error('Broadcast typing error:', error)
        }
    }

    async sendMessage(conversationId: string, message: any): Promise<void> {
        try {
            const channel = this.channels.get(`messages:${conversationId}`)
            if (!channel) return

            await channel.send({
                type: 'broadcast',
                event: 'new_message',
                payload: {
                    ...message,
                    timestamp: Date.now(),
                }
            })
        } catch (error) {
            console.error('Send message error:', error)
        }
    }

    async broadcastLocation(userId: string, location: { lat: number; lng: number; city?: string }): Promise<void> {
        try {
            const channel = this.channels.get(`presence:${userId}`)
            if (!channel) return

            await channel.send({
                type: 'broadcast',
                event: 'location_update',
                payload: {
                    userId,
                    location,
                    timestamp: Date.now(),
                }
            })
        } catch (error) {
            console.error('Broadcast location error:', error)
        }
    }

    unsubscribe(channelName: string): void {
        const channel = this.channels.get(channelName)
        if (channel) {
            channel.unsubscribe()
            this.channels.delete(channelName)
        }
    }

    unsubscribeAll(): void {
        this.channels.forEach((channel, name) => {
            channel.unsubscribe()
        })
        this.channels.clear()
        this.typingIndicators.clear()
    }

    // Callback management
    onPresenceUpdate(callback: (users: PresenceUser[]) => void): () => void {
        this.presenceCallbacks.add(callback)
        return () => this.presenceCallbacks.delete(callback)
    }

    onMessage(callback: (message: any) => void): () => void {
        this.messageCallbacks.add(callback)
        return () => this.messageCallbacks.delete(callback)
    }

    onTypingUpdate(callback: (typing: TypingIndicator[]) => void): () => void {
        this.typingCallbacks.add(callback)
        return () => this.typingCallbacks.delete(callback)
    }

    // Utility methods
    getTypingUsers(conversationId?: string): string[] {
        return Array.from(this.typingIndicators.values())
            .filter(indicator => !conversationId || indicator.isTyping)
            .map(indicator => indicator.userId)
    }

    isUserTyping(userId: string): boolean {
        const indicator = this.typingIndicators.get(userId)
        if (!indicator) return false

        // Clear if older than 5 seconds
        if (Date.now() - indicator.lastSeen > 5000) {
            this.typingIndicators.delete(userId)
            return false
        }

        return indicator.isTyping
    }

    getChannelCount(): number {
        return this.channels.size
    }

    getActiveChannels(): string[] {
        return Array.from(this.channels.keys())
    }

    // Event handlers
    private handlePresenceUpdate(payload: any): void {
        // This would update presence state
        // Implementation depends on your presence management system
        this.notifyPresenceCallbacks()
    }

    private handleLocationUpdate(payload: any): void {
        // This would update user location in presence system
        this.notifyPresenceCallbacks()
    }

    private handleNewMessage(payload: any): void {
        // This would add message to your message state
        this.notifyMessageCallbacks(payload)
    }

    private handleNewMatch(payload: any): void {
        // This would handle new match notifications
        console.log('New match:', payload)
    }

    private handleTypingIndicator(payload: any): void {
        const {userId, isTyping} = payload

        // Clean up old typing indicators (older than 5 seconds)
        const now = Date.now()
        this.typingIndicators.forEach((indicator, uid) => {
            if (now - indicator.lastSeen > 5000) {
                this.typingIndicators.delete(uid)
            }
        })

        if (isTyping) {
            this.typingIndicators.set(userId, {
                userId,
                isTyping,
                lastSeen: now,
            })
        } else {
            this.typingIndicators.delete(userId)
        }

        this.notifyTypingCallbacks()
    }

    private notifyPresenceCallbacks(): void {
        const typingArray = Array.from(this.typingIndicators.values())
        this.presenceCallbacks.forEach(callback => {
            try {
                callback([]) // Would pass actual presence users
            } catch (error) {
                console.error('Presence callback error:', error)
            }
        })
    }

    private notifyMessageCallbacks(payload?: any): void {
        this.messageCallbacks.forEach(callback => {
            try {
                callback(payload)
            } catch (error) {
                console.error('Message callback error:', error)
            }
        })
    }

    private notifyTypingCallbacks(): void {
        const typingArray = Array.from(this.typingIndicators.values())
        this.typingCallbacks.forEach(callback => {
            try {
                callback(typingArray)
            } catch (error) {
                console.error('Typing callback error:', error)
            }
        })
    }
}

// React hook for using RealtimeManager
export function useRealtimeManager() {
    const [manager] = useState(() => new RealtimeManager())
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        // Check connection status
        const checkConnection = () => {
            setIsConnected(manager.getChannelCount() > 0)
        }

        const interval = setInterval(checkConnection, 5000)

        return () => {
            clearInterval(interval)
            manager.unsubscribeAll()
        }
    }, [manager])

    return {
        manager,
        isConnected,
        subscribeToPresence: manager.subscribeToPresence.bind(manager),
        subscribeToMessages: manager.subscribeToMessages.bind(manager),
        subscribeToMatches: manager.subscribeToMatches.bind(manager),
        broadcastPresence: manager.broadcastPresence.bind(manager),
        broadcastTyping: manager.broadcastTyping.bind(manager),
        sendMessage: manager.sendMessage.bind(manager),
        broadcastLocation: manager.broadcastLocation.bind(manager),
        unsubscribe: manager.unsubscribe.bind(manager),
        unsubscribeAll: manager.unsubscribeAll.bind(manager),
        onPresenceUpdate: manager.onPresenceUpdate.bind(manager),
        onMessage: manager.onMessage.bind(manager),
        onTypingUpdate: manager.onTypingUpdate.bind(manager),
        getTypingUsers: manager.getTypingUsers.bind(manager),
        isUserTyping: manager.isUserTyping.bind(manager),
    }
}
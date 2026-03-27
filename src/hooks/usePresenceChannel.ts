'use client'

import {useEffect, useRef, useState} from 'react'
import {usePresenceStore} from './usePresenceStore'

interface PresenceData {
    user_id: string
    online_at: string
    last_seen: string
}

interface UsePresenceChannelOptions {
    userId: string
    enabled?: boolean
    onPresenceChange?: (presences: PresenceData[]) => void
}

export function usePresenceChannel({
                                       userId,
                                       enabled = true,
                                       onPresenceChange,
                                   }: UsePresenceChannelOptions) {
    const channelRef = useRef<any>(null)
    const {setMembers, addMember, removeMember} = usePresenceStore()
    const heartbeatIntervalRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (!enabled || !userId) {
            return
        }

        // Simulate presence tracking without Supabase
        const updatePresence = async () => {
            try {
                await fetch('/api/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, status: 'online' })
                })
            } catch (error) {
                console.error('Presence update error:', error)
            }
        }

        updatePresence()

        // Start heartbeat to keep presence alive
        heartbeatIntervalRef.current = setInterval(() => {
            updatePresence()
        }, 30000)

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
            }
        }
    }, [userId, enabled, setMembers, addMember, removeMember, onPresenceChange])

    // Manual presence update
    const updatePresence = async (data: Partial<PresenceData>) => {
        try {
            await fetch('/api/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...data })
            })
        } catch (error) {
            console.error('Error updating presence:', error)
        }
    }

    // Go offline
    const goOffline = async () => {
        try {
            await fetch('/api/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: 'offline' })
            })
            removeMember(userId)
        } catch (error) {
            console.error('Error going offline:', error)
        }
    }

    // Come back online
    const comeOnline = async () => {
        try {
            await fetch('/api/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: 'online' })
            })
            addMember(userId)
        } catch (error) {
            console.error('Error coming online:', error)
        }
    }

    return {
        updatePresence,
        goOffline,
        comeOnline,
    }
}

// Hook for typing indicators
export function useTypingIndicator(conversationId: string, userId: string) {
    const [isTyping, setIsTyping] = useState(false)

    const sendTyping = async (typing: boolean) => {
        setIsTyping(typing)
        try {
            await fetch('/api/typing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    userId,
                    isTyping: typing,
                })
            })
        } catch (error) {
            console.error('Error sending typing indicator:', error)
        }
    }

    return {sendTyping, isTyping}
}

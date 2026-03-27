'use client'

import {z} from 'zod'
import {joinRoom} from 'trystero'

export interface P2PEngine<T> {
    connect(): void

    disconnect(): void

    send(payload: T): void

    onMessage(handler: (payload: T, peerId: string) => void): () => void

    isConnected(): boolean

    getPeers(): string[]
}

interface P2PConfig<T> {
    roomId: string
    schema: z.ZodSchema<T>
    signalingServer?: string
    onConnect?: (peerId: string) => void
    onDisconnect?: (peerId: string) => void
    onError?: (error: Error) => void
}

export function createP2PEngine<T>(config: P2PConfig<T>): P2PEngine<T> {
    let room: ReturnType<typeof joinRoom> | null = null
    let isConnected = false
    let peers = new Set<string>()
    let reconnectAttempts = 0
    let reconnectTimer: NodeJS.Timeout | null = null
    let messageHandlers: Array<(payload: T, peerId: string) => void> = []

    const {roomId, schema, signalingServer, onConnect, onDisconnect, onError} = config

    function connect() {
        try {
            // Clean up existing connection
            if (room) {
                room.leave()
                room = null
            }

            // Create new room with Trystero
            room = joinRoom({appId: 'zenith-p2p', roomId}, signalingServer)

            // Set up message handling
            room.onPeer((peerId) => {
                console.log(`P2P: Peer connected: ${peerId}`)
                peers.add(peerId)
                isConnected = true
                reconnectAttempts = 0
                onConnect?.(peerId)
            })

            room.onPeerLeave((peerId) => {
                console.log(`P2P: Peer disconnected: ${peerId}`)
                peers.delete(peerId)
                onDisconnect?.(peerId)

                // If no peers left, mark as disconnected
                if (peers.size === 0) {
                    isConnected = false
                }
            })

            // Set up message receiving
            const [sendMessage, onReceiveMessage] = room.makeAction('message')

            onReceiveMessage((payload: unknown, peerId: string) => {
                // Validate incoming payload
                const result = schema.safeParse(payload)

                if (!result.success) {
                    console.warn(`P2P: Invalid message from ${peerId}:`, result.error)
                    return
                }

                // Call all message handlers
                messageHandlers.forEach(handler => {
                    try {
                        handler(result.data, peerId)
                    } catch (error) {
                        console.error(`P2P: Error in message handler:`, error)
                    }
                })
            })

            // Store send function for later use
            ;(room as any)._sendMessage = sendMessage

            console.log(`P2P: Connected to room: ${roomId}`)
            isConnected = true

        } catch (error) {
            console.error('P2P: Connection error:', error)
            onError?.(error instanceof Error ? error : new Error('Unknown connection error'))

            // Attempt reconnection with exponential backoff
            scheduleReconnect()
        }
    }

    function disconnect() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }

        if (room) {
            try {
                room.leave()
            } catch (error) {
                console.error('P2P: Error leaving room:', error)
            }
            room = null
        }

        isConnected = false
        peers.clear()
        messageHandlers = []
        reconnectAttempts = 0

        console.log(`P2P: Disconnected from room: ${roomId}`)
    }

    function send(payload: T) {
        if (!room || !isConnected) {
            console.warn('P2P: Cannot send message - not connected')
            return
        }

        // Validate payload before sending
        const result = schema.safeParse(payload)
        if (!result.success) {
            console.error('P2P: Invalid payload for sending:', result.error)
            return
        }

        try {
            const sendMessage = (room as any)._sendMessage
            if (typeof sendMessage === 'function') {
                sendMessage(result.data)
            } else {
                console.error('P2P: Send function not available')
            }
        } catch (error) {
            console.error('P2P: Error sending message:', error)
            onError?.(error instanceof Error ? error : new Error('Send error'))
        }
    }

    function onMessage(handler: (payload: T, peerId: string) => void): () => void {
        messageHandlers.push(handler)

        // Return unsubscribe function
        return () => {
            const index = messageHandlers.indexOf(handler)
            if (index > -1) {
                messageHandlers.splice(index, 1)
            }
        }
    }

    function scheduleReconnect() {
        if (reconnectAttempts >= 3) {
            console.error('P2P: Max reconnection attempts reached')
            onError?.(new Error('Max reconnection attempts reached'))
            return
        }

        const delay = Math.pow(2, reconnectAttempts) * 1000 // 1s, 2s, 4s
        reconnectAttempts++

        console.log(`P2P: Scheduling reconnection in ${delay}ms (attempt ${reconnectAttempts})`)

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null
            connect()
        }, delay)
    }

    function getIsConnected(): boolean {
        return isConnected && peers.size > 0
    }

    function getPeers(): string[] {
        return Array.from(peers)
    }

    return {
        connect,
        disconnect,
        send,
        onMessage,
        isConnected: getIsConnected,
        getPeers,
    }
}

// Utility function to create a P2P engine for chat
export function createChatP2PEngine(conversationId: string) {
    const messageSchema = z.object({
        id: z.string(),
        conversation_id: z.string(),
        sender_id: z.string(),
        content: z.string(),
        attachments: z.array(z.string().url()).optional(),
        created_at: z.string(),
        type: z.enum(['text', 'image', 'file']).default('text'),
    })

    return createP2PEngine({
        roomId: `chat-${conversationId}`,
        schema: messageSchema,
        signalingServer: process.env.NEXT_PUBLIC_P2P_SIGNALING_SERVER,
        onConnect: (peerId) => {
            console.log(`Chat P2P: Connected to peer ${peerId}`)
        },
        onDisconnect: (peerId) => {
            console.log(`Chat P2P: Disconnected from peer ${peerId}`)
        },
        onError: (error) => {
            console.error('Chat P2P: Error:', error)
        },
    })
}

// Utility function to create a P2P engine for presence
export function createPresenceP2PEngine(roomId: string) {
    const presenceSchema = z.object({
        type: z.enum(['presence', 'location', 'typing']),
        user_id: z.string(),
        data: z.any(),
        timestamp: z.string(),
    })

    return createP2PEngine({
        roomId: `presence-${roomId}`,
        schema: presenceSchema,
        signalingServer: process.env.NEXT_PUBLIC_P2P_SIGNALING_SERVER,
    })
}
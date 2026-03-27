'use client'

import {useEffect, useRef, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Check, CheckCheck, Circle, MessageCircle, Search, Send} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import type {SendMessageInput} from '@/validations/messages'
import {sendMessageSchema} from '@/validations/messages'
import {createChatP2PEngine, type P2PEngine} from '@/lib/p2p/engine'
import {useTypingIndicator} from '@/hooks/usePresenceChannel'
import {useOnlineMembers} from '@/hooks/usePresenceStore'
import {formatTime} from '@/lib/utils'

interface Conversation {
    id: string
    other_user: {
        id: string
        username: string
        avatar_url?: string
        online_status?: string
    }
    latest_message?: {
        id: string
        content: string
        sender_id: string
        created_at: string
        type: string
    }
    unread_count: number
    updated_at: string
}

interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    attachments?: string[]
    type: 'text' | 'image' | 'file'
    created_at: string
    sender?: {
        username: string
        avatar_url?: string
    }
    read_at?: string
    encryption_key_id?: string
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [p2pConnected, setP2pConnected] = useState(false)
    const onlineUsers = useOnlineMembers()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const p2pEngineRef = useRef<P2PEngine<Message> | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<SendMessageInput>({
        resolver: zodResolver(sendMessageSchema),
    })

    const {sendTyping} = useTypingIndicator(
        selectedConversation?.id || '',
        '' // Current user ID would come from auth
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id)
            setupP2PConnection(selectedConversation.id)
            markAsRead(selectedConversation.id)
        }
    }, [selectedConversation])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    async function loadConversations() {
        setLoading(true)
        try {
            const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''
            const response = await fetch(`/api/messages${params}`)
            if (!response.ok) throw new Error('Failed to load conversations')

            const data = await response.json()
            setConversations(data.conversations || [])
        } catch (error) {
            console.error('Load conversations error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function loadMessages(conversationId: string) {
        try {
            const response = await fetch(`/api/messages?conversation_id=${conversationId}`)
            if (!response.ok) throw new Error('Failed to load messages')

            const data = await response.json()
            setMessages(data.messages || [])
        } catch (error) {
            console.error('Load messages error:', error)
        }
    }

    async function setupP2PConnection(conversationId: string) {
        try {
            // Create P2P engine for this conversation
            const p2pEngine = createChatP2PEngine(conversationId)
            p2pEngineRef.current = p2pEngine

            p2pEngine.connect()

            p2pEngine.onMessage((_message: Message) => {
                // Handle P2P messages
                setMessages(prev => [...prev, _message])
            })

            p2pEngine.onMessage((_connectionMsg: unknown) => {
                // Check if connection is established
                setP2pConnected(p2pEngine.isConnected())
            })

            // Check initial connection status
            setP2pConnected(p2pEngine.isConnected())

        } catch (error) {
            console.error('P2P setup error:', error)
            setP2pConnected(false)
        }
    }

    async function markAsRead(conversationId: string) {
        try {
            await fetch(`/api/messages/${conversationId}/read`, {
                method: 'POST',
            })
        } catch (error) {
            console.error('Mark as read error:', error)
        }
    }

    async function sendMessage(data: SendMessageInput) {
        if (!selectedConversation) return

        setSendingMessage(true)
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...data,
                    conversation_id: selectedConversation.id,
                }),
            })

            if (!response.ok) throw new Error('Failed to send message')

            const result = await response.json()

            // Add message to local state
            setMessages(prev => [...prev, result.message])

            // Reset form
            reset()

            // Update conversation list
            await loadConversations()

        } catch (error) {
            console.error('Send message error:', error)
        } finally {
            setSendingMessage(false)
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }

    function isOnline(userId: string): boolean {
        return onlineUsers.includes(userId)
    }

    function formatTime(dateString: string): string {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
        return date.toLocaleDateString()
    }

    function getMessageStatus(message: Message): 'sent' | 'delivered' | 'read' {
        if (message.read_at) return 'read'
        // In a real app, you'd track delivery status
        return 'delivered'
    }

    const filteredConversations = conversations.filter(conv =>
        conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-xl font-semibold">Messages</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                    {/* Conversations List */}
                    <div className="lg:col-span-1">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5"/>
                                    Conversations
                                </CardTitle>
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                    <Input
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 p-0">
                                <ScrollArea className="h-full">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div
                                                className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : filteredConversations.length === 0 ? (
                                        <div className="text-center py-8 px-4">
                                            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                            <p className="text-gray-600">No conversations yet</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Start matching to begin conversations
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredConversations.map((conversation) => (
                                                <ConversationCard
                                                    key={conversation.id}
                                                    conversation={conversation}
                                                    isSelected={selectedConversation?.id === conversation.id}
                                                    onClick={() => setSelectedConversation(conversation)}
                                                    isOnline={isOnline(conversation.other_user.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat Thread */}
                    <div className="lg:col-span-2">
                        {selectedConversation ? (
                            <Card className="h-full flex flex-col">
                                {/* Chat Header */}
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar>
                                                    <AvatarImage src={selectedConversation.other_user.avatar_url}/>
                                                    <AvatarFallback>
                                                        {selectedConversation.other_user.username[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div
                                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                                        isOnline(selectedConversation.other_user.id) ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}/>
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{selectedConversation.other_user.username}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {isOnline(selectedConversation.other_user.id) ? (
                                                        <span className="flex items-center gap-1 text-green-600">
                              <Circle className="h-2 w-2 fill-current"/>
                              Online
                            </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                              <Circle className="h-2 w-2"/>
                              Offline
                            </span>
                                                    )}
                                                    {p2pConnected && (
                                                        <Badge variant="outline" className="text-xs">
                                                            🔒 P2P
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Messages */}
                                <CardContent className="flex-1 p-0">
                                    <ScrollArea className="h-full p-4">
                                        <div className="space-y-4">
                                            {messages.map((message) => (
                                                <MessageBubble
                                                    key={message.id}
                                                    message={message}
                                                    isOwn={message.sender_id === 'current-user'} // Would come from auth
                                                    status={getMessageStatus(message)}
                                                />
                                            ))}
                                            <div ref={messagesEndRef}/>
                                        </div>
                                    </ScrollArea>
                                </CardContent>

                                {/* Message Input */}
                                <div className="p-4 border-t">
                                    <form
                                        onSubmit={handleSubmit(sendMessage)}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            placeholder="Type a message..."
                                            {...register('content')}
                                            disabled={sendingMessage}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={sendingMessage}
                                            size="icon"
                                        >
                                            <Send className="h-4 w-4"/>
                                        </Button>
                                    </form>
                                    {errors.content && (
                                        <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                                        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                                        <p className="text-gray-600">Choose a conversation to start messaging</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ConversationCard({
                              conversation,
                              isSelected,
                              onClick,
                              isOnline
                          }: {
    conversation: Conversation
    isSelected: boolean
    onClick: () => void
    isOnline: boolean
}) {
    return (
        <div
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="relative">
                    <Avatar>
                        <AvatarImage src={conversation.other_user.avatar_url}/>
                        <AvatarFallback>
                            {conversation.other_user.username[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}/>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{conversation.other_user.username}</h3>
                        <span className="text-xs text-gray-500">
              {conversation.latest_message
                  ? formatTime(conversation.latest_message.created_at)
                  : formatTime(conversation.updated_at)
              }
            </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                            {conversation.latest_message
                                ? conversation.latest_message.content
                                : 'No messages yet'
                            }
                        </p>

                        {conversation.unread_count > 0 && (
                            <Badge variant="default" className="text-xs">
                                {conversation.unread_count}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function MessageBubble({
                           message,
                           isOwn,
                           status
                       }: {
    message: Message
    isOwn: boolean
    status: 'sent' | 'delivered' | 'read'
}) {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                <div
                    className={`rounded-2xl px-4 py-2 ${
                        isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                    }`}
                >
                    <p className="text-sm break-words">{message.content}</p>
                </div>

                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                    isOwn ? 'justify-end' : 'justify-start'
                }`}>
                    <span>{formatTime(message.created_at)}</span>

                    {isOwn && (
                        <span className="flex items-center">
              {status === 'sent' && <Check className="h-3 w-3"/>}
                            {status === 'delivered' && <CheckCheck className="h-3 w-3"/>}
                            {status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500"/>}
            </span>
                    )}

                    {message.encryption_key_id && (
                        <span className="text-green-600">🔒</span>
                    )}
                </div>
            </div>
        </div>
    )
}
'use client'

import {useEffect, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Separator} from '@/components/ui/separator'
import {Bot, Copy, Send, Sparkles, ThumbsDown, ThumbsUp, User} from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isStreaming?: boolean
}

interface AIChatInterfaceProps {
    className?: string
    placeholder?: string
    onMessageSent?: (message: string) => Promise<string>
}

export function AIChatInterface({
                                    className,
                                    placeholder = "Ask me anything about dating, relationships, or finding your perfect match...",
                                    onMessageSent
                                }: AIChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI Dating Coach. I can help you with profile optimization, conversation starters, dating advice, and finding compatible matches. What would you like to know?",
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        // Add streaming assistant message
        const streamingMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        }
        setMessages(prev => [...prev, streamingMessage])

        try {
            // Simulate AI response - replace with actual AI integration
            const response = onMessageSent
                ? await onMessageSent(input.trim())
                : await simulateAIResponse(input.trim())

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === streamingMessage.id
                        ? {...msg, content: response, isStreaming: false}
                        : msg
                )
            )
        } catch (error) {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === streamingMessage.id
                        ? {
                            ...msg,
                            content: "I apologize, but I'm having trouble responding right now. Please try again.",
                            isStreaming: false
                        }
                        : msg
                )
            )
        } finally {
            setIsLoading(false)
        }
    }

    const simulateAIResponse = async (userInput: string): Promise<string> => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

        const responses = [
            "That's a great question! Based on your profile, I suggest focusing on authentic conversation starters that reflect your genuine interests.",
            "I've analyzed thousands of successful dating profiles. The key is to show, don't just tell, your personality through specific examples.",
            "For better matches, try being more specific about your values and what you're looking for in a relationship.",
            "Your profile photos should tell a story about your lifestyle. Include action shots that show your hobbies and passions.",
            "When it comes to first messages, personalization is key. Reference something specific from their profile.",
        ]

        return responses[Math.floor(Math.random() * responses.length)]
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content)
    }

    const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
        // Implement feedback logic
        console.log(`Feedback ${feedback} for message ${messageId}`)
    }

    return (
        <Card className={`flex flex-col h-[600px] ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="relative">
                        <Bot className="h-5 w-5 text-rose-600"/>
                        <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1"/>
                    </div>
                    AI Dating Coach
                    <Badge variant="secondary" className="text-xs">
                        Online
                    </Badge>
                </CardTitle>
            </CardHeader>
            <Separator/>
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {message.role === 'assistant' && (
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarFallback
                                            className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                                            <Bot className="h-4 w-4"/>
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                        message.role === 'user'
                                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {message.content}
                                        {message.isStreaming && (
                                            <span className="inline-block ml-1 animate-pulse">▊</span>
                                        )}
                                    </p>
                                    {!message.isStreaming && (
                                        <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                      </span>
                                            {message.role === 'assistant' && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                                        onClick={() => copyMessage(message.content)}
                                                    >
                                                        <Copy className="h-3 w-3"/>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                                        onClick={() => handleFeedback(message.id, 'positive')}
                                                    >
                                                        <ThumbsUp className="h-3 w-3"/>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                                        onClick={() => handleFeedback(message.id, 'negative')}
                                                    >
                                                        <ThumbsDown className="h-3 w-3"/>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {message.role === 'user' && (
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarFallback
                                            className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                            <User className="h-4 w-4"/>
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                                        <Bot className="h-4 w-4"/>
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                             style={{animationDelay: '0ms'}}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                             style={{animationDelay: '150ms'}}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                             style={{animationDelay: '300ms'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                        >
                            <Send className="h-4 w-4"/>
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                        Powered by advanced AI • Your conversations are private and secure
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

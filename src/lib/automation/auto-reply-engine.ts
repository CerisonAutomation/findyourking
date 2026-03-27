'use client'

import {useCallback, useEffect, useState} from 'react'

interface AutoReplyRule {
    id: string
    trigger: {
        keywords: string[]
        sentiment?: 'positive' | 'neutral' | 'negative'
        messageLength?: 'short' | 'medium' | 'long'
        timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
        conversationStage?: 'opening' | 'early' | 'mid' | 'late'
    }
    response: {
        templates: string[]
        personality: 'casual' | 'flirty' | 'humorous' | 'formal'
        delay: { min: number; max: number }
        includeQuestion?: boolean
        includeEmoji?: boolean
    }
    priority: number
    enabled: boolean
}

interface ConversationContext {
    messages: Array<{
        id: string
        content: string
        timestamp: Date
        sender: 'user' | 'match'
        sentiment?: 'positive' | 'neutral' | 'negative'
    }>
    matchProfile: {
        name: string
        personality: 'casual' | 'flirty' | 'humorous' | 'formal'
        interests: string[]
        lastSeen: Date
    }
    userProfile: {
        personality: 'casual' | 'flirty' | 'humorous' | 'formal'
        interests: string[]
        autoReplyEnabled: boolean
        responseDelay: 'fast' | 'normal' | 'slow'
    }
}

interface GeneratedReply {
    text: string
    confidence: number
    ruleId: string
    delay: number
    personality: string
    reasoning: string
}

class AutoReplyEngine {
    private rules: AutoReplyRule[] = []
    public isEnabled: boolean = false
    private responseHistory: Map<string, Date[]> = new Map()

    constructor() {
        this.initializeDefaultRules()
    }

    public addRule(rule: AutoReplyRule): void {
        this.rules.push(rule)
        this.rules.sort((a, b) => b.priority - a.priority)
    }

    public removeRule(ruleId: string): void {
        this.rules = this.rules.filter(rule => rule.id !== ruleId)
    }

    public toggleRule(ruleId: string): void {
        const rule = this.rules.find(r => r.id === ruleId)
        if (rule) {
            rule.enabled = !rule.enabled
        }
    }

    public enable(): void {
        this.isEnabled = true
    }

    public disable(): void {
        this.isEnabled = false
    }

    public async generateReply(
        incomingMessage: string,
        context: ConversationContext
    ): Promise<GeneratedReply | null> {
        if (!this.isEnabled || !context.userProfile.autoReplyEnabled) {
            return null
        }

        // Check if we recently replied to avoid spam
        const now = new Date()
        const recentReplies = this.responseHistory.get(context.matchProfile.name) || []
        const veryRecentReplies = recentReplies.filter(time =>
            now.getTime() - time.getTime() < 5 * 60 * 1000 // 5 minutes
        )

        if (veryRecentReplies.length >= 2) {
            return null // Don't reply too frequently
        }

        // Analyze incoming message
        const messageAnalysis = this.analyzeMessage(incomingMessage, context)

        // Find matching rules
        const matchingRules = this.rules.filter(rule =>
            rule.enabled && this.matchesRule(messageAnalysis, rule.trigger, context)
        )

        if (matchingRules.length === 0) {
            return null
        }

        // Use highest priority rule
        const rule = matchingRules[0]

        // Generate response
        const response = this.generateResponseFromRule(rule, incomingMessage, context)

        // Record response
        this.recordResponse(context.matchProfile.name)

        return response
    }

    public getRules(): AutoReplyRule[] {
        return [...this.rules]
    }

    public getResponseHistory(matchName: string): Date[] {
        return this.responseHistory.get(matchName) || []
    }

    public clearResponseHistory(matchName?: string): void {
        if (matchName) {
            this.responseHistory.delete(matchName)
        } else {
            this.responseHistory.clear()
        }
    }

    private initializeDefaultRules(): void {
        this.rules = [
            // Opening messages
            {
                id: 'opening-positive',
                trigger: {
                    keywords: ['hi', 'hello', 'hey', 'how are you', 'good morning', 'good evening'],
                    conversationStage: 'opening',
                    sentiment: 'positive'
                },
                response: {
                    templates: [
                        "Hey! Great to hear from you! {emoji}",
                        "Hi there! Your message made me smile {emoji}",
                        "Hello! I was hoping you'd message me {emoji}"
                    ],
                    personality: 'casual',
                    delay: {min: 30, max: 120},
                    includeEmoji: true
                },
                priority: 10,
                enabled: true
            },

            // Interest-based responses
            {
                id: 'interest-match',
                trigger: {
                    keywords: ['love', 'enjoy', 'passionate about', 'into', 'fan of'],
                    sentiment: 'positive'
                },
                response: {
                    templates: [
                        "That's awesome! I'm also really into {interest}. What do you like most about it?",
                        "No way! I love {interest} too! Have you been doing it long?",
                        "That's so cool! I'm a big {interest} fan myself. We should talk more about it!"
                    ],
                    personality: 'casual',
                    delay: {min: 60, max: 180},
                    includeQuestion: true
                },
                priority: 9,
                enabled: true
            },

            // Question responses
            {
                id: 'question-response',
                trigger: {
                    keywords: ['?', 'what', 'how', 'when', 'where', 'why', 'who'],
                    messageLength: 'medium'
                },
                response: {
                    templates: [
                        "That's a great question! Let me think...",
                        "Interesting question! Here's my take:",
                        "I've been thinking about that too..."
                    ],
                    personality: 'casual',
                    delay: {min: 45, max: 150}
                },
                priority: 8,
                enabled: true
            },

            // Compliment responses
            {
                id: 'compliment-reply',
                trigger: {
                    keywords: ['beautiful', 'handsome', 'gorgeous', 'cute', 'attractive', 'hot'],
                    sentiment: 'positive'
                },
                response: {
                    templates: [
                        "Wow, thank you! That's so sweet of you to say {emoji}",
                        "You're making me blush! Thank you {emoji}",
                        "That's really nice to hear! You're not so bad yourself {emoji}"
                    ],
                    personality: 'flirty',
                    delay: {min: 20, max: 90},
                    includeEmoji: true
                },
                priority: 7,
                enabled: true
            },

            // Humor responses
            {
                id: 'humor-engagement',
                trigger: {
                    keywords: ['lol', 'haha', 'funny', 'hilarious', 'laugh', 'joke'],
                    sentiment: 'positive'
                },
                response: {
                    templates: [
                        "Haha, you're hilarious! I love your sense of humor {emoji}",
                        "LOL! You crack me up. What's your best joke?",
                        "That's funny! I could definitely use more laughter in my life {emoji}"
                    ],
                    personality: 'humorous',
                    delay: {min: 15, max: 60},
                    includeEmoji: true
                },
                priority: 6,
                enabled: true
            },

            // Negative sentiment support
            {
                id: 'support-response',
                trigger: {
                    keywords: ['sad', 'bad', 'terrible', 'stressed', 'tired', 'worried'],
                    sentiment: 'negative'
                },
                response: {
                    templates: [
                        "I'm sorry you're feeling that way. Want to talk about it?",
                        "That sounds tough. Is there anything I can do to help?",
                        "I'm here for you. Sometimes just venting helps, you know?"
                    ],
                    personality: 'casual',
                    delay: {min: 60, max: 180}
                },
                priority: 5,
                enabled: true
            },

            // Late night responses
            {
                id: 'late-night',
                trigger: {
                    keywords: [],
                    timeOfDay: 'night',
                    messageLength: 'short'
                },
                response: {
                    templates: [
                        "Hey! Still up? I'm a night owl too {emoji}",
                        "Late night texting? I like your style {emoji}",
                        "Can't sleep either? Great minds think alike {emoji}"
                    ],
                    personality: 'casual',
                    delay: {min: 10, max: 45},
                    includeEmoji: true
                },
                priority: 4,
                enabled: true
            },

            // Follow-up for short messages
            {
                id: 'short-message-followup',
                trigger: {
                    keywords: [],
                    messageLength: 'short',
                    conversationStage: 'mid'
                },
                response: {
                    templates: [
                        "Tell me more!",
                        "I'm intrigued, go on...",
                        "And then what happened?"
                    ],
                    personality: 'casual',
                    delay: {min: 30, max: 90}
                },
                priority: 3,
                enabled: true
            }
        ]
    }

    private analyzeMessage(message: string, context: ConversationContext) {
        const lowerMessage = message.toLowerCase()
        const messageLength = message.length

        // Determine message length category
        let lengthCategory: 'short' | 'medium' | 'long'
        if (messageLength < 20) lengthCategory = 'short'
        else if (messageLength < 100) lengthCategory = 'medium'
        else lengthCategory = 'long'

        // Determine time of day
        const hour = new Date().getHours()
        let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
        if (hour >= 5 && hour < 12) timeOfDay = 'morning'
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening'
        else timeOfDay = 'night'

        // Determine conversation stage
        let conversationStage: 'opening' | 'early' | 'mid' | 'late'
        const messageCount = context.messages.length
        if (messageCount <= 2) conversationStage = 'opening'
        else if (messageCount <= 5) conversationStage = 'early'
        else if (messageCount <= 15) conversationStage = 'mid'
        else conversationStage = 'late'

        // Simple sentiment analysis
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
        const positiveWords = ['love', 'great', 'awesome', 'amazing', 'fantastic', 'wonderful', 'good', 'happy', 'excited', 'beautiful', 'handsome', 'cute']
        const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'sad', 'angry', 'frustrated', 'disappointed', 'worst', 'horrible', 'stressed', 'tired']

        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length

        if (positiveCount > negativeCount) sentiment = 'positive'
        else if (negativeCount > positiveCount) sentiment = 'negative'

        return {
            keywords: lowerMessage.split(' ').filter(word => word.length > 2),
            sentiment,
            messageLength: lengthCategory,
            timeOfDay,
            conversationStage,
            hasQuestion: lowerMessage.includes('?'),
            isCompliment: positiveWords.some(word => lowerMessage.includes(word)) && messageLength < 50
        }
    }

    private matchesRule(
        analysis: ReturnType<AutoReplyEngine['analyzeMessage']>,
        trigger: AutoReplyRule['trigger'],
        context: ConversationContext
    ): boolean {
        // Check keywords
        const keywordMatch = trigger.keywords.some(keyword =>
            analysis.keywords.some(kw => kw.includes(keyword) || keyword.includes(kw))
        )

        if (!keywordMatch && trigger.keywords.length > 0) {
            return false
        }

        // Check sentiment
        if (trigger.sentiment && analysis.sentiment !== trigger.sentiment) {
            return false
        }

        // Check message length
        if (trigger.messageLength && analysis.messageLength !== trigger.messageLength) {
            return false
        }

        // Check time of day
        if (trigger.timeOfDay && analysis.timeOfDay !== trigger.timeOfDay) {
            return false
        }

        // Check conversation stage
        if (trigger.conversationStage && analysis.conversationStage !== trigger.conversationStage) {
            return false
        }

        return true
    }

    private generateResponseFromRule(
        rule: AutoReplyRule,
        incomingMessage: string,
        context: ConversationContext
    ): GeneratedReply {
        const template = rule.response.templates[Math.floor(Math.random() * rule.response.templates.length)]

        // Personalize template
        let response = template

        // Replace interest placeholders
        const commonInterests = context.userProfile.interests.filter(interest =>
            context.matchProfile.interests.includes(interest)
        )
        if (commonInterests.length > 0 && response.includes('{interest}')) {
            response = response.replace('{interest}', commonInterests[0])
        }

        // Add emoji if specified
        if (rule.response.includeEmoji) {
            const emojis = ['😊', '😄', '😉', '🤗', '😎', '🥰', '💫', '✨', '🌟', '💕']
            const emoji = emojis[Math.floor(Math.random() * emojis.length)]
            response = response.replace('{emoji}', emoji)
        } else {
            response = response.replace('{emoji}', '')
        }

        // Add question if specified
        if (rule.response.includeQuestion && !response.includes('?')) {
            const questions = [
                "What about you?",
                "How do you feel about that?",
                "Tell me more!",
                "What do you think?",
                "What's your take on it?"
            ]
            response += " " + questions[Math.floor(Math.random() * questions.length)]
        }

        // Calculate delay based on user preference
        let delay = Math.random() * (rule.response.delay.max - rule.response.delay.min) + rule.response.delay.min

        if (context.userProfile.responseDelay === 'fast') {
            delay *= 0.5
        } else if (context.userProfile.responseDelay === 'slow') {
            delay *= 1.5
        }

        // Calculate confidence based on rule match quality
        const confidence = rule.priority / 10

        return {
            text: response,
            confidence,
            ruleId: rule.id,
            delay: Math.round(delay),
            personality: rule.response.personality,
            reasoning: `Matched rule: ${rule.id} with priority ${rule.priority}`
        }
    }

    private recordResponse(matchName: string): void {
        const now = new Date()
        const responses = this.responseHistory.get(matchName) || []
        responses.push(now)

        // Keep only last 10 responses
        if (responses.length > 10) {
            responses.shift()
        }

        this.responseHistory.set(matchName, responses)
    }
}

// React Hook
export function useAutoReplyEngine() {
    const [engine] = useState(() => new AutoReplyEngine())
    const [isEnabled, setIsEnabled] = useState(false)
    const [rules, setRules] = useState<AutoReplyRule[]>([])

    useEffect(() => {
        setRules(engine.getRules())
        setIsEnabled(engine.isEnabled)
    }, [engine])

    const generateReply = useCallback(async (
        incomingMessage: string,
        context: ConversationContext
    ) => {
        return await engine.generateReply(incomingMessage, context)
    }, [engine])

    const addRule = useCallback((rule: AutoReplyRule) => {
        engine.addRule(rule)
        setRules(engine.getRules())
    }, [engine])

    const removeRule = useCallback((ruleId: string) => {
        engine.removeRule(ruleId)
        setRules(engine.getRules())
    }, [engine])

    const toggleRule = useCallback((ruleId: string) => {
        engine.toggleRule(ruleId)
        setRules(engine.getRules())
    }, [engine])

    const enable = useCallback(() => {
        engine.enable()
        setIsEnabled(true)
    }, [engine])

    const disable = useCallback(() => {
        engine.disable()
        setIsEnabled(false)
    }, [engine])

    return {
        engine,
        isEnabled,
        rules,
        generateReply,
        addRule,
        removeRule,
        toggleRule,
        enable,
        disable,
        getResponseHistory: engine.getResponseHistory.bind(engine),
        clearResponseHistory: engine.clearResponseHistory.bind(engine)
    }
}

export default AutoReplyEngine

'use client'

import {useCallback, useState} from 'react'

interface ConversationAnalysis {
    sentiment: 'positive' | 'neutral' | 'negative'
    engagement: 'high' | 'medium' | 'low'
    appropriateness: 'appropriate' | 'borderline' | 'inappropriate'
    suggestions: string[]
    timing: 'good' | 'too-soon' | 'too-late'
    responseQuality: number // 0-100
}

interface MessageAnalysis {
    message: string
    timestamp: Date
    analysis: ConversationAnalysis
}

interface CoachingAdvice {
    category: 'timing' | 'content' | 'tone' | 'next-step' | 'red-flag'
    priority: 'high' | 'medium' | 'low'
    advice: string
    reasoning: string
    confidence: number
}

class ConversationCoach {
    private apiKey: string
    private baseUrl: string
    private cache: Map<string, ConversationAnalysis> = new Map()

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
        this.baseUrl = 'https://api.openai.com/v1/chat/completions'
    }

    public async analyzeMessage(message: string, conversationContext: MessageAnalysis[]): Promise<ConversationAnalysis> {
        return this.analyzeWithAI(message, conversationContext)
    }

    public async generateCoachingAdvice(
        message: string,
        conversationContext: MessageAnalysis[],
        userProfile: { personality: string; goals: string[] },
        matchProfile: { personality: string; interests: string[] }
    ): Promise<CoachingAdvice[]> {
        const analysis = await this.analyzeMessage(message, conversationContext)
        const advice: CoachingAdvice[] = []

        // Timing advice
        if (conversationContext.length === 0) {
            advice.push({
                category: 'timing',
                priority: 'medium',
                advice: 'Great opening! Keep the momentum going with a follow-up question.',
                reasoning: 'First message sets the tone for the conversation',
                confidence: 0.8,
            })
        } else if (conversationContext.length === 1) {
            advice.push({
                category: 'timing',
                priority: 'medium',
                advice: 'Good follow-up. Consider sharing something personal about yourself.',
                reasoning: 'Second message should build connection',
                confidence: 0.8,
            })
        }

        // Content advice
        if (analysis.engagement === 'low') {
            advice.push({
                category: 'content',
                priority: 'high',
                advice: 'Add more engaging content like questions or personal anecdotes.',
                reasoning: 'Low engagement may lead to conversation stagnation',
                confidence: 0.9,
            })
        }

        // Tone advice
        if (analysis.sentiment === 'negative') {
            advice.push({
                category: 'tone',
                priority: 'high',
                advice: 'Consider a more positive or neutral tone to keep the conversation enjoyable.',
                reasoning: 'Negative tone can be off-putting in early dating conversations',
                confidence: 0.9,
            })
        }

        // Next step advice
        if (conversationContext.length >= 3 && analysis.responseQuality > 80) {
            advice.push({
                category: 'next-step',
                priority: 'medium',
                advice: 'Conversation is going well! Consider suggesting a video call or meeting.',
                reasoning: 'Good conversation flow indicates readiness for next step',
                confidence: 0.7,
            })
        }

        // Red flag advice
        if (analysis.appropriateness === 'inappropriate') {
            advice.push({
                category: 'red-flag',
                priority: 'high',
                advice: 'This message may be too forward for early stages. Consider a more respectful approach.',
                reasoning: 'Inappropriate content can damage trust and connection',
                confidence: 0.95,
            })
        }

        return advice.sort((a, b) => {
            const priorityOrder = {high: 3, medium: 2, low: 1}
            return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
    }

    public clearCache(): void {
        this.cache.clear()
    }

    public getCacheSize(): number {
        return this.cache.size
    }

    private getCacheKey(message: string): string {
        return `analysis-${message.substring(0, 100)}`
    }

    private async analyzeWithAI(message: string, conversationContext: MessageAnalysis[]): Promise<ConversationAnalysis> {
        const cacheKey = this.getCacheKey(message)

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        if (!this.apiKey) {
            return this.fallbackAnalysis(message, conversationContext)
        }

        try {
            const context = conversationContext.slice(-3).map(msg => ({
                role: 'user' as const,
                content: msg.message
            }))

            const prompt = `You are an expert dating conversation coach. Analyze this message in the context of the conversation:

Current message: "${message}"

Recent conversation context:
${context.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a JSON analysis with:
- sentiment: "positive" | "neutral" | "negative"
- engagement: "high" | "medium" | "low" 
- appropriateness: "appropriate" | "borderline" | "inappropriate"
- suggestions: array of 2-3 specific improvement suggestions
- timing: "good" | "too-soon" | "too-late"
- responseQuality: number 0-100

Focus on dating context: authenticity, respect, engagement, and appropriate boundaries.`

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful dating conversation coach. Always respond with valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 300,
                }),
            })

            if (!response.ok) {
                throw new Error('AI analysis failed')
            }

            const data = await response.json()
            const content = data.choices[0]?.message?.content

            if (!content) {
                throw new Error('No content received')
            }

            try {
                const analysis = JSON.parse(content)
                const validatedAnalysis: ConversationAnalysis = {
                    sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment)
                        ? analysis.sentiment
                        : 'neutral',
                    engagement: ['high', 'medium', 'low'].includes(analysis.engagement)
                        ? analysis.engagement
                        : 'medium',
                    appropriateness: ['appropriate', 'borderline', 'inappropriate'].includes(analysis.appropriateness)
                        ? analysis.appropriateness
                        : 'appropriate',
                    suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 3) : [],
                    timing: ['good', 'too-soon', 'too-late'].includes(analysis.timing)
                        ? analysis.timing
                        : 'good',
                    responseQuality: typeof analysis.responseQuality === 'number'
                        ? Math.max(0, Math.min(100, analysis.responseQuality))
                        : 75,
                }

                this.cache.set(cacheKey, validatedAnalysis)
                return validatedAnalysis
            } catch (parseError) {
                console.error('Failed to parse AI analysis:', parseError)
                return this.fallbackAnalysis(message, conversationContext)
            }
        } catch (error) {
            console.error('AI analysis error:', error)
            return this.fallbackAnalysis(message, conversationContext)
        }
    }

    private fallbackAnalysis(message: string, conversationContext: MessageAnalysis[]): ConversationAnalysis {
        const lowerMessage = message.toLowerCase()

        // Sentiment analysis
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
        if (lowerMessage.includes('awesome') || lowerMessage.includes('great') || lowerMessage.includes('love') || lowerMessage.includes('amazing')) {
            sentiment = 'positive'
        } else if (lowerMessage.includes('bad') || lowerMessage.includes('hate') || lowerMessage.includes('terrible') || lowerMessage.includes('annoying')) {
            sentiment = 'negative'
        }

        // Engagement analysis
        let engagement: 'high' | 'medium' | 'low' = 'medium'
        if (lowerMessage.includes('?') || lowerMessage.includes('!') || lowerMessage.length > 50) {
            engagement = 'high'
        } else if (lowerMessage.length < 10 || (!lowerMessage.includes('?') && !lowerMessage.includes('!'))) {
            engagement = 'low'
        }

        // Appropriateness analysis
        let appropriateness: 'appropriate' | 'borderline' | 'inappropriate' = 'appropriate'
        const inappropriateWords = ['sex', 'nude', 'naked', 'dirty', 'inappropriate']
        if (inappropriateWords.some(word => lowerMessage.includes(word))) {
            appropriateness = 'inappropriate'
        } else if (lowerMessage.includes('hot') || lowerMessage.includes('sexy')) {
            appropriateness = 'borderline'
        }

        // Generate suggestions
        const suggestions: string[] = []
        if (engagement === 'low') {
            suggestions.push('Try asking a question to encourage more engagement')
        }
        if (sentiment === 'neutral') {
            suggestions.push('Add more enthusiasm or positive energy')
        }
        if (!lowerMessage.includes('?')) {
            suggestions.push('Consider asking a question to keep the conversation flowing')
        }

        const responseQuality = Math.round(
            (sentiment === 'positive' ? 30 : sentiment === 'negative' ? 10 : 20) +
            (engagement === 'high' ? 30 : engagement === 'low' ? 10 : 20) +
            (appropriateness === 'appropriate' ? 30 : appropriateness === 'borderline' ? 15 : 5) +
            (suggestions.length === 0 ? 10 : 0)
        )

        return {
            sentiment,
            engagement,
            appropriateness,
            suggestions,
            timing: 'good',
            responseQuality,
        }
    }
}

// React Hook
export function useConversationCoach() {
    const [service] = useState(() => new ConversationCoach())
    const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null)
    const [advice, setAdvice] = useState<CoachingAdvice[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const analyzeMessage = useCallback(async (
        message: string,
        conversationContext: MessageAnalysis[]
    ) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await service.analyzeMessage(message, conversationContext)
            setAnalysis(result)
            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [service])

    const getCoachingAdvice = useCallback(async (
        message: string,
        conversationContext: MessageAnalysis[],
        userProfile: { personality: string; goals: string[] },
        matchProfile: { personality: string; interests: string[] }
    ) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await service.generateCoachingAdvice(
                message,
                conversationContext,
                userProfile,
                matchProfile
            )
            setAdvice(result)
            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Advice generation failed'
            setError(errorMessage)
            return []
        } finally {
            setIsLoading(false)
        }
    }, [service])

    const clearAnalysis = useCallback(() => {
        setAnalysis(null)
        setAdvice([])
        setError(null)
    }, [])

    return {
        analysis,
        advice,
        isLoading,
        error,
        analyzeMessage,
        getCoachingAdvice,
        clearAnalysis,
        clearCache: () => service.clearCache(),
        cacheSize: service.getCacheSize(),
    }
}

export default ConversationCoach

'use client'

import {useCallback, useState} from 'react'

interface MessageContext {
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
    userProfile: {
        name: string
        interests: string[]
        personality: 'casual' | 'formal' | 'flirty' | 'humorous'
    }
    matchProfile: {
        name: string
        interests: string[]
        personality: 'casual' | 'formal' | 'flirty' | 'humorous'
        lastMessage?: string
    }
    contextType: 'icebreaker' | 'continuation' | 'response' | 'question'
}

interface AutocompleteSuggestion {
    text: string
    confidence: number
    category: 'icebreaker' | 'question' | 'compliment' | 'response' | 'emoji'
    reasoning?: string
}

class MessageAutocomplete {
    private apiKey: string
    private baseUrl: string
    private cache: Map<string, AutocompleteSuggestion[]> = new Map()

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
        this.baseUrl = 'https://api.openai.com/v1/chat/completions'
    }

    public async generateSuggestions(context: MessageContext, partialMessage: string = ''): Promise<AutocompleteSuggestion[]> {
        return this.generateWithAI(context, partialMessage)
    }

    public clearCache(): void {
        this.cache.clear()
    }

    public getCacheSize(): number {
        return this.cache.size
    }

    private getCacheKey(context: MessageContext, partialMessage: string): string {
        const key = `${context.matchProfile.name}-${context.contextType}-${partialMessage.substring(0, 50)}`
        return key
    }

    private generatePrompt(context: MessageContext, partialMessage: string): string {
        const {conversationHistory, userProfile, matchProfile, contextType} = context

        let prompt = `You are an expert dating conversation coach. Generate appropriate message suggestions based on the following context:\n\n`
        prompt += `User Profile:\n- Name: ${userProfile.name}\n- Personality: ${userProfile.personality}\n- Interests: ${userProfile.interests.join(', ')}\n\n`
        prompt += `Match Profile:\n- Name: ${matchProfile.name}\n- Personality: ${matchProfile.personality}\n- Interests: ${matchProfile.interests.join(', ')}\n\n`

        if (conversationHistory.length > 0) {
            prompt += `Recent Conversation:\n`
            conversationHistory.slice(-3).forEach(msg => {
                prompt += `${msg.role}: ${msg.content}\n`
            })
            prompt += '\n'
        }

        if (partialMessage) {
            prompt += `Current partial message: "${partialMessage}"\n\n`
        }

        prompt += `Context Type: ${contextType}\n\n`

        switch (contextType) {
            case 'icebreaker':
                prompt += `Generate 3-4 engaging icebreaker messages that reference shared interests. Make them natural and not generic.`
                break
            case 'continuation':
                prompt += `Generate 3-4 natural ways to continue the conversation based on the last message.`
                break
            case 'response':
                prompt += `Generate 3-4 thoughtful responses to the last message. Show genuine interest.`
                break
            case 'question':
                prompt += `Generate 3-4 engaging questions that keep the conversation flowing and learn more about them.`
                break
        }

        prompt += `\n\nReturn a JSON array with objects containing:
    - text: the suggested message
    - confidence: number 0-1
    - category: "icebreaker" | "question" | "compliment" | "response" | "emoji"
    - reasoning: brief explanation of why this suggestion works

    Make suggestions authentic, not cheesy. Avoid overly generic pickup lines.`

        return prompt
    }

    private async generateWithAI(context: MessageContext, partialMessage: string): Promise<AutocompleteSuggestion[]> {
        const cacheKey = this.getCacheKey(context, partialMessage)

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        if (!this.apiKey) {
            return this.generateFallbackSuggestions(context, partialMessage)
        }

        try {
            const prompt = this.generatePrompt(context, partialMessage)

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
                            content: 'You are a helpful dating conversation coach. Always respond with valid JSON arrays.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            })

            if (!response.ok) {
                throw new Error('AI generation failed')
            }

            const data = await response.json()
            const content = data.choices[0]?.message?.content

            if (!content) {
                throw new Error('No content received')
            }

            try {
                const suggestions = JSON.parse(content)
                const validatedSuggestions = suggestions.map((suggestion: any) => ({
                    text: suggestion.text || '',
                    confidence: typeof suggestion.confidence === 'number' ? suggestion.confidence : 0.8,
                    category: ['icebreaker', 'question', 'compliment', 'response', 'emoji'].includes(suggestion.category)
                        ? suggestion.category
                        : 'response',
                    reasoning: suggestion.reasoning || '',
                }))

                this.cache.set(cacheKey, validatedSuggestions)
                return validatedSuggestions
            } catch (parseError) {
                console.error('Failed to parse AI response:', parseError)
                return this.generateFallbackSuggestions(context, partialMessage)
            }
        } catch (error) {
            console.error('AI generation error:', error)
            return this.generateFallbackSuggestions(context, partialMessage)
        }
    }

    private generateFallbackSuggestions(context: MessageContext, partialMessage: string): AutocompleteSuggestion[] {
        const {userProfile, matchProfile, contextType} = context

        const suggestions: AutocompleteSuggestion[] = []

        // Find common interests
        const commonInterests = userProfile.interests.filter(interest =>
            matchProfile.interests.includes(interest)
        )

        switch (contextType) {
            case 'icebreaker':
                if (commonInterests.length > 0) {
                    suggestions.push({
                        text: `Hey! I noticed we're both into ${commonInterests[0]}. What's your favorite thing about it?`,
                        confidence: 0.9,
                        category: 'icebreaker',
                        reasoning: 'References shared interest'
                    })
                }
                suggestions.push({
                    text: `Hi ${matchProfile.name}! Your profile caught my eye. How's your week going?`,
                    confidence: 0.7,
                    category: 'icebreaker',
                    reasoning: 'Personalized greeting'
                })
                break

            case 'continuation':
                suggestions.push({
                    text: `That's interesting! Tell me more about it.`,
                    confidence: 0.8,
                    category: 'question',
                    reasoning: 'Encourages elaboration'
                })
                if (commonInterests.length > 0) {
                    suggestions.push({
                        text: `Speaking of ${commonInterests[0]}, have you tried [related activity]?`,
                        confidence: 0.8,
                        category: 'question',
                        reasoning: 'Connects to shared interest'
                    })
                }
                break

            case 'response':
                suggestions.push({
                    text: `I totally agree! That's exactly how I feel about it.`,
                    confidence: 0.7,
                    category: 'response',
                    reasoning: 'Shows agreement and connection'
                })
                suggestions.push({
                    text: `That's a great perspective! I hadn't thought of it that way before.`,
                    confidence: 0.8,
                    category: 'response',
                    reasoning: 'Validates their opinion'
                })
                break

            case 'question':
                suggestions.push({
                    text: `What's been the highlight of your week so far?`,
                    confidence: 0.8,
                    category: 'question',
                    reasoning: 'Open-ended and positive'
                })
                suggestions.push({
                    text: `If you could travel anywhere right now, where would you go?`,
                    confidence: 0.7,
                    category: 'question',
                    reasoning: 'Reveals personality and dreams'
                })
                break
        }

        // Add emoji suggestions
        suggestions.push({
            text: '😊',
            confidence: 0.6,
            category: 'emoji',
            reasoning: 'Simple positive reaction'
        })

        return suggestions.slice(0, 4)
    }
}

// React Hook
export function useMessageAutocomplete() {
    const [service] = useState(() => new MessageAutocomplete())
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const generateSuggestions = useCallback(async (context: MessageContext, partialMessage: string = '') => {
        setIsLoading(true)
        setError(null)

        try {
            const results = await service.generateSuggestions(context, partialMessage)
            setSuggestions(results)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions'
            setError(errorMessage)
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }, [service])

    const clearSuggestions = useCallback(() => {
        setSuggestions([])
        setError(null)
    }, [])

    return {
        suggestions,
        isLoading,
        error,
        generateSuggestions,
        clearSuggestions,
        clearCache: () => service.clearCache(),
        cacheSize: service.getCacheSize(),
    }
}

export default MessageAutocomplete

'use client'

import {useCallback, useState} from 'react'

interface TranslationOptions {
    sourceLanguage?: string
    targetLanguage: string
    text: string
    context?: 'dating' | 'casual' | 'formal'
}

interface TranslationResult {
    translatedText: string
    sourceLanguage: string
    targetLanguage: string
    confidence: number
    alternatives?: string[]
}

class TranslationService {
    private apiKey: string
    private baseUrl: string
    private cache: Map<string, TranslationResult> = new Map()

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || ''
        this.baseUrl = 'https://translation.googleapis.com/language/translate/v2'
    }

    public async translate(options: TranslationOptions): Promise<TranslationResult> {
        if (this.apiKey) {
            return this.translateWithGoogle(options)
        } else {
            return this.fallbackTranslation(options)
        }
    }

    public async translateWithAlternatives(options: TranslationOptions): Promise<TranslationResult & {
        alternatives: string[]
    }> {
        const result = await this.translate(options)

        // Generate alternatives using different phrasing
        const alternatives = [
            result.translatedText,
            await this.generateAlternative(options, 'casual'),
            await this.generateAlternative(options, 'formal'),
        ].filter((alt, index, arr) => arr.indexOf(alt) === index) // Remove duplicates

        return {
            ...result,
            alternatives,
        }
    }

    public getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
        return [
            {code: 'en', name: 'English', nativeName: 'English'},
            {code: 'es', name: 'Spanish', nativeName: 'Español'},
            {code: 'fr', name: 'French', nativeName: 'Français'},
            {code: 'de', name: 'German', nativeName: 'Deutsch'},
            {code: 'it', name: 'Italian', nativeName: 'Italiano'},
            {code: 'pt', name: 'Portuguese', nativeName: 'Português'},
            {code: 'ru', name: 'Russian', nativeName: 'Русский'},
            {code: 'ja', name: 'Japanese', nativeName: '日本語'},
            {code: 'ko', name: 'Korean', nativeName: '한국어'},
            {code: 'zh', name: 'Chinese', nativeName: '中文'},
            {code: 'ar', name: 'Arabic', nativeName: 'العربية'},
            {code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'},
        ]
    }

    public clearCache(): void {
        this.cache.clear()
    }

    public getCacheSize(): number {
        return this.cache.size
    }

    private getCacheKey(options: TranslationOptions): string {
        return `${options.sourceLanguage || 'auto'}-${options.targetLanguage}-${options.text}-${options.context || 'default'}`
    }

    private async detectLanguage(text: string): Promise<string> {
        const cacheKey = `detect-${text.substring(0, 100)}`

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey)!
            return cached.sourceLanguage
        }

        try {
            const response = await fetch(`${this.baseUrl}/detect?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                }),
            })

            if (!response.ok) {
                throw new Error('Language detection failed')
            }

            const data = await response.json()
            const detectedLanguage = data.data.detections[0][0].language

            // Cache the detection
            this.cache.set(cacheKey, {
                translatedText: text,
                sourceLanguage: detectedLanguage,
                targetLanguage: detectedLanguage,
                confidence: 1.0,
            })

            return detectedLanguage
        } catch (error) {
            console.error('Language detection error:', error)
            return 'auto'
        }
    }

    private async translateWithGoogle(options: TranslationOptions): Promise<TranslationResult> {
        const cacheKey = this.getCacheKey(options)

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        try {
            const sourceLanguage = options.sourceLanguage || await this.detectLanguage(options.text)

            const requestBody: Record<string, unknown> = {
                q: options.text,
                source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
                target: options.targetLanguage,
                format: 'text',
            }

            // Add dating-specific context if available
            if (options.context === 'dating') {
                (requestBody as Record<string, unknown>).model = 'base'
            }

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                throw new Error('Translation failed')
            }

            const data = await response.json()
            const translatedText = data.data.translations[0].translatedText
            const detectedSourceLanguage = data.data.translations[0].detectedSourceLanguage || sourceLanguage

            const result: TranslationResult = {
                translatedText,
                sourceLanguage: detectedSourceLanguage,
                targetLanguage: options.targetLanguage,
                confidence: 0.95,
            }

            // Cache the result
            this.cache.set(cacheKey, result)

            return result
        } catch (error) {
            console.error('Translation error:', error)

            // Fallback to basic translation simulation
            return this.fallbackTranslation(options)
        }
    }

    private fallbackTranslation(options: TranslationOptions): TranslationResult {
        const cacheKey = this.getCacheKey(options)

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        // Simple fallback translation mapping for common dating phrases
        const fallbackTranslations: Record<string, Record<string, Record<string, string>>> = {
            'en': {
                'es': {
                    'hello': 'hola',
                    'how are you': 'cómo estás',
                    'nice to meet you': 'mucho gusto',
                    'would you like to meet': 'te gustaría conocerte',
                    'you look beautiful': 'te ves hermosa',
                    'can i have your number': 'puedo tener tu número',
                },
                'fr': {
                    'hello': 'bonjour',
                    'how are you': 'comment allez-vous',
                    'nice to meet you': 'ravi de vous rencontrer',
                    'would you like to meet': 'aimeriez-vous vous rencontrer',
                    'you look beautiful': 'vous avez l\'air magnifique',
                },
                'de': {
                    'hello': 'hallo',
                    'how are you': 'wie geht es dir',
                    'nice to meet you': 'schön, dich kennenzulernen',
                    'would you like to meet': 'möchtest du dich treffen',
                    'you look beautiful': 'du siehst wunderschön aus',
                },
            }
        }

        const sourceLang = options.sourceLanguage || 'en'
        const targetLang = options.targetLanguage
        const text = options.text.toLowerCase()

        let translatedText = options.text // Default to original text

        if (fallbackTranslations[sourceLang]?.[targetLang]) {
            const translations = fallbackTranslations[sourceLang]![targetLang] as Record<string, string>
            translatedText = translations[text] || options.text
        }

        const result: TranslationResult = {
            translatedText,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            confidence: 0.7,
        }

        this.cache.set(cacheKey, result)
        return result
    }

    private async generateAlternative(options: TranslationOptions, tone: 'casual' | 'formal'): Promise<string> {
        // Simple alternative generation based on tone
        const baseResult = await this.translate(options)
        let alternative = baseResult.translatedText

        if (tone === 'casual') {
            // Make it more casual
            alternative = alternative.replace(/you are/gi, "you're").replace(/I am/gi, "I'm")
        } else if (tone === 'formal') {
            // Make it more formal
            alternative = alternative.replace(/you're/gi, "you are").replace(/I'm/gi, "I am")
        }

        return alternative
    }
}

// React Hook
export function useTranslationService() {
    const [service] = useState(() => new TranslationService())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const translate = useCallback(async (options: TranslationOptions): Promise<TranslationResult | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await service.translate(options)
            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Translation failed'
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [service])

    const translateWithAlternatives = useCallback(async (options: TranslationOptions): Promise<(TranslationResult & {
        alternatives: string[]
    }) | null> => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await service.translateWithAlternatives(options)
            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Translation failed'
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [service])

    return {
        translate,
        translateWithAlternatives,
        isLoading,
        isReady: !isLoading, // Alias for enterprise page compatibility
        error,
        supportedLanguages: service.getSupportedLanguages(),
        clearCache: () => service.clearCache(),
        cacheSize: service.getCacheSize(),
    }
}

export default TranslationService

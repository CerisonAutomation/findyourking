'use client'

import {useState, useEffect} from 'react'

import {env, pipeline} from '@huggingface/transformers'

// Configure transformers.js for local processing
env.allowRemoteModels = true
env.localModelPath = '/models/'
env.backends.onnx.wasm!.wasmPaths = '/wasm/'

interface TransformersEngineConfig {
    modelType: 'text-generation' | 'sentiment-analysis' | 'translation' | 'feature-extraction'
    modelId?: string
    device?: 'cpu' | 'webgpu'
    dtype?: 'fp32' | 'fp16' | 'q8' | 'q4'
    quantized?: boolean
}

interface GenerationOptions {
    maxNewTokens?: number
    temperature?: number
    topK?: number
    topP?: number
    doSample?: boolean
    repetitionPenalty?: number
    padTokenId?: number
    eosTokenId?: number
}

interface SentimentResult {
    label: string
    score: number
}

interface TranslationResult {
    translation_text: string
}

interface EmbeddingResult {
    data: number[][]
}

class TransformersEngine {
    private models: Map<string, any> = new Map()
    private isInitialized = false

    constructor() {
        this.initializeModels()
    }

    public async generateText(prompt: string, options: GenerationOptions = {}): Promise<string[]> {
        if (!this.isInitialized || !this.models.has('text-generation')) {
            return this.fallbackGeneration(prompt, options)
        }

        try {
            const generator = this.models.get('text-generation')
            const generationOptions = {
                max_new_tokens: options.maxNewTokens || 50,
                temperature: options.temperature || 0.7,
                top_k: options.topK || 50,
                top_p: options.topP || 0.95,
                do_sample: options.doSample !== false,
                repetition_penalty: options.repetitionPenalty || 1.1,
                ...options
            }

            const result = await generator(prompt, generationOptions)
            return result.map((item: any) => item.generated_text)
        } catch (error) {
            console.error('Text generation failed:', error)
            return this.fallbackGeneration(prompt, options)
        }
    }

    public async analyzeSentiment(text: string): Promise<SentimentResult> {
        if (!this.isInitialized || !this.models.has('sentiment-analysis')) {
            return this.fallbackSentiment(text)
        }

        try {
            const analyzer = this.models.get('sentiment-analysis')
            const result = await analyzer(text)
            return Array.isArray(result) ? result[0] : result
        } catch (error) {
            console.error('Sentiment analysis failed:', error)
            return this.fallbackSentiment(text)
        }
    }

    public async generateEmbeddings(texts: string[]): Promise<EmbeddingResult> {
        if (!this.isInitialized || !this.models.has('feature-extraction')) {
            return this.fallbackEmbeddings(texts)
        }

        try {
            const extractor = this.models.get('feature-extraction')
            const result = await extractor(texts, {pooling: 'mean', normalize: true})
            return result
        } catch (error) {
            console.error('Embedding generation failed:', error)
            return this.fallbackEmbeddings(texts)
        }
    }

    public async classifyText(text: string, labels: string[]): Promise<Array<{ label: string; score: number }>> {
        // Zero-shot classification using embeddings
        const textEmbedding = await this.generateEmbeddings([text])
        const labelEmbeddings = await this.generateEmbeddings(labels)

        // Calculate cosine similarity
        const similarities = labels.map((label, index) => {
            const textVector = textEmbedding.data[0]
            const labelVector = labelEmbeddings.data[index]
            const similarity = this.cosineSimilarity(textVector, labelVector)
            return {label, score: similarity}
        })

        return similarities.sort((a, b) => b.score - a.score)
    }

    // Auto-reply generation based on context
    public async generateAutoReply(
        message: string,
        conversationHistory: string[] = [],
        personality: 'casual' | 'flirty' | 'humorous' | 'formal' = 'casual'
    ): Promise<string> {
        const sentiment = await this.analyzeSentiment(message)
        const context = conversationHistory.slice(-2).join(' ') + ' ' + message

        // Build personality-specific prompt
        const personalityPrompts = {
            casual: "You're having a casual conversation on a dating app. Be friendly and relaxed.",
            flirty: "You're flirting on a dating app. Be charming and playful, but not too aggressive.",
            humorous: "You're being humorous on a dating app. Use light humor and wit.",
            formal: "You're having a respectful conversation on a dating app. Be polite and considerate."
        }

        const prompt = `${personalityPrompts[personality]}\n\nConversation context: ${context}\n\nGenerate a natural response:`

        const responses = await this.generateText(prompt, {
            maxNewTokens: 30,
            temperature: 0.8,
            topK: 40,
        })

        return responses[0] || this.fallbackAutoReply(message, sentiment, personality)
    }

    // Quick reply suggestions
    public async generateQuickReplies(
        message: string,
        context: 'opening' | 'continuation' | 'question' | 'compliment' = 'continuation'
    ): Promise<string[]> {
        const contextPrompts = {
            opening: "Generate 3 opening lines for a dating app conversation based on:",
            continuation: "Generate 3 natural conversation continuations based on:",
            question: "Generate 3 engaging questions based on:",
            compliment: "Generate 3 tasteful compliments based on:"
        }

        const prompt = `${contextPrompts[context]} "${message}"`

        try {
            const responses = await this.generateText(prompt, {
                maxNewTokens: 20,
                temperature: 0.9,
                topK: 30,
            })

            return responses.slice(0, 3)
        } catch (error) {
            return this.fallbackQuickReplies(message, context)
        }
    }

    public isReady(): boolean {
        return this.isInitialized
    }

    public getModelStatus(): { [key: string]: boolean } {
        const status: { [key: string]: boolean } = {}
        this.models.forEach((model, key) => {
            status[key] = model !== undefined
        })
        return status
    }

    private async initializeModels() {
        try {
            // Initialize text generation model (local GPT-style)
            const textGenerator = await pipeline('text-generation', 'Xenova/distilgpt2', {
                device: 'webgpu' in navigator ? 'webgpu' : 'cpu',
                dtype: 'q4', // 4-bit quantization for performance
            })
            this.models.set('text-generation', textGenerator)

            // Initialize sentiment analysis
            const sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
                device: 'cpu',
                dtype: 'q8',
            })
            this.models.set('sentiment-analysis', sentimentAnalyzer)

            // Initialize feature extraction for embeddings
            const featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                device: 'cpu',
                dtype: 'q8',
            })
            this.models.set('feature-extraction', featureExtractor)

            this.isInitialized = true
            console.log('Transformers.js models initialized successfully')
        } catch (error) {
            console.error('Failed to initialize Transformers.js models:', error)
            this.isInitialized = false
        }
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0
        let normA = 0
        let normB = 0

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i]
            normA += vecA[i] * vecA[i]
            normB += vecB[i] * vecB[i]
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    // Fallback methods for when models fail to load
    private fallbackGeneration(prompt: string, options: GenerationOptions): string[] {
        const responses = [
            "That sounds interesting! Tell me more.",
            "I'd love to hear more about that.",
            "That's cool! What else do you enjoy?",
            "Nice! How has your day been?",
            "I'm intrigued, please continue."
        ]

        // Simple context-based response
        if (prompt.toLowerCase().includes('hobby') || prompt.toLowerCase().includes('interest')) {
            return ["That's a great hobby! I'd love to learn more about it."]
        }
        if (prompt.toLowerCase().includes('weekend') || prompt.toLowerCase().includes('plans')) {
            return ["Sounds like you have exciting plans! What are you most looking forward to?"]
        }

        return [responses[Math.floor(Math.random() * responses.length)]]
    }

    private fallbackSentiment(text: string): SentimentResult {
        const lowerText = text.toLowerCase()

        // Simple keyword-based sentiment analysis
        const positiveWords = ['love', 'great', 'awesome', 'amazing', 'fantastic', 'wonderful', 'excellent', 'good', 'happy', 'excited']
        const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'sad', 'angry', 'frustrated', 'disappointed', 'worst', 'horrible']

        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length

        if (positiveCount > negativeCount) {
            return {label: 'POSITIVE', score: 0.8}
        } else if (negativeCount > positiveCount) {
            return {label: 'NEGATIVE', score: 0.8}
        } else {
            return {label: 'NEUTRAL', score: 0.6}
        }
    }

    private fallbackEmbeddings(texts: string[]): EmbeddingResult {
        // Simple hash-based embeddings for fallback
        const embeddings = texts.map(text => {
            const vector = new Array(384).fill(0) // MiniLM dimension
            let hash = 0

            for (let i = 0; i < text.length; i++) {
                hash = ((hash << 5) - hash) + text.charCodeAt(i)
                hash = hash & hash // Convert to 32-bit integer
                vector[i % vector.length] = (hash % 100) / 100 // Normalize to 0-1
            }

            return vector
        })

        return {data: embeddings}
    }

    private fallbackAutoReply(message: string, sentiment: SentimentResult, personality: string): string {
        const replies = {
            casual: {
                positive: ["That sounds amazing! 😊", "I love that! Tell me more?", "Awesome! What else?"],
                neutral: ["Interesting! Tell me more.", "I see. What else?", "Got it. And?"],
                negative: ["I'm sorry to hear that. Is everything okay?", "That sounds tough. Want to talk about it?", "I understand. How can I help?"]
            },
            flirty: {
                positive: ["You sound amazing! 😉", "I'm intrigued by you...", "You've got my attention!"],
                neutral: ["Tell me something interesting about you.", "What makes you unique?", "I'd love to know more..."],
                negative: ["Let's change the mood to something lighter?", "How about we talk about something fun?", "I'd rather focus on the good stuff"]
            },
            humorous: {
                positive: ["Haha, you're awesome! 😄", "You've got a great sense of humor!", "I'm enjoying this conversation!"],
                neutral: ["Well, that's one way to put it! 😅", "Interesting take on things!", "You're keeping me on my toes!"],
                negative: ["Let's find something to smile about!", "I've got a joke that might help!", "Time for a mood booster?"]
            },
            formal: {
                positive: ["That's wonderful to hear.", "I appreciate you sharing that.", "That sounds very positive."],
                neutral: ["I understand. Thank you for explaining.", "That's interesting to know.", "I see your perspective."],
                negative: ["I'm sorry you're experiencing that.", "That sounds challenging.", "I hope things improve for you."]
            }
        }

        const personalityReplies = replies[personality as keyof typeof replies]
        const sentimentReplies = personalityReplies[sentiment.label.toLowerCase() as keyof typeof personalityReplies]

        return sentimentReplies[Math.floor(Math.random() * sentimentReplies.length)]
    }

    private fallbackQuickReplies(message: string, context: string): string[] {
        const replies = {
            opening: [
                "Hey! I noticed your profile and wanted to say hi.",
                "Your profile caught my eye. How's your day going?",
                "Hi there! I think we might have some things in common."
            ],
            continuation: [
                "That's interesting! Tell me more.",
                "I'd love to hear more about that.",
                "Really? What else can you tell me?"
            ],
            question: [
                "What do you enjoy doing in your free time?",
                "How has your week been so far?",
                "What's something that makes you happy?"
            ],
            compliment: [
                "You have a great way with words.",
                "I love your perspective on things.",
                "You seem like a really interesting person."
            ]
        }

        return replies[context as keyof typeof replies] || replies.continuation
    }
}

// React Hook
export function useTransformersEngine() {
    const [engine] = useState(() => new TransformersEngine())
    const [isReady, setIsReady] = useState(false)
    const [modelStatus, setModelStatus] = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        const checkStatus = () => {
            setIsReady(engine.isReady())
            setModelStatus(engine.getModelStatus())
        }

        checkStatus()
        const interval = setInterval(checkStatus, 1000)

        return () => clearInterval(interval)
    }, [engine])

    return {
        engine,
        isReady,
        modelStatus,
        generateText: engine.generateText.bind(engine),
        analyzeSentiment: engine.analyzeSentiment.bind(engine),
        generateEmbeddings: engine.generateEmbeddings.bind(engine),
        classifyText: engine.classifyText.bind(engine),
        generateAutoReply: engine.generateAutoReply.bind(engine),
        generateQuickReplies: engine.generateQuickReplies.bind(engine)
    }
}

export default TransformersEngine

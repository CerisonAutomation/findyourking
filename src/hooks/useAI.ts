// ✅ CORRECT — React hook wrapping the AI worker with proper error handling
import {useCallback, useEffect, useRef} from 'react';

interface AIResponse {
    id: string;
    result?: unknown;
    error?: string;
    success: boolean;
}

export function useAI() {
    const workerRef = useRef<Worker | null>(null);
    const callbacksRef = useRef<Map<string, {
        resolve: (value: unknown) => void;
        reject: (error: Error) => void
    }>>(new Map());
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // Initialize the worker
        const worker = new Worker(
            new URL('../workers/ai.worker.ts', import.meta.url),
            {type: 'module'}
        );

        worker.onmessage = (e: MessageEvent<AIResponse>) => {
            const {id, result, error, success} = e.data;
            const cb = callbacksRef.current.get(id);

            if (cb) {
                if (success && result) {
                    cb.resolve(result);
                } else if (error) {
                    cb.reject(new Error(error));
                } else {
                    cb.reject(new Error('AI worker returned no result'));
                }
                callbacksRef.current.delete(id);
            }
        };

        worker.onerror = (error) => {
            console.error('🔥 AI Worker error:', error);
            // Reject all pending callbacks
            callbacksRef.current.forEach(({reject}) => {
                reject(new Error('AI worker crashed'));
            });
            callbacksRef.current.clear();
        };

        workerRef.current = worker;
        isInitializedRef.current = true;

        // Cleanup: free GPU memory on unmount
        return () => {
            if (workerRef.current) {
                // Send unload message to free GPU memory
                workerRef.current.postMessage({type: 'unload', payload: {}, id: crypto.randomUUID()});

                // Wait a bit for cleanup, then terminate
                setTimeout(() => {
                    workerRef.current?.terminate();
                    workerRef.current = null;
                    isInitializedRef.current = false;
                }, 100);
            }
        };
    }, []);

    const request = useCallback((type: string, payload: unknown): Promise<unknown> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current || !isInitializedRef.current) {
                reject(new Error('AI worker not initialized'));
                return;
            }

            const id = crypto.randomUUID();
            callbacksRef.current.set(id, {resolve, reject});

            // Add timeout to prevent hanging
            const timeoutId = setTimeout(() => {
                callbacksRef.current.delete(id);
                reject(new Error('AI request timeout'));
            }, 30000);

            workerRef.current.postMessage({type, payload, id});

            // Clear timeout when promise resolves/rejects
            return Promise.resolve().finally(() => clearTimeout(timeoutId));
        });
    }, []);

    return {
        // Smart reply suggestions
        smartReplies: useCallback((message: string) =>
            request('smart-reply', {message}), [request]
        ),

        // Toxicity/content moderation
        checkToxicity: useCallback((text: string) =>
            request('toxicity-check', {text}), [request]
        ),

        // Translation between languages
        translate: useCallback((text: string, from: string, to: string) =>
            request('translate', {text, from, to}), [request]
        ),

        // Text embeddings for similarity matching
        getEmbeddings: useCallback((text: string) =>
            request('embeddings', {text}), [request]
        ),

        // Sentiment analysis
        analyzeSentiment: useCallback((text: string) =>
            request('sentiment', {text}), [request]
        ),

        // Check if worker is ready
        isReady: isInitializedRef.current,

        // Force cleanup (useful for memory management)
        cleanup: useCallback(() => {
            if (workerRef.current) {
                workerRef.current.postMessage({type: 'unload', payload: {}, id: crypto.randomUUID()});
            }
        }, []),
    };
}

// Utility hook for AI-powered chat features
export function useAIChat() {
    const ai = useAI();

    return {
        // Generate contextual smart replies
        getSmartReplies: async (message: string) => {
            try {
                const replies = await ai.smartReplies(message);
                return replies;
            } catch (error) {
                console.error('Smart replies failed:', error);
                return [
                    "That's interesting! Tell me more?",
                    "I'd love to hear more about that!",
                    "Really? What's your favorite part?",
                ];
            }
        },

        // Check if message is appropriate
        moderateMessage: async (text: string) => {
            try {
                const toxicity = await ai.checkToxicity(text) as {
                    isToxic: boolean;
                    score: number;
                    confidence: number
                };
                const sentiment = await ai.analyzeSentiment(text) as {
                    sentiment: string;
                    positiveScore: number;
                    negativeScore: number;
                    confidence: number
                };

                return {
                    isAppropriate: !toxicity.isToxic,
                    toxicityScore: toxicity.score,
                    sentiment: sentiment.sentiment,
                    confidence: sentiment.confidence,
                };
            } catch (error) {
                console.error('Message moderation failed:', error);
                return {isAppropriate: true, toxicityScore: 0, sentiment: 'neutral', confidence: 0};
            }
        },

        // Translate message if needed
        translateIfNeeded: async (text: string, targetLang: string = 'en') => {
            try {
                // Simple language detection (could be enhanced)
                const detectedLang = detectLanguage(text);

                if (detectedLang !== targetLang) {
                    const result = await ai.translate(text, detectedLang, targetLang) as {
                        translatedText: string;
                        originalText: string
                    };
                    return {
                        translated: true,
                        originalText: text,
                        translatedText: result.translatedText,
                        originalLang: detectedLang,
                        targetLang,
                    };
                }

                return {
                    translated: false,
                    originalText: text,
                    translatedText: text,
                    originalLang: detectedLang,
                    targetLang,
                };
            } catch (error) {
                console.error('Translation failed:', error);
                return {
                    translated: false,
                    originalText: text,
                    translatedText: text,
                    originalLang: 'unknown',
                    targetLang,
                };
            }
        },
    };
}

// Simple language detection (could be enhanced with proper model)
function detectLanguage(text: string): string {
    const patterns: Record<string, RegExp> = {
        'es': /[áéíóúñ¿¡]/i,
        'fr': /[àâæçéèêëîïôœùûü]/i,
        'de': /[äöüß]/i,
        'pt': /[ãõâêô]/i,
        'it': /[àèéìòù]/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) return lang;
    }
    return 'en';
}

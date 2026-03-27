// ✅ CORRECT — Transformers.js v4 API with WebGPU, in a Web Worker
// Based on HuggingFace's official February 2026 release
import {env, pipeline} from '@huggingface/transformers';

// Configure for local execution with WebGPU acceleration
env.localModelPath = '/models/'; // Serve models from your static dir
env.allowRemoteModels = true;     // Or false for full offline
env.useBrowserCache = true;
env.useWebGPU = true; // Enable WebGPU acceleration

let smartReply: any = null;
let toxicity: any = null;
let translator: any = null;
let embeddings: any = null;
let sentiment: any = null;

// Smart reply parsing function
function parseSmartReplies(generatedText: string): string[] {
    const replies: string[] = [];
    const lines = generatedText.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // Extract potential replies from generated text
        const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
        if (cleanLine.length > 5 && cleanLine.length < 100) {
            replies.push(cleanLine);
        }
    }

    // Fallback if no structured replies found
    if (replies.length === 0) {
        const fallbacks = [
            "That sounds interesting! Tell me more?",
            "I'd love to hear more about that!",
            "Really? What's your favorite part?",
            "That's cool! How did you get into that?",
        ];
        return fallbacks.slice(0, 3);
    }

    return replies.slice(0, 3);
}

async function initModels() {
    console.log('🤖 Initializing AI models with WebGPU...');

    // Load models in parallel for better performance
    const modelPromises = [
        // Smart replies - Phi-3-mini quantized for speed
        pipeline('text-generation', 'Xenova/Phi-3-mini-4k-instruct-q4', {
            device: 'webgpu',
            dtype: 'q4',
        }),

        // Toxicity detection - lightweight BERT
        pipeline('text-classification', 'Xenova/toxic-bert', {
            device: 'webgpu',
            dtype: 'q8',
        }),

        // Translation - multilingual model
        pipeline('translation', 'Xenova/nllb-200-distilled-600M', {
            device: 'webgpu',
            dtype: 'q8',
        }),

        // Embeddings - for similarity matching
        pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            device: 'webgpu',
            dtype: 'q8',
        }),

        // Sentiment analysis
        pipeline('text-classification', 'Xenova/distilbert-sst2-english', {
            device: 'webgpu',
            dtype: 'q8',
        }),
    ];

    try {
        [smartReply, toxicity, translator, embeddings, sentiment] = await Promise.all(modelPromises);
        console.log('✅ All AI models loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load models:', error);
        throw error;
    }
}

self.onmessage = async (e) => {
    const {type, payload, id} = e.data;

    try {
        let result;

        switch (type) {
            case 'smart-reply': {
                if (!smartReply) await initModels();

                const prompt = `Generate 3 natural, engaging dating app replies to this message. Keep them short, friendly, and not overly aggressive. Message: "${payload.message}"\n\nReplies:`;

                const out = await smartReply(prompt, {
                    max_new_tokens: 80,
                    temperature: 0.7,
                    do_sample: true,
                    pad_token_id: 50256, // EOS token
                });

                result = parseSmartReplies(out[0].generated_text);
                break;
            }

            case 'toxicity-check': {
                if (!toxicity) await initModels();

                const toxicResult = await toxicity(payload.text);
                const toxicScore = toxicResult.find((r: any) => r.label === 'toxic')?.score || 0;

                result = {
                    isToxic: toxicScore > 0.5,
                    score: toxicScore,
                    confidence: toxicScore
                };
                break;
            }

            case 'translate': {
                if (!translator) await initModels();

                const translationResult = await translator(payload.text, {
                    src_lang: payload.from,
                    tgt_lang: payload.to,
                });

                result = {
                    translatedText: translationResult[0]?.translation_text || payload.text,
                    originalText: payload.text
                };
                break;
            }

            case 'embeddings': {
                if (!embeddings) await initModels();

                const embeddingResult = await embeddings(payload.text);
                // Convert to simple array for storage/comparison
                result = Array.from(embeddingResult.data);
                break;
            }

            case 'sentiment': {
                if (!sentiment) await initModels();

                const sentimentResult = await sentiment(payload.text);
                const positiveScore = sentimentResult.find((r: any) => r.label === 'POSITIVE')?.score || 0;
                const negativeScore = sentimentResult.find((r: any) => r.label === 'NEGATIVE')?.score || 0;

                let sentimentLabel = 'neutral';
                if (positiveScore > 0.6) sentimentLabel = 'positive';
                else if (negativeScore > 0.6) sentimentLabel = 'negative';

                result = {
                    sentiment: sentimentLabel,
                    positiveScore,
                    negativeScore,
                    confidence: Math.max(positiveScore, negativeScore)
                };
                break;
            }

            case 'unload': {
                // Free GPU memory
                console.log('🧹 Unloading AI models and freeing GPU memory...');
                smartReply = null;
                toxicity = null;
                translator = null;
                embeddings = null;
                sentiment = null;

                // Force garbage collection if available
                if (global.gc) global.gc();

                result = {success: true};
                break;
            }

            default: {
                throw new Error(`Unknown AI worker command: ${type}`);
            }
        }

        self.postMessage({id, result, success: true});
    } catch (error: any) {
        console.error(`❌ AI Worker error (${type}):`, error);
        self.postMessage({
            id,
            error: error.message || 'Unknown AI worker error',
            success: false
        });
    }
};

// Handle worker termination
self.addEventListener('close', () => {
    console.log('🔌 AI Worker terminating');
    // Cleanup models
    smartReply = null;
    toxicity = null;
    translator = null;
    embeddings = null;
    sentiment = null;
});

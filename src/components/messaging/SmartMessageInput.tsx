'use client'

import {useEffect, useRef, useState} from 'react'
import {aiService} from '@/lib/ai/transformers-service'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Languages, Mic, MicOff, RefreshCw, Send, Sparkles, Volume2} from 'lucide-react'
import {cn} from '@/lib/utils'

// ============================================
// SMART MESSAGE INPUT WITH AI FEATURES
// ============================================

interface SmartInputProps {
    onSend: (message: string) => void
    placeholder?: string
    recipientLanguage?: string
    disabled?: boolean
}

export function SmartMessageInput({
                                      onSend,
                                      placeholder = "Type a message...",
                                      recipientLanguage = 'en',
                                      disabled = false
                                  }: SmartInputProps) {
    const [message, setMessage] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [isTranslating, setIsTranslating] = useState(false)
    const [translatedText, setTranslatedText] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [sentiment, setSentiment] = useState<{ emoji: string; score: number } | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // ============================================
    // AUTOCOMPLETE ON TYPING
    // ============================================
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (message.length >= 3) {
                const completions = await aiService.getAutocomplete(message)
                setSuggestions(completions)
                setShowSuggestions(completions.length > 0)

                // Also analyze sentiment
                const sent = await aiService.analyzeSentiment(message)
                setSentiment(sent)
            } else {
                setSuggestions([])
                setShowSuggestions(false)
                setSentiment(null)
            }
        }, 300) // Debounce 300ms

        return () => clearTimeout(timer)
    }, [message])

    // ============================================
    // TRANSLATE MESSAGE
    // ============================================
    const handleTranslate = async () => {
        if (!message.trim()) return

        setIsTranslating(true)
        try {
            const translated = await aiService.translateText(message, recipientLanguage)
            setTranslatedText(translated)
        } catch (error) {
            console.error('Translation failed:', error)
        }
        setIsTranslating(false)
    }

    // ============================================
    // VOICE INPUT - Whisper
    // ============================================
    const startVoiceInput = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true})
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, {type: 'audio/webm'})
                const arrayBuffer = await blob.arrayBuffer()
                const audioContext = new AudioContext()
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

                // Convert to Float32Array for Whisper
                const float32Data = audioBuffer.getChannelData(0)

                try {
                    const transcript = await aiService.transcribeAudio(float32Data)
                    setMessage(prev => prev + ' ' + transcript)
                } catch (error) {
                    console.error('Speech recognition failed:', error)
                }

                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setIsListening(true)
        } catch (error) {
            console.error('Microphone access denied:', error)
        }
    }

    const stopVoiceInput = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsListening(false)
        }
    }

    // ============================================
    // QUICK REPLY SUGGESTIONS
    // ============================================
    const generateQuickReplies = async () => {
        const replies = await aiService.generateQuickReplies(message)
        setSuggestions(replies)
        setShowSuggestions(true)
    }

    // ============================================
    // SEND MESSAGE
    // ============================================
    const handleSend = () => {
        const textToSend = translatedText || message
        if (textToSend.trim()) {
            onSend(textToSend.trim())
            setMessage('')
            setTranslatedText('')
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === 'Tab' && suggestions.length > 0) {
            e.preventDefault()
            setMessage(suggestions[0])
            setShowSuggestions(false)
        }
    }

    return (
        <div className="space-y-2">
            {/* Sentiment indicator */}
            {sentiment && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Tone: {sentiment.emoji}</span>
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all",
                                sentiment.score > 0.6 ? "bg-green-500" :
                                    sentiment.score < 0.4 ? "bg-red-500" : "bg-yellow-500"
                            )}
                            style={{width: `${sentiment.score * 100}%`}}
                        />
                    </div>
                </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <Card className="p-2 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-yellow-500"/>
                        <span className="text-sm font-medium">AI Suggestions</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={generateQuickReplies}
                            className="ml-auto h-6 px-2"
                        >
                            <RefreshCw className="h-3 w-3"/>
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setMessage(suggestion)
                                    setShowSuggestions(false)
                                    inputRef.current?.focus()
                                }}
                                className="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Translation preview */}
            {translatedText && (
                <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Translation:</p>
                            <p className="text-sm">{translatedText}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTranslatedText('')}
                            className="h-6 px-2"
                        >
                            ✕
                        </Button>
                    </div>
                </Card>
            )}

            {/* Main input area */}
            <div className="flex items-center gap-2">
                {/* Voice input button */}
                <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={isRecording ? stopVoiceInput : startVoiceInput}
                    disabled={disabled}
                    className={cn(
                        "shrink-0 transition-all",
                        isListening && "animate-pulse"
                    )}
                >
                    {isRecording ? (
                        <MicOff className="h-4 w-4"/>
                    ) : (
                        <Mic className="h-4 w-4"/>
                    )}
                </Button>

                {/* Text input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : placeholder}
                    disabled={disabled}
                    className="flex-1 px-4 py-2 border rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />

                {/* Translate button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleTranslate}
                    disabled={disabled || !message.trim() || isTranslating}
                    className="shrink-0"
                >
                    {isTranslating ? (
                        <RefreshCw className="h-4 w-4 animate-spin"/>
                    ) : (
                        <Languages className="h-4 w-4"/>
                    )}
                </Button>

                {/* AI suggest button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={generateQuickReplies}
                    disabled={disabled}
                    className="shrink-0"
                >
                    <Sparkles className="h-4 w-4"/>
                </Button>

                {/* Send button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && !translatedText.trim())}
                    size="icon"
                    className="shrink-0"
                >
                    <Send className="h-4 w-4"/>
                </Button>
            </div>

            {/* Voice recording indicator */}
            {isRecording && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-500">
                    <span className="animate-pulse">●</span>
                    Recording... Tap to stop
                </div>
            )}
        </div>
    )
}

// ============================================
// TRANSLATE MESSAGE BUBBLE
// ============================================

interface TranslateableMessageProps {
    text: string
    targetLanguage?: string
    className?: string
}

export function TranslateableMessage({
                                         text,
                                         targetLanguage = 'es',
                                         className
                                     }: TranslateableMessageProps) {
    const [showTranslation, setShowTranslation] = useState(false)
    const [translation, setTranslation] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleTranslate = async () => {
        if (translation) {
            setShowTranslation(!showTranslation)
            return
        }

        setIsLoading(true)
        try {
            const result = await aiService.translateText(text, targetLanguage)
            setTranslation(result)
            setShowTranslation(true)
        } catch (error) {
            console.error('Translation error:', error)
        }
        setIsLoading(false)
    }

    const speakText = (textToSpeak: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak)
            utterance.lang = targetLanguage
            speechSynthesis.speak(utterance)
        }
    }

    return (
        <div className={cn("space-y-1", className)}>
            <p>{text}</p>

            {showTranslation && translation && (
                <div className="p-2 bg-muted rounded-md text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Translation:</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => speakText(translation)}
                            className="h-6 w-6 p-0"
                        >
                            <Volume2 className="h-3 w-3"/>
                        </Button>
                    </div>
                    <p className="mt-1">{translation}</p>
                </div>
            )}

            <button
                onClick={handleTranslate}
                disabled={isLoading}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
                {isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin"/>
                ) : (
                    <Languages className="h-3 w-3"/>
                )}
                {showTranslation ? 'Hide' : 'Translate'}
            </button>
        </div>
    )
}

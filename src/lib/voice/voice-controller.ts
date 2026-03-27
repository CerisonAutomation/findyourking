'use client'

import {useCallback, useEffect, useState} from 'react'

interface VoiceCommand {
    command: string
    action: () => void
    description: string
}

interface VoiceControllerOptions {
    wakeWord?: string
    language?: string
    continuous?: boolean
    interimResults?: boolean
    maxAlternatives?: number
}

export class VoiceController {
    private recognition: SpeechRecognition | null = null
    private synthesis: SpeechSynthesis
    private isListening: boolean = false
    private wakeWordActive: boolean = false
    private commands: VoiceCommand[] = []
    private options: Required<VoiceControllerOptions>

    constructor(options: VoiceControllerOptions = {}) {
        this.options = {
            wakeWord: options.wakeWord || 'Hey Zenith',
            language: options.language || 'en-US',
            continuous: options.continuous || false,
            interimResults: options.interimResults || true,
            maxAlternatives: options.maxAlternatives || 1,
            ...options
        }

        this.synthesis = window.speechSynthesis
        this.initializeSpeechRecognition()
    }

    public addCommand(command: VoiceCommand): void {
        this.commands.push(command)
    }

    public removeCommand(command: string): void {
        this.commands = this.commands.filter(cmd => cmd.command !== command)
    }

    public startListening(): void {
        if (this.recognition && !this.isListening) {
            this.isListening = true
            this.recognition.start()
        }
    }

    public stopListening(): void {
        if (this.recognition && this.isListening) {
            this.isListening = false
            this.wakeWordActive = false
            this.recognition.stop()
        }
    }

    public say(text: string, options: SpeechSynthesisUtteranceOptions = {}): void {
        if (!this.synthesis) return

        // Cancel any ongoing speech
        this.synthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = this.options.language
        utterance.rate = options.rate || 1
        utterance.pitch = options.pitch || 1
        utterance.volume = options.volume || 1

        this.synthesis.speak(utterance)
    }

    public isSupported(): boolean {
        return !!(this.recognition && this.synthesis)
    }

    public getVoices(): SpeechSynthesisVoice[] {
        return this.synthesis.getVoices()
    }

    public setVoice(voiceIndex: number): void {
        const voices = this.getVoices()
        if (voices[voiceIndex]) {
            this.options.language = voices[voiceIndex].lang
        }
    }

    public destroy(): void {
        this.stopListening()
        this.commands = []
        if (this.synthesis) {
            this.synthesis.cancel()
        }
    }

    private initializeSpeechRecognition(): void {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported')
            return
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()

        this.recognition.continuous = this.options.continuous
        this.recognition.interimResults = this.options.interimResults
        this.recognition.lang = this.options.language
        this.recognition.maxAlternatives = this.options.maxAlternatives

        this.recognition.onresult = this.handleRecognitionResult.bind(this)
        this.recognition.onerror = this.handleRecognitionError.bind(this)
        this.recognition.onend = this.handleRecognitionEnd.bind(this)
    }

    private handleRecognitionResult(event: SpeechRecognitionEvent): void {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript.toLowerCase().trim()

        console.log('Voice recognized:', transcript)

        // Check for wake word
        if (transcript.includes(this.options.wakeWord.toLowerCase())) {
            this.wakeWordActive = true
            this.say('I\'m listening')
            return
        }

        // Process commands if wake word is active
        if (this.wakeWordActive) {
            this.processCommand(transcript)
            this.wakeWordActive = false
        }
    }

    private processCommand(transcript: string): void {
        for (const command of this.commands) {
            if (transcript.includes(command.command.toLowerCase())) {
                command.action()
                this.say(`Executing: ${command.description}`)
                return
            }
        }

        // Try smart command matching
        this.processSmartCommand(transcript)
    }

    private processSmartCommand(transcript: string): void {
        // Navigation commands
        if (transcript.includes('show me matches') || transcript.includes('go to matches')) {
            window.location.href = '/matches'
            this.say('Opening matches')
        } else if (transcript.includes('go to messages') || transcript.includes('show messages')) {
            window.location.href = '/messages'
            this.say('Opening messages')
        } else if (transcript.includes('go to profile') || transcript.includes('show profile')) {
            window.location.href = '/profile'
            this.say('Opening profile')
        }

        // Messaging commands
        else if (transcript.startsWith('send message to')) {
            const name = transcript.replace('send message to', '').trim()
            this.say(`Preparing message to ${name}`)
            // Trigger message composition
            this.triggerMessageComposition(name)
        }

        // Translation commands
        else if (transcript.startsWith('translate to')) {
            const language = transcript.replace('translate to', '').trim()
            this.say(`Activating translation to ${language}`)
            this.activateTranslation(language)
        }

        // Quick reply commands
        else if (transcript.startsWith('quick reply')) {
            const message = transcript.replace('quick reply', '').trim()
            this.say(`Sending quick reply: ${message}`)
            this.sendQuickReply(message)
        }

        // Voice call commands
        else if (transcript.includes('start voice call') || transcript.includes('call')) {
            this.say('Starting voice call')
            this.startVoiceCall()
        }

        // Timer commands
        else if (transcript.startsWith('set timer for')) {
            const time = transcript.replace('set timer for', '').trim()
            this.say(`Setting timer for ${time}`)
            this.setTimer(time)
        }

        // Discovery commands
        else if (transcript.startsWith('find nearby')) {
            const interest = transcript.replace('find nearby', '').trim()
            this.say(`Finding nearby ${interest}`)
            this.findNearby(interest)
        }

        // Privacy commands
        else if (transcript.includes('privacy mode on') || transcript.includes('go private')) {
            this.say('Activating privacy mode')
            this.togglePrivacyMode(true)
        } else if (transcript.includes('privacy mode off') || transcript.includes('go public')) {
            this.say('Deactivating privacy mode')
            this.togglePrivacyMode(false)
        } else {
            this.say('I didn\'t understand that command')
        }
    }

    private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
        console.error('Speech recognition error:', event.error)
        this.isListening = false
        this.wakeWordActive = false
    }

    private handleRecognitionEnd(): void {
        this.isListening = false

        // Restart listening if continuous mode is enabled
        if (this.options.continuous && this.recognition) {
            setTimeout(() => {
                this.startListening()
            }, 1000)
        }
    }

    private triggerMessageComposition(name: string): void {
        // Trigger message composition UI
        window.dispatchEvent(new CustomEvent('voice:compose-message', {detail: {recipient: name}}))
    }

    private activateTranslation(language: string): void {
        // Activate translation mode
        window.dispatchEvent(new CustomEvent('voice:activate-translation', {detail: {language}}))
    }

    private sendQuickReply(message: string): void {
        // Send quick reply
        window.dispatchEvent(new CustomEvent('voice:quick-reply', {detail: {message}}))
    }

    private startVoiceCall(): void {
        // Start voice call
        window.dispatchEvent(new CustomEvent('voice:start-call'))
    }

    private setTimer(time: string): void {
        // Set timer
        window.dispatchEvent(new CustomEvent('voice:set-timer', {detail: {time}}))
    }

    private findNearby(interest: string): void {
        // Find nearby people/places
        window.dispatchEvent(new CustomEvent('voice:find-nearby', {detail: {interest}}))
    }

    private togglePrivacyMode(enabled: boolean): void {
        // Toggle privacy mode
        window.dispatchEvent(new CustomEvent('voice:toggle-privacy', {detail: {enabled}}))
    }
}

// React Hook
export function useVoiceController(options: VoiceControllerOptions = {}) {
    const [controller, setController] = useState<VoiceController | null>(null)
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        const voiceController = new VoiceController(options)
        setController(voiceController)
        setIsSupported(voiceController.isSupported())

        return () => {
            voiceController.destroy()
        }
    }, [])

    const startListening = useCallback(() => {
        if (controller) {
            controller.startListening()
            setIsListening(true)
        }
    }, [controller])

    const stopListening = useCallback(() => {
        if (controller) {
            controller.stopListening()
            setIsListening(false)
        }
    }, [controller])

    const say = useCallback((text: string, options?: SpeechSynthesisUtteranceOptions) => {
        controller?.say(text, options)
    }, [controller])

    const addCommand = useCallback((command: VoiceCommand) => {
        controller?.addCommand(command)
    }, [controller])

    return {
        controller,
        isListening,
        isSupported,
        startListening,
        stopListening,
        say,
        addCommand
    }
}

// Type declarations
declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

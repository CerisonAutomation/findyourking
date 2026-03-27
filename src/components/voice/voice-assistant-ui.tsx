'use client'

import {useCallback, useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {
    ChevronDown,
    ChevronUp,
    Globe,
    MapPin,
    MessageSquare,
    Mic,
    MicOff,
    Phone,
    Settings,
    Shield,
    Timer,
    Volume2,
    VolumeX
} from 'lucide-react'
import {useVoiceController} from '@/lib/voice/voice-controller'
import {useTranslationService} from '@/lib/ai/translation-service'
import {useMessageAutocomplete} from '@/lib/ai/message-autocomplete'

interface VoiceAssistantUIProps {
    className?: string
}

export function VoiceAssistantUI({className}: VoiceAssistantUIProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [lastCommand, setLastCommand] = useState<string>('')
    const [translationMode, setTranslationMode] = useState<string>('')
    const [voiceHistory, setVoiceHistory] = useState<Array<{ command: string; response: string; timestamp: Date }>>([])

    const voiceController = useVoiceController({
        wakeWord: 'Hey King',
        language: 'en-US',
        continuous: true,
    })

    const translationService = useTranslationService()
    const messageAutocomplete = useMessageAutocomplete()

    useEffect(() => {
        if (!voiceController.isSupported) {
            console.warn('Voice control not supported')
            return
        }

        // Add voice event listeners
        const handleVoiceEvent = (event: CustomEvent) => {
            const {detail} = event
            console.log('Voice event:', event.type, detail)

            // Add to history
            setVoiceHistory(prev => [{
                command: event.type,
                response: JSON.stringify(detail),
                timestamp: new Date()
            }, ...prev.slice(0, 9)]) // Keep last 10
        }

        window.addEventListener('voice:compose-message', handleVoiceEvent as EventListener)
        window.addEventListener('voice:activate-translation', handleVoiceEvent as EventListener)
        window.addEventListener('voice:quick-reply', handleVoiceEvent as EventListener)
        window.addEventListener('voice:start-call', handleVoiceEvent as EventListener)
        window.addEventListener('voice:set-timer', handleVoiceEvent as EventListener)
        window.addEventListener('voice:find-nearby', handleVoiceEvent as EventListener)
        window.addEventListener('voice:toggle-privacy', handleVoiceEvent as EventListener)

        return () => {
            window.removeEventListener('voice:compose-message', handleVoiceEvent as EventListener)
            window.removeEventListener('voice:activate-translation', handleVoiceEvent as EventListener)
            window.removeEventListener('voice:quick-reply', handleVoiceEvent as EventListener)
            window.removeEventListener('voice:start-call', handleVoiceEvent as EventListener)
            window.removeEventListener('voice:set-timer', handleVoiceEvent as EventListener)
            window.removeEventListener('voice:find-nearby', handleVoiceEvent as EventListener)
            window.removeEventListener('voice:toggle-privacy', handleVoiceEvent as EventListener)
        }
    }, [voiceController.isSupported])

    const toggleListening = useCallback(() => {
        if (isListening) {
            voiceController.stopListening()
            setIsListening(false)
        } else {
            voiceController.startListening()
            setIsListening(true)
            setLastCommand('Started listening...')
        }
    }, [isListening, voiceController])

    const testVoiceCommand = useCallback((command: string) => {
        setLastCommand(command)
        voiceController.say(`Testing: ${command}`)
    }, [voiceController])

    const activateTranslationMode = useCallback((language: string) => {
        setTranslationMode(language)
        voiceController.say(`Translation mode activated for ${language}`)
    }, [voiceController])

    const voiceCommands = [
        {command: 'Show me matches', description: 'Navigate to matches', icon: MessageSquare},
        {command: 'Send message to...', description: 'Compose voice message', icon: MessageSquare},
        {command: 'Translate to...', description: 'Real-time translation', icon: Globe},
        {command: 'Start voice call', description: 'Begin voice call', icon: Phone},
        {command: 'Set timer for...', description: 'Meeting coordination', icon: Timer},
        {command: 'Find nearby...', description: 'Location discovery', icon: MapPin},
        {command: 'Privacy mode', description: 'Security toggle', icon: Shield},
    ]

    if (!voiceController.isSupported) {
        return (
            <Card className={className}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <VolumeX className="h-4 w-4"/>
                        <span className="text-sm">Voice control not supported in this browser</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Volume2 className="h-5 w-5"/>
                        Voice Assistant
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isListening && (
                            <Badge variant="secondary" className="animate-pulse">
                                Listening
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4"/> : <ChevronUp className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Main Voice Control */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={toggleListening}
                        size="lg"
                        className={isListening ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                        {isListening ? (
                            <MicOff className="h-5 w-5"/>
                        ) : (
                            <Mic className="h-5 w-5"/>
                        )}
                    </Button>

                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {isListening ? 'Listening for "Hey King"...' : 'Tap to start voice control'}
                        </p>
                        {lastCommand && (
                            <p className="text-xs text-muted-foreground">Last: {lastCommand}</p>
                        )}
                    </div>
                </div>

                {/* Expanded Controls */}
                {isExpanded && (
                    <div className="space-y-4">
                        {/* Voice Commands */}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Voice Commands</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {voiceCommands.map((cmd, index) => {
                                    const Icon = cmd.icon
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => testVoiceCommand(cmd.command)}
                                        >
                                            <Icon className="h-4 w-4 text-muted-foreground"/>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{cmd.command}</p>
                                                <p className="text-xs text-muted-foreground">{cmd.description}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Translation Mode */}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Quick Translation</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese'].map((lang) => (
                                    <Button
                                        key={lang}
                                        variant={translationMode === lang ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => activateTranslationMode(lang)}
                                    >
                                        <Globe className="h-3 w-3 mr-1"/>
                                        {lang}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Voice History */}
                        {voiceHistory.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Recent Voice Activity</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {voiceHistory.map((item, index) => (
                                        <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                                            <p className="font-medium">{item.command}</p>
                                            <p className="text-muted-foreground truncate">{item.response}</p>
                                            <p className="text-muted-foreground">
                                                {item.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2"/>
                                Voice Settings
                            </Button>
                            <Button variant="outline" size="sm"
                                    onClick={() => voiceController.say('Voice assistant ready')}>
                                <Volume2 className="h-4 w-4 mr-2"/>
                                Test Voice
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

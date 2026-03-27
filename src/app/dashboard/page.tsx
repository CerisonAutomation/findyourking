'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {VoiceAssistantUI} from '@/components/voice/voice-assistant-ui'
import {AICoachingPanel} from '@/components/ai/ai-coaching-panel'
import {AIChatInterface} from '@/components/ui/ai-chat-interface'
import {CommandPalette} from '@/components/ui/command-palette'
import {SearchResults} from '@/components/ui/search-results'
import {Activity, Brain, Command, Globe, Heart, MessageSquare, Mic, Rocket, Settings, Shield, Users} from 'lucide-react'

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
    const [currentMessage, setCurrentMessage] = useState('')
    const [voiceEnabled, setVoiceEnabled] = useState(false)
    const [translationEnabled, setTranslationEnabled] = useState(false)

    // Mock data for demonstration
    const conversationHistory = [
        {role: 'user' as const, content: 'Hey! How are you doing?', timestamp: new Date(Date.now() - 3600000)},
        {
            role: 'assistant' as const,
            content: 'I\'m doing great! Just finished a workout. How about you?',
            timestamp: new Date(Date.now() - 3000000)
        },
        {
            role: 'user' as const,
            content: 'Nice! I love staying active too. What kind of workouts do you do?',
            timestamp: new Date(Date.now() - 2400000)
        },
    ]

    const userProfile = {
        name: 'Alex',
        personality: 'casual' as const,
        goals: ['Find meaningful connections', 'Stay active', 'Travel more']
    }

    const matchProfile = {
        name: 'Jordan',
        personality: 'humorous' as const,
        interests: ['Fitness', 'Travel', 'Cooking', 'Hiking']
    }

    const searchResults = [
        {
            id: '1',
            type: 'user' as const,
            title: 'Sarah Chen',
            description: 'Adventure seeker and foodie looking for someone to explore new restaurants with.',
            image: '/api/placeholder/200/200',
            location: '2 km away',
            distance: 2,
            matchScore: 92,
            interests: ['Travel', 'Food', 'Photography'],
            verified: true,
            premium: true,
            lastActive: '5 minutes ago'
        },
        {
            id: '2',
            type: 'event' as const,
            title: 'Singles Hiking Adventure',
            description: 'Join us for a beautiful weekend hike in the mountains. Perfect for nature lovers!',
            location: 'Mountain Trail Park',
            date: 'This Saturday, 9 AM',
            attendees: 24,
            distance: 5
        },
        {
            id: '3',
            type: 'user' as const,
            title: 'Marcus Rodriguez',
            description: 'Music producer and DJ looking for someone who loves live music and late-night conversations.',
            image: '/api/placeholder/200/200',
            location: '8 km away',
            distance: 8,
            matchScore: 87,
            interests: ['Music', 'Art', 'Technology'],
            verified: true,
            lastActive: '1 hour ago'
        }
    ]

    useEffect(() => {
        // Keyboard shortcut for command palette
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setCommandPaletteOpen(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSuggestionSelect = (suggestion: string) => {
        setCurrentMessage(suggestion)
    }

    const features = [
        {
            icon: Mic,
            title: 'Voice Control',
            description: 'Control the entire app with voice commands',
            enabled: voiceEnabled
        },
        {
            icon: Globe,
            title: 'Real-time Translation',
            description: 'Chat in 50+ languages with instant translation',
            enabled: translationEnabled
        },
        {
            icon: Brain,
            title: 'AI Conversation Coach',
            description: 'Get real-time advice on your conversations',
            enabled: true
        },
        {
            icon: MessageSquare,
            title: 'Smart Autocomplete',
            description: 'AI-powered message suggestions',
            enabled: true
        },
        {icon: Heart, title: 'Advanced Matching', description: 'AI-enhanced compatibility scoring', enabled: true},
        {
            icon: Shield,
            title: 'Privacy Protection',
            description: 'Enterprise-grade security and privacy',
            enabled: true
        },
    ]

    const stats = [
        {label: 'Active Conversations', value: '12', change: '+2', icon: MessageSquare},
        {label: 'New Matches', value: '8', change: '+3', icon: Heart},
        {label: 'Messages Sent', value: '47', change: '+12', icon: MessageSquare},
        {label: 'Profile Views', value: '234', change: '+45', icon: Users},
    ]

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Rocket className="h-8 w-8 text-purple-600"/>
                            Zenith AI Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Million-times AI-powered dating experience
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCommandPaletteOpen(true)}
                        >
                            <Command className="h-4 w-4 mr-2"/>
                            Commands (⌘K)
                        </Button>
                        <Button size="sm">
                            <Settings className="h-4 w-4 mr-2"/>
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <Card key={index}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-xs text-green-600">{stat.change} today</p>
                                        </div>
                                        <Icon className="h-8 w-8 text-muted-foreground"/>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="voice">Voice Control</TabsTrigger>
                        <TabsTrigger value="ai-coach">AI Coach</TabsTrigger>
                        <TabsTrigger value="search">Discover</TabsTrigger>
                        <TabsTrigger value="chat">AI Chat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <Card key={index}
                                          className={feature.enabled ? 'border-green-200 dark:border-green-800' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`p-2 rounded-lg ${feature.enabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                                                    <Icon
                                                        className={`h-5 w-5 ${feature.enabled ? 'text-green-600' : 'text-muted-foreground'}`}/>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{feature.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                    {feature.enabled && (
                                                        <Badge variant="secondary" className="mt-2 text-xs">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Activity Feed */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5"/>
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">New match with Sarah Chen - 92% compatibility</span>
                                        <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm">Voice command: "Show me matches"</span>
                                        <span className="text-xs text-muted-foreground ml-auto">15 min ago</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm">AI coach suggested conversation improvement</span>
                                        <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="voice" className="space-y-6">
                        <VoiceAssistantUI/>

                        {/* Voice Commands Demo */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mic className="h-5 w-5"/>
                                    Voice Commands Demo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Navigation</h4>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>• "Show me matches"</p>
                                            <p>• "Go to messages"</p>
                                            <p>• "Open profile"</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Actions</h4>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>• "Send message to [name]"</p>
                                            <p>• "Translate to [language]"</p>
                                            <p>• "Start voice call"</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Discovery</h4>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>• "Find nearby [interest]"</p>
                                            <p>• "Set timer for [time]"</p>
                                            <p>• "Privacy mode on/off"</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Wake Word</h4>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>• "Hey Zenith" to activate</p>
                                            <p>• Hands-free control</p>
                                            <p>• Context-aware responses</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ai-coach" className="space-y-6">
                        <AICoachingPanel
                            currentMessage={currentMessage}
                            conversationHistory={conversationHistory}
                            userProfile={userProfile}
                            matchProfile={matchProfile}
                            onSuggestionSelect={handleSuggestionSelect}
                        />
                    </TabsContent>

                    <TabsContent value="search" className="space-y-6">
                        <SearchResults
                            query="nearby people"
                            results={searchResults}
                            loading={false}
                            onResultClick={(result) => console.log('Selected:', result)}
                            onLoadMore={() => console.log('Load more')}
                            hasMore={true}
                        />
                    </TabsContent>

                    <TabsContent value="chat" className="space-y-6">
                        <AIChatInterface/>
                    </TabsContent>
                </Tabs>

                {/* Command Palette */}
                <CommandPalette
                    open={commandPaletteOpen}
                    onOpenChange={setCommandPaletteOpen}
                />
            </div>
        </div>
    )
}

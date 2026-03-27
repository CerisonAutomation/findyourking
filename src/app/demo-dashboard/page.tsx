'use client'

import {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {VoiceAssistantUI} from '@/components/voice/voice-assistant-ui'
import {AICoachingPanel} from '@/components/ai/ai-coaching-panel'
import {AutoReplyPanel} from '@/components/automation/auto-reply-panel'
import {AIChatInterface} from '@/components/ui/ai-chat-interface'
import {CommandPalette} from '@/components/ui/command-palette'
import {SearchResults} from '@/components/ui/search-results'
import {useTransformersEngine} from '@/lib/ai/transformers-engine'
import {useTranslationService} from '@/lib/ai/translation-service'
import {useAutoReplyEngine} from '@/lib/automation/auto-reply-engine'
import {Activity, Bot, Brain, Cpu, Globe, Languages, Mic, Shield, Sparkles, Zap} from 'lucide-react'

export default function DemoDashboardPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
    const [searchQuery] = useState('')
    const transformersEngine = useTransformersEngine()
    const translationService = useTranslationService()
    const autoReplyEngine = useAutoReplyEngine()

    // Mock search results
    const searchResults = [
        {
            id: '1',
            type: 'user' as const,
            title: 'Sarah Chen',
            description: 'AI researcher, loves hiking and photography',
            avatar: '/api/placeholder/40/40',
            status: 'online' as const,
        },
        {
            id: '2',
            type: 'event' as const,
            title: 'AI Ethics Conference 2024',
            description: 'Annual conference on AI ethics and responsible development',
            date: '2024-03-15',
            location: 'San Francisco, CA',
        },
        {
            id: '3',
            type: 'content' as const,
            title: 'Introduction to Neural Networks',
            description: 'Comprehensive guide to understanding neural networks',
            category: 'Education',
            readTime: '5 min',
        },
    ]

    // AI Features
    const aiFeatures = [
        {
            icon: Cpu,
            title: 'Transformers.js AI',
            description: 'Advanced AI models running directly in your browser',
            status: transformersEngine.isReady,
        },
        {
            icon: Languages,
            title: 'Real-time Translation',
            description: 'Break language barriers with instant translation',
            status: translationService.isReady,
        },
        {
            icon: Bot,
            title: 'Auto-Reply Engine',
            description: 'AI-powered smart responses for your conversations',
            status: autoReplyEngine.isEnabled,
        },
        {
            icon: Mic,
            title: 'Voice Assistant',
            description: 'Control everything with your voice',
            status: 'active',
        },
    ]

    // Performance metrics
    const performanceMetrics = [
        {
            label: 'AI Models Loaded',
            value: Object.values(transformersEngine.modelStatus).filter(Boolean).length,
            total: 4
        },
        {
            label: 'Active Rules',
            value: autoReplyEngine.rules.filter((r: { enabled: boolean }) => r.enabled).length,
            total: autoReplyEngine.rules.length
        },
        {label: 'Voice Commands', value: 15, total: 15},
        {label: 'Translation Languages', value: translationService.supportedLanguages.length, total: 50},
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Demo Dashboard
                    </h1>
                    <p className="text-xl text-cyan-400/70 max-w-3xl mx-auto">
                        Advanced AI-powered dating platform with enterprise features and cutting-edge technology
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {performanceMetrics.map((metric, index) => (
                        <Card key={index} className="bg-slate-800/50 border-cyan-400/20 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="text-3xl font-bold text-cyan-400 mb-2">
                                    {metric.value}/{metric.total}
                                </div>
                                <div className="text-sm text-cyan-400/70">{metric.label}</div>
                                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                                    <div
                                        className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full"
                                        style={{width: `${(metric.value / metric.total) * 100}%`}}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-cyan-400/20">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-400/20">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="ai-features" className="data-[state=active]:bg-cyan-400/20">
                            AI Features
                        </TabsTrigger>
                        <TabsTrigger value="automation" className="data-[state=active]:bg-cyan-400/20">
                            Automation
                        </TabsTrigger>
                        <TabsTrigger value="search" className="data-[state=active]:bg-cyan-400/20">
                            Search
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-slate-800/50 border-cyan-400/20 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5"/>
                                        Platform Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <Brain className="w-8 h-8 text-purple-400"/>
                                            <div>
                                                <div className="font-semibold text-white">Neural Matching</div>
                                                <div className="text-sm text-cyan-400/70">AI-powered compatibility</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-8 h-8 text-green-400"/>
                                            <div>
                                                <div className="font-semibold text-white">Privacy First</div>
                                                <div className="text-sm text-cyan-400/70">End-to-end encryption</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-8 h-8 text-yellow-400"/>
                                            <div>
                                                <div className="font-semibold text-white">Lightning Fast</div>
                                                <div className="text-sm text-cyan-400/70">Real-time connections</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-8 h-8 text-blue-400"/>
                                            <div>
                                                <div className="font-semibold text-white">Global Reach</div>
                                                <div className="text-sm text-cyan-400/70">Connect worldwide</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/50 border-cyan-400/20 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                                        <Activity className="w-5 h-5"/>
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div
                                            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium text-white">New match found</div>
                                                    <div className="text-sm text-cyan-400/70">AI compatibility: 94%
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-cyan-400/50">2 min ago</span>
                                        </div>
                                        <div
                                            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium text-white">Message received</div>
                                                    <div className="text-sm text-cyan-400/70">From Sarah Chen</div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-cyan-400/50">5 min ago</span>
                                        </div>
                                        <div
                                            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium text-white">Profile viewed</div>
                                                    <div className="text-sm text-cyan-400/70">3 people today</div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-cyan-400/50">1 hour ago</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="ai-features" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {aiFeatures.map((feature, index) => (
                                <Card key={index} className="bg-slate-800/50 border-cyan-400/20 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-cyan-400 flex items-center gap-2">
                                            <feature.icon className="w-5 h-5"/>
                                            {feature.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-cyan-400/70 mb-4">{feature.description}</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                typeof feature.status === 'boolean'
                                                    ? feature.status ? 'bg-green-400' : 'bg-gray-400'
                                                    : 'bg-green-400'
                                            }`}></div>
                                            <span className="text-sm text-cyan-400/50">
                        {typeof feature.status === 'boolean'
                            ? feature.status ? 'Active' : 'Inactive'
                            : 'Active'
                        }
                      </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <VoiceAssistantUI/>
                            <AICoachingPanel
                                currentMessage=""
                                conversationHistory={[]}
                                userProfile={{
                                    name: 'Demo User',
                                    personality: 'casual',
                                    goals: ['Find meaningful connections'],
                                }}
                                matchProfile={{
                                    name: 'Sarah',
                                    personality: 'casual',
                                    interests: ['Technology', 'Hiking', 'Photography'],
                                }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="automation" className="space-y-6">
                        <AutoReplyPanel/>
                        <AIChatInterface/>
                    </TabsContent>

                    <TabsContent value="search" className="space-y-6">
                        <CommandPalette
                            open={commandPaletteOpen}
                            onOpenChange={setCommandPaletteOpen}
                        />
                        <SearchResults query={searchQuery} results={searchResults}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

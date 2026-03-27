'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {AlertTriangle, Brain, CheckCircle, Info, Lightbulb, MessageSquare, Sparkles, TrendingUp} from 'lucide-react'
import {useConversationCoach} from '@/lib/ai/conversation-coach'
import {useMessageAutocomplete} from '@/lib/ai/message-autocomplete'

interface AICoachingPanelProps {
    currentMessage: string
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
    userProfile: {
        name: string
        personality: 'casual' | 'formal' | 'flirty' | 'humorous'
        goals: string[]
        interests: string[]
    }
    matchProfile: {
        name: string
        personality: 'casual' | 'formal' | 'flirty' | 'humorous'
        interests: string[]
    }
    onSuggestionSelect?: (suggestion: string) => void
    interests: string[]
    className?: string
}

export function AICoachingPanel({
                                    currentMessage,
                                    conversationHistory,
                                    userProfile,
                                    matchProfile,
                                    onSuggestionSelect,
                                    className
                                }: AICoachingPanelProps) {
    const [activeTab, setActiveTab] = useState('analysis')
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const conversationCoach = useConversationCoach()
    const messageAutocomplete = useMessageAutocomplete()

    const messageAnalysis = conversationHistory.map(msg => ({
        message: msg.content,
        timestamp: msg.timestamp,
        analysis: {
            sentiment: 'neutral' as const,
            engagement: 'medium' as const,
            appropriateness: 'appropriate' as const,
            suggestions: [],
            timing: 'good' as const,
            responseQuality: 75
        }
    }))

    useEffect(() => {
        if (currentMessage) {
            setIsAnalyzing(true)

            conversationCoach.analyzeMessage(currentMessage, messageAnalysis).then(() => {
                setIsAnalyzing(false)
            })

            conversationCoach.getCoachingAdvice(
                currentMessage,
                messageAnalysis,
                userProfile,
                matchProfile
            ).then(() => {
                setIsAnalyzing(false)
            })

            messageAutocomplete.generateSuggestions({
                conversationHistory,
                userProfile,
                matchProfile,
                contextType: conversationHistory.length === 0 ? 'icebreaker' : 'continuation'
            })
        }
    }, [currentMessage])

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return <TrendingUp className="h-4 w-4 text-green-500"/>
            case 'negative':
                return <AlertTriangle className="h-4 w-4 text-red-500"/>
            default:
                return <MessageSquare className="h-4 w-4 text-gray-500"/>
        }
    }

    const getEngagementColor = (engagement: string) => {
        switch (engagement) {
            case 'high':
                return 'bg-green-500'
            case 'low':
                return 'bg-red-500'
            default:
                return 'bg-yellow-500'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'destructive'
            case 'medium':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    const analysis = conversationCoach.analysis
    const advice = conversationCoach.advice
    const suggestions = messageAutocomplete.suggestions

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5"/>
                        AI Dating Coach
                    </CardTitle>
                    {isAnalyzing && (
                        <Badge variant="secondary" className="animate-pulse">
                            Analyzing...
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="analysis">Analysis</TabsTrigger>
                        <TabsTrigger value="advice">Advice</TabsTrigger>
                        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="analysis" className="space-y-4 mt-4">
                        {analysis ? (
                            <>
                                {/* Sentiment Analysis */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Sentiment</span>
                                        <div className="flex items-center gap-2">
                                            {getSentimentIcon(analysis.sentiment)}
                                            <span className="text-sm capitalize">{analysis.sentiment}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Engagement Level */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Engagement</span>
                                        <span className="text-sm capitalize">{analysis.engagement}</span>
                                    </div>
                                    <Progress
                                        value={analysis.engagement === 'high' ? 100 : analysis.engagement === 'medium' ? 60 : 20}
                                        className="h-2"
                                    />
                                </div>

                                {/* Response Quality */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Response Quality</span>
                                        <span className="text-sm">{analysis.responseQuality}%</span>
                                    </div>
                                    <Progress value={analysis.responseQuality} className="h-2"/>
                                </div>

                                {/* Appropriateness */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Appropriateness</span>
                                        <Badge
                                            variant={analysis.appropriateness === 'appropriate' ? 'default' : 'destructive'}>
                                            {analysis.appropriateness}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                {analysis.suggestions.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-sm font-medium">Improvement Suggestions</span>
                                        <div className="space-y-1">
                                            {analysis.suggestions.map((suggestion, index) => (
                                                <div key={index}
                                                     className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                                                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5"/>
                                                    <p className="text-sm">{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                                <p className="text-sm text-muted-foreground">
                                    Type a message to get AI analysis and coaching
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="advice" className="space-y-4 mt-4">
                        {advice.length > 0 ? (
                            <div className="space-y-3">
                                {advice.map((item, index) => {
                                    const Icon = item.category === 'red-flag' ? AlertTriangle :
                                        item.category === 'timing' ? Info : Lightbulb

                                    return (
                                        <div key={index} className="p-3 border rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <Icon className="h-5 w-5 mt-0.5"/>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium capitalize">
                              {item.category.replace('-', ' ')}
                            </span>
                                                        <Badge variant={getPriorityColor(item.priority)}
                                                               className="text-xs">
                                                            {item.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm mb-2">{item.advice}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.reasoning}
                                                    </p>
                                                    <div className="mt-2">
                                                        <Progress value={item.confidence * 100} className="h-1"/>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Confidence: {Math.round(item.confidence * 100)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                                <p className="text-sm text-muted-foreground">
                                    No coaching advice available yet
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="suggestions" className="space-y-4 mt-4">
                        {suggestions.length > 0 ? (
                            <div className="space-y-2">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => onSuggestionSelect?.(suggestion.text)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm mb-2">{suggestion.text}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {suggestion.category}
                                                    </Badge>
                                                    <Progress value={suggestion.confidence * 100} className="h-1 w-16"/>
                                                    <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost">
                                                <CheckCircle className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                                <p className="text-sm text-muted-foreground">
                                    No suggestions available yet
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Bot, Brain, Clock, MessageSquare, Play, Plus, Settings, Star, Trash2, TrendingUp, Zap} from 'lucide-react'
import {type AutoReplyRule, type ConversationContext, useAutoReplyEngine} from '@/lib/automation/auto-reply-engine'

interface AutoReplyPanelProps {
    className?: string
    conversationContext?: ConversationContext
    onReplyGenerated?: (reply: string) => void
}

export function AutoReplyPanel({
                                   className,
                                   conversationContext,
                                   onReplyGenerated
                               }: AutoReplyPanelProps) {
    const [activeTab, setActiveTab] = useState('rules')
    const [testMessage, setTestMessage] = useState('')
    const [generatedReply, setGeneratedReply] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const {
        engine,
        isEnabled,
        rules,
        generateReply,
        addRule,
        removeRule,
        toggleRule,
        enable,
        disable
    } = useAutoReplyEngine()

    useEffect(() => {
        if (conversationContext && isEnabled) {
            // Auto-generate replies for incoming messages
            const lastMessage = conversationContext.messages[conversationContext.messages.length - 1]
            if (lastMessage && lastMessage.sender === 'match') {
                handleTestReply(lastMessage.content)
            }
        }
    }, [conversationContext?.messages, isEnabled])

    const handleTestReply = async (message: string) => {
        if (!conversationContext) {
            setGeneratedReply('Please set up conversation context to test auto-replies')
            return
        }

        setIsGenerating(true)
        setGeneratedReply(null)

        try {
            const reply = await generateReply(message, conversationContext)

            if (reply) {
                setGeneratedReply(reply.text)
                onReplyGenerated?.(reply.text)
            } else {
                setGeneratedReply('No matching rule found for this message')
            }
        } catch (error) {
            setGeneratedReply('Error generating reply')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleToggleEngine = () => {
        if (isEnabled) {
            disable()
        } else {
            enable()
        }
    }

    const getPriorityIcon = (priority: number) => {
        if (priority >= 8) return <Star className="h-4 w-4 text-yellow-500"/>
        if (priority >= 5) return <TrendingUp className="h-4 w-4 text-blue-500"/>
        return <Zap className="h-4 w-4 text-gray-500"/>
    }

    const getPersonalityBadge = (personality: string) => {
        const colors = {
            casual: 'bg-blue-100 text-blue-800',
            flirty: 'bg-pink-100 text-pink-800',
            humorous: 'bg-purple-100 text-purple-800',
            formal: 'bg-gray-100 text-gray-800'
        }
        return colors[personality as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bot className="h-5 w-5"/>
                        Auto-Reply Engine
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={isEnabled}
                                onCheckedChange={handleToggleEngine}
                            />
                            <span className="text-sm">{isEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        {isEnabled && (
                            <Badge variant="secondary" className="animate-pulse">
                                Active
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="rules">Rules</TabsTrigger>
                        <TabsTrigger value="test">Test</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="rules" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            {rules.map((rule) => (
                                <div key={rule.id} className="p-3 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getPriorityIcon(rule.priority)}
                                            <span className="font-medium text-sm">{rule.id}</span>
                                            <Badge variant="outline"
                                                   className={getPersonalityBadge(rule.response.personality)}>
                                                {rule.response.personality}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={rule.enabled}
                                                onCheckedChange={() => toggleRule(rule.id)}
                                                size="sm"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeRule(rule.id)}
                                            >
                                                <Trash2 className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium">Triggers:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {rule.trigger.keywords.map((keyword, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {keyword}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="font-medium">Templates:</span>
                                            <div className="mt-1 space-y-1">
                                                {rule.response.templates.slice(0, 2).map((template, index) => (
                                                    <p key={index} className="text-xs text-muted-foreground italic">
                                                        "{template}"
                                                    </p>
                                                ))}
                                                {rule.response.templates.length > 2 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        +{rule.response.templates.length - 2} more
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3"/>
                                                {rule.response.delay.min}s - {rule.response.delay.max}s
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3"/>
                                                Priority: {rule.priority}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button className="w-full">
                            <Plus className="h-4 w-4 mr-2"/>
                            Add Custom Rule
                        </Button>
                    </TabsContent>

                    <TabsContent value="test" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Test Message</label>
                                <textarea
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    placeholder="Type a message to test auto-reply generation..."
                                    className="w-full mt-1 p-2 border rounded-lg resize-none h-20"
                                />
                            </div>

                            <Button
                                onClick={() => handleTestReply(testMessage)}
                                disabled={!testMessage.trim() || isGenerating || !conversationContext}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <Brain className="h-4 w-4 mr-2 animate-spin"/>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2"/>
                                        Generate Reply
                                    </>
                                )}
                            </Button>

                            {generatedReply && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="h-4 w-4"/>
                                        <span className="font-medium text-sm">Generated Reply</span>
                                    </div>
                                    <p className="text-sm">{generatedReply}</p>
                                </div>
                            )}
                        </div>

                        {!conversationContext && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Set up conversation context to test auto-replies with realistic scenarios.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Active Rules</p>
                                            <p className="text-2xl font-bold">
                                                {rules.filter(rule => rule.enabled).length}
                                            </p>
                                        </div>
                                        <Settings className="h-8 w-8 text-muted-foreground"/>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Rules</p>
                                            <p className="text-2xl font-bold">{rules.length}</p>
                                        </div>
                                        <Bot className="h-8 w-8 text-muted-foreground"/>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Engine Status</p>
                                            <p className="text-2xl font-bold">
                                                {isEnabled ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                        <div
                                            className={`w-8 h-8 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}/>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Avg Response Time</p>
                                            <p className="text-2xl font-bold">
                                                {rules.length > 0
                                                    ? Math.round(rules.reduce((acc, rule) =>
                                                        acc + (rule.response.delay.min + rule.response.delay.max) / 2, 0
                                                    ) / rules.length)
                                                    : 0}s
                                            </p>
                                        </div>
                                        <Clock className="h-8 w-8 text-muted-foreground"/>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium">Rule Performance</h4>
                            <div className="space-y-2">
                                {rules.slice(0, 5).map((rule) => (
                                    <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}/>
                                            <span className="text-sm font-medium">{rule.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                Priority: {rule.priority}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                        {rule.response.delay.min}s-{rule.response.delay.max}s
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

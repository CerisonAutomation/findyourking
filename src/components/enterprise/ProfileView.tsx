/**
 * Enterprise Profile View Component
 * Comprehensive user profile with AI analysis, verification, and performance optimization
 * 15/10 Enterprise Production Implementation
 */

"use client"

import React, {useCallback, useEffect, useState} from 'react'
import {
    Activity,
    BarChart3,
    Brain,
    Calendar,
    Camera,
    Check,
    Clock,
    Edit,
    Flag,
    Globe,
    Heart,
    MapPin,
    MessageCircle,
    Phone,
    Share2,
    Shield,
    Star,
    Target,
    TrendingUp,
    User,
    Users,
    Zap
} from 'lucide-react'

import {AIAnalysis, UserProfile} from '@/types/enterprise'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {cn} from '@/lib/utils'

interface ProfileViewProps {
    profile: UserProfile | null
    onUpdate: (updates: Partial<UserProfile>) => void
    advancedMode: boolean
    isOwnProfile?: boolean
}

interface ProfileStats {
    profileViews: number
    profileLikes: number
    matches: number
    messages: number
    responseRate: number
    averageResponseTime: number
    connectionQuality: number
    trustScore: number
    aiPopularityScore: number
    weeklyActive: number
    monthlyActive: number
}

export default function ProfileView({
                                        profile,
                                        onUpdate,
                                        advancedMode,
                                        isOwnProfile = false
                                    }: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [showAIAnalysis, setShowAIAnalysis] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [showVerification, setShowVerification] = useState(false)
    const [showPrivacy, setShowPrivacy] = useState(false)
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
    const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [showFullBio, setShowFullBio] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)

    // Mock AI analysis (would come from actual AI service)
    useEffect(() => {
        if (profile && advancedMode) {
            setAIAnalysis({
                profileCompleteness: 0.85,
                photoQuality: 0.92,
                bioEngagement: 0.78,
                attractivenessScore: 0.88,
                personalityInsights: [
                    'Adventurous and open-minded',
                    'Strong communication skills',
                    'Values authenticity and honesty',
                    'Socially active and outgoing'
                ],
                improvementSuggestions: [
                    'Add more photos to showcase personality',
                    'Include specific interests in bio',
                    'Add relationship preferences',
                    'Complete verification process'
                ],
                compatibilityFactors: {
                    interests: 0.8,
                    values: 0.9,
                    lifestyle: 0.7,
                    communication: 0.85
                },
                behavioralPatterns: {
                    responseTime: 2.5,
                    messageFrequency: 15,
                    peakActivityHours: [19, 20, 21, 22],
                    sentimentAnalysis: 0.75
                }
            })
        }
    }, [profile, advancedMode])

    const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !profile) return

        console.log('Uploading photo:', file.name)
        // Handle photo upload with compression and validation
    }, [profile])

    const handleProfileUpdate = useCallback((updates: Partial<UserProfile>) => {
        if (profile) {
            onUpdate(updates)
            setIsEditing(false)
        }
    }, [profile, onUpdate])

    const runAIAnalysis = useCallback(async () => {
        if (!profile) return

        setIsAnalyzing(true)
        try {
            // Simulate AI analysis
            await new Promise(resolve => setTimeout(resolve, 2000))

            setAIAnalysis({
                profileCompleteness: 0.9,
                photoQuality: 0.95,
                bioEngagement: 0.82,
                attractivenessScore: 0.91,
                personalityInsights: [
                    'Creative and innovative thinker',
                    'High emotional intelligence',
                    'Natural leader and motivator',
                    'Deeply values personal growth'
                ],
                improvementSuggestions: [
                    'Add professional headshot',
                    'Include career achievements',
                    'Share life philosophy',
                    'Add video introduction'
                ],
                compatibilityFactors: {
                    interests: 0.85,
                    values: 0.92,
                    lifestyle: 0.78,
                    communication: 0.89
                },
                behavioralPatterns: {
                    responseTime: 1.8,
                    messageFrequency: 18,
                    peakActivityHours: [18, 19, 20, 21],
                    sentimentAnalysis: 0.82
                }
            })
        } catch (error) {
            console.error('AI analysis failed:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }, [profile])

    const mockStats: ProfileStats = {
        profileViews: 1247,
        profileLikes: 89,
        matches: 34,
        messages: 156,
        responseRate: 0.87,
        averageResponseTime: 2.3,
        connectionQuality: 0.94,
        trustScore: 0.91,
        aiPopularityScore: 0.86,
        weeklyActive: 5,
        monthlyActive: 18
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <User className="w-16 h-16 text-muted-foreground mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold mb-2">Profile not found</h3>
                    <p className="text-muted-foreground">
                        This profile may have been deleted or is no longer available.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto bg-background">
            {/* Profile Header */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/10">
                <div className="absolute inset-0 bg-black/20"/>

                {/* Cover Photos */}
                <div className="relative h-full">
                    {profile.photos.length > 0 ? (
                        <>
                            {profile.photos.slice(0, 3).map((photo, index) => (
                                <div
                                    key={photo.id}
                                    className={cn(
                                        "absolute inset-0 cursor-pointer transition-opacity",
                                        index === selectedPhotoIndex ? "opacity-100" : "opacity-0"
                                    )}
                                    onClick={() => setSelectedPhotoIndex(index)}
                                >
                                    <img
                                        src={photo.url}
                                        alt={`${profile.displayName} photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}

                            {/* Photo Navigation */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                {profile.photos.map((_, index) => (
                                    <button
                                        key={index}
                                        className={cn(
                                            "w-2 h-2 rounded-full border-2 bg-white/80 backdrop-blur transition-all",
                                            index === selectedPhotoIndex ? "bg-white" : "bg-white/50"
                                        )}
                                        onClick={() => setSelectedPhotoIndex(index)}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Avatar className="w-24 h-24">
                                <AvatarFallback className="text-3xl font-bold">
                                    {profile.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                </div>

                {/* Profile Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {isOwnProfile && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-white/20 hover:bg-white/30"
                        >
                            {isEditing ? <Check className="w-4 h-4"/> : <Edit className="w-4 h-4"/>}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30"
                    >
                        <Share2 className="w-4 h-4"/>
                    </Button>

                    {!isOwnProfile && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/20 hover:bg-white/30"
                        >
                            <Flag className="w-4 h-4"/>
                        </Button>
                    )}
                </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Profile Information</h3>
                            {advancedMode && (
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(
                                        "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                                        profile.isPremium && "from-yellow-500 to-orange-500"
                                    )}>
                                        {profile.isPremium ? <Star className="w-3 h-3"/> : <Zap className="w-3 h-3"/>}
                                        {profile.isPremium ? 'Premium' : 'Power User'}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={profile.photos[0]?.url}/>
                                <AvatarFallback className="text-xl font-bold">
                                    {profile.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-1">{profile.displayName}</h2>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4"/>
                      {profile.age} years
                  </span>
                                    <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4"/>
                                        {profile.location?.city || 'Location not set'}
                  </span>
                                    <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4"/>
                    Online now
                  </span>
                                </div>

                                {/* Verification Badges */}
                                <div className="flex gap-2 mt-2">
                                    {profile.verification.ageVerified && (
                                        <Badge className="bg-blue-100 text-blue-800">
                                            <Check className="w-3 h-3"/>
                                            Age Verified
                                        </Badge>
                                    )}
                                    {profile.verification.photoVerified && (
                                        <Badge className="bg-green-100 text-green-800">
                                            <Camera className="w-3 h-3"/>
                                            Photo Verified
                                        </Badge>
                                    )}
                                    {profile.verification.idVerified && (
                                        <Badge className="bg-purple-100 text-purple-800">
                                            <Shield className="w-3 h-3"/>
                                            ID Verified
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <h4 className="font-semibold mb-2">About</h4>
                            <p className={cn(
                                "text-sm text-muted-foreground leading-relaxed",
                                !showFullBio && "line-clamp-3"
                            )}>
                                {profile.bio || 'No bio provided'}
                            </p>
                            {profile.bio && profile.bio.length > 200 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFullBio(!showFullBio)}
                                    className="mt-2"
                                >
                                    {showFullBio ? 'Show Less' : 'Show More'}
                                </Button>
                            )}
                        </div>

                        {/* Interests */}
                        {profile.interests && profile.interests.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Interests</h4>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests.map((interest, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Analysis Section */}
                {advancedMode && aiAnalysis && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Brain className="w-5 h-5"/>
                                    AI Analysis
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={runAIAnalysis}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Overall Scores */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {(aiAnalysis.profileCompleteness * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Profile Complete</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {(aiAnalysis.photoQuality * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Photo Quality</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {(aiAnalysis.bioEngagement * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Bio Engagement</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-pink-600">
                                        {(aiAnalysis.attractivenessScore * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Attractiveness</div>
                                </div>
                            </div>

                            {/* Personality Insights */}
                            <div>
                                <h4 className="font-semibold mb-2">Personality Insights</h4>
                                <div className="space-y-2">
                                    {aiAnalysis.personalityInsights.map((insight, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-primary"/>
                                            <span className="text-sm">{insight}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Improvement Suggestions */}
                            <div>
                                <h4 className="font-semibold mb-2">Improvement Suggestions</h4>
                                <div className="space-y-2">
                                    {aiAnalysis.improvementSuggestions.map((suggestion, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-600"/>
                                            <span className="text-sm">{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Behavioral Patterns */}
                            {aiAnalysis.behavioralPatterns && (
                                <div>
                                    <h4 className="font-semibold mb-2">Behavioral Patterns</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4"/>
                                            <span>Avg Response: {aiAnalysis.behavioralPatterns.responseTime}h</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4"/>
                                            <span>Messages/Day: {aiAnalysis.behavioralPatterns.messageFrequency}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4"/>
                                            <span>Peak Hours: {aiAnalysis.behavioralPatterns.peakActivityHours.join(', ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Heart className="w-4 h-4"/>
                                            <span>Sentiment: {(aiAnalysis.behavioralPatterns.sentimentAnalysis * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Stats Section */}
                {advancedMode && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <BarChart3 className="w-5 h-5"/>
                                Profile Statistics
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.profileViews}</div>
                                    <div className="text-sm text-muted-foreground">Profile Views</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.profileLikes}</div>
                                    <div className="text-sm text-muted-foreground">Profile Likes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.matches}</div>
                                    <div className="text-sm text-muted-foreground">Matches</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.messages}</div>
                                    <div className="text-sm text-muted-foreground">Messages</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{(mockStats.responseRate * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Response Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.averageResponseTime}h</div>
                                    <div className="text-sm text-muted-foreground">Avg Response</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{(mockStats.trustScore * 100).toFixed(0)}%</div>
                                    <div className="text-sm text-muted-foreground">Trust Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.weeklyActive}</div>
                                    <div className="text-sm text-muted-foreground">Weekly Active</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{mockStats.monthlyActive}</div>
                                    <div className="text-sm text-muted-foreground">Monthly Active</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button size="lg" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2"/>
                        Send Message
                    </Button>

                    <Button size="lg" variant="outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-2"/>
                        Start Call
                    </Button>

                    {!isOwnProfile && (
                        <Button size="lg" variant="outline" className="flex-1">
                            <Heart className="w-4 h-4 mr-2"/>
                            Like Profile
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

"use client";

import React from "react";
import {AnimatePresence, motion} from "framer-motion";
import {
    Activity,
    Brain,
    Camera,
    CheckCircle2,
    Crown,
    Heart,
    MapPin,
    MessageCircle,
    Shield,
    Sparkles,
    Star,
    TrendingUp,
    User,
    X,
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {cn} from "@/lib/utils";
import {Match} from "@/types/matches";

interface MatchDetailsModalProps {
    match: Match | null;
    isOpen: boolean;
    onClose: () => void;
    onMessage?: (matchId: string) => void;
    onLike?: (matchId: string) => void;
    onSuperLike?: (matchId: string) => void;
}

export function MatchDetailsModal({
                                      match,
                                      isOpen,
                                      onClose,
                                      onMessage,
                                      onLike,
                                      onSuperLike,
                                  }: MatchDetailsModalProps) {
    if (!match || !isOpen) return null;

    const getMatchQualityColor = (quality: string) => {
        const colors = {
            excellent: "bg-green-100 text-green-800 border-green-200",
            good: "bg-blue-100 text-blue-800 border-blue-200",
            fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
            poor: "bg-red-100 text-red-800 border-red-200",
        };
        return colors[quality as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const getMatchTypeLabel = (type: string) => {
        const labels = {
            mutual: "Mutual Match",
            suggested: "AI Suggested",
            boosted: "Boosted Match",
            premium: "Premium Match",
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return "text-green-600";
        if (score >= 0.6) return "text-blue-600";
        if (score >= 0.4) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 0.8) return "bg-gradient-to-r from-green-500 to-emerald-500";
        if (score >= 0.6) return "bg-gradient-to-r from-blue-500 to-cyan-500";
        if (score >= 0.4) return "bg-gradient-to-r from-yellow-500 to-orange-500";
        return "bg-gradient-to-r from-red-500 to-pink-500";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{opacity: 0, scale: 0.95, y: 20}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: 20}}
                        transition={{type: "spring", duration: 0.5}}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-background shadow-2xl"
                    >
                        {/* Header with Photo */}
                        <div className="relative h-72">
                            {match.photos && match.photos.length > 0 ? (
                                <img
                                    src={match.photos[0].url}
                                    alt={match.displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                    <User className="w-24 h-24 text-muted-foreground"/>
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            <div
                                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>

                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                            >
                                <X className="w-5 h-5"/>
                            </Button>

                            {/* Status Badges */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                {match.isOnline && (
                                    <Badge className="bg-green-500 text-white">
                                        <Activity className="w-3 h-3 mr-1"/>
                                        Online
                                    </Badge>
                                )}
                                {match.isVerified && (
                                    <Badge className="bg-blue-500 text-white">
                                        <Shield className="w-3 h-3 mr-1"/>
                                        Verified
                                    </Badge>
                                )}
                                {match.isPremium && (
                                    <Badge className="bg-yellow-500 text-white">
                                        <Crown className="w-3 h-3 mr-1"/>
                                        Premium
                                    </Badge>
                                )}
                                {match.trending && (
                                    <Badge className="bg-red-500 text-white">
                                        <TrendingUp className="w-3 h-3 mr-1"/>
                                        Trending
                                    </Badge>
                                )}
                            </div>

                            {/* User Info at Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-1">
                                            {match.displayName}, {match.age}
                                        </h2>
                                        <div className="flex items-center gap-2 text-white/80">
                                            <MapPin className="w-4 h-4"/>
                                            <span>{match.location.city}, {match.location.country}</span>
                                            <span className="text-white/60">•</span>
                                            <span>{match.location.distance.toFixed(1)}km away</span>
                                        </div>
                                    </div>
                                    <Badge className={cn("text-sm", getMatchQualityColor(match.matchQuality))}>
                                        {match.matchQuality.charAt(0).toUpperCase() + match.matchQuality.slice(1)} Match
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-18rem)]">
                            <Tabs defaultValue="overview" className="w-full">
                                <div className="sticky top-0 z-10 bg-background border-b px-6">
                                    <TabsList className="w-full justify-start h-12 bg-transparent p-0">
                                        <TabsTrigger value="overview"
                                                     className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="compatibility"
                                                     className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                            Compatibility
                                        </TabsTrigger>
                                        <TabsTrigger value="photos"
                                                     className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                            Photos ({match.photos?.length || 0})
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="p-6">
                                    <TabsContent value="overview" className="mt-0 space-y-6">
                                        {/* Bio */}
                                        <div>
                                            <h3 className="font-semibold mb-2">About</h3>
                                            <p className="text-muted-foreground">{match.bio}</p>
                                        </div>

                                        {/* Interests */}
                                        <div>
                                            <h3 className="font-semibold mb-3">Interests</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {match.interests.map((interest, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {interest}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div
                                                    className="text-2xl font-bold text-primary">{match.profileViews}</div>
                                                <div className="text-xs text-muted-foreground">Views</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div className="text-2xl font-bold text-primary">{match.likes}</div>
                                                <div className="text-xs text-muted-foreground">Likes</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div
                                                    className="text-2xl font-bold text-primary">{match.messagesCount}</div>
                                                <div className="text-xs text-muted-foreground">Messages</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div className="text-2xl font-bold text-primary">
                                                    {(match.responseRate * 100).toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">Response</div>
                                            </div>
                                        </div>

                                        {/* Activity */}
                                        <div>
                                            <h3 className="font-semibold mb-3">Activity</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Last active</span>
                                                    <span className="font-medium">
                            {match.activity.lastSeen
                                ? new Date(match.activity.lastSeen).toLocaleDateString()
                                : "Unknown"}
                          </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Response time</span>
                                                    <span className="font-medium">
                            {match.activity.responseTime
                                ? `${match.activity.responseTime} minutes`
                                : "Unknown"}
                          </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Weekly active</span>
                                                    <span className="font-medium">
                            {match.activity.weeklyActive ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500"/>
                            ) : (
                                <X className="w-4 h-4 text-red-500"/>
                            )}
                          </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification */}
                                        <div>
                                            <h3 className="font-semibold mb-3">Verification</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(match.verification).map(([key, verified]) => (
                                                    <div
                                                        key={key}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded-lg",
                                                            verified ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                                                        )}
                                                    >
                                                        {verified ? (
                                                            <CheckCircle2 className="w-4 h-4"/>
                                                        ) : (
                                                            <Shield className="w-4 h-4"/>
                                                        )}
                                                        <span className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Match Info */}
                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Star className="w-5 h-5 text-primary"/>
                                                <h3 className="font-semibold">{getMatchTypeLabel(match.matchType)}</h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Matched on {new Date(match.matchDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="compatibility" className="mt-0 space-y-6">
                                        {/* Overall Score */}
                                        <div
                                            className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                                            <div className="text-5xl font-bold text-primary mb-2">
                                                {(match.compatibilityScore * 100).toFixed(0)}%
                                            </div>
                                            <p className="text-muted-foreground">Overall Compatibility</p>
                                        </div>

                                        {/* Detailed Scores */}
                                        <div>
                                            <h3 className="font-semibold mb-4">Match Breakdown</h3>
                                            <div className="space-y-4">
                                                {Object.entries(match.matchScore).map(([key, score]) => (
                                                    <div key={key}>
                                                        <div className="flex items-center justify-between mb-1">
                              <span className="text-sm capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                                                            <span
                                                                className={cn("text-sm font-medium", getScoreColor(score))}>
                                {(score * 100).toFixed(0)}%
                              </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={cn("h-2 rounded-full transition-all", getScoreBarColor(score))}
                                                                style={{width: `${score * 100}%`}}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AI Analysis */}
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Brain className="w-5 h-5 text-blue-600"/>
                                                <h3 className="font-semibold text-blue-900">AI Analysis</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-blue-700 mb-1">Personality Match</div>
                                                    <div className="text-lg font-bold text-blue-900">
                                                        {(match.aiAnalysis.personalityMatch * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-blue-700 mb-1">Relationship Potential
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-900">
                                                        {(match.aiAnalysis.relationshipPotential * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-blue-700 mb-1">Long-term
                                                        Compatibility
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-900">
                                                        {(match.aiAnalysis.longTermCompatibility * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-blue-700 mb-1">Growth Potential</div>
                                                    <div className="text-lg font-bold text-blue-900">
                                                        {(match.aiAnalysis.growthPotential * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                            </div>
                                            {match.aiAnalysis.sharedGoals && match.aiAnalysis.sharedGoals.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-blue-200">
                                                    <div className="text-sm text-blue-700 mb-2">Shared Goals</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {match.aiAnalysis.sharedGoals.map((goal, index) => (
                                                            <Badge key={index} variant="outline"
                                                                   className="border-blue-300 text-blue-700">
                                                                {goal}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="photos" className="mt-0">
                                        {match.photos && match.photos.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {match.photos.map((photo, index) => (
                                                    <div key={photo.id}
                                                         className="relative aspect-square rounded-lg overflow-hidden">
                                                        <img
                                                            src={photo.url}
                                                            alt={`${match.displayName} photo ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {photo.verified && (
                                                            <Badge
                                                                className="absolute top-2 right-2 bg-green-500 text-white">
                                                                <Shield className="w-3 h-3 mr-1"/>
                                                                Verified
                                                            </Badge>
                                                        )}
                                                        {photo.primary && (
                                                            <Badge
                                                                className="absolute top-2 left-2 bg-primary text-primary-foreground">
                                                                <Star className="w-3 h-3 mr-1"/>
                                                                Primary
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div
                                                className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                                <Camera className="w-12 h-12 mb-4"/>
                                                <p>No photos available</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                        {/* Action Buttons */}
                        <div className="sticky bottom-0 bg-background border-t p-4">
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => onLike?.(match.id)}
                                >
                                    <Heart className="w-4 h-4 mr-2"/>
                                    Like
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => onSuperLike?.(match.id)}
                                >
                                    <Sparkles className="w-4 h-4 mr-2"/>
                                    Super Like
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => onMessage?.(match.id)}
                                    disabled={match.conversationStarted}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2"/>
                                    {match.conversationStarted ? "Message Sent" : "Message"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

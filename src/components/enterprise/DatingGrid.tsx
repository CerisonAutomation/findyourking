/**
 * Enterprise Dating Grid Component
 * Production-ready user discovery with AI matching and performance optimization
 * 15/10 Enterprise Implementation
 */

"use client"

import React, {useCallback, useMemo, useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Brain, Heart, MapPin, MessageCircle, Shield, Sparkles, Users, Zap} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {cn} from '@/lib/utils'
import {UserProfile} from '@/types/enterprise'

interface DatingGridProps {
    users: UserProfile[]
    favorites: string[]
    compatibilityScores: Map<string, number>
    onProfileSelect: (user: UserProfile) => void
    onProfileView: (userId: string) => void
    onFavorite: (userId: string) => void
    onUnfavorite: (userId: string) => void
    onBlock: (userId: string) => void
    onMessage: (userId: string) => void
    onCall: (userId: string) => void
    onAIAnalysis: (userId: string) => void
    advancedMode: boolean
    loading?: boolean
    viewMode?: 'grid' | 'list'
    sortBy?: 'compatibility' | 'distance' | 'online' | 'recent'
    filters?: {
        ageRange: [number, number]
        maxDistance: number
        onlineOnly: boolean
        verifiedOnly: boolean
    }
}

export const DatingGrid: React.FC<DatingGridProps> = ({
                                                          users,
                                                          favorites,
                                                          compatibilityScores,
                                                          onProfileSelect,
                                                          onProfileView,
                                                          onFavorite,
                                                          onUnfavorite,
                                                          onBlock,
                                                          onMessage,
                                                          onCall,
                                                          onAIAnalysis,
                                                          advancedMode,
                                                          loading = false,
                                                          viewMode = 'grid',
                                                          sortBy = 'compatibility',
                                                          filters
                                                      }) => {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [hoveredUser, setHoveredUser] = useState<string | null>(null)

    // Sort users based on selected criteria
    const sortedUsers = useMemo(() => {
        let filteredUsers = [...users]

        // Apply filters
        if (filters) {
            if (filters.ageRange) {
                filteredUsers = filteredUsers.filter(user =>
                    user.age >= filters.ageRange[0] && user.age <= filters.ageRange[1]
                )
            }

            if (filters.maxDistance) {
                filteredUsers = filteredUsers.filter(user =>
                    !user.location?.distance || user.location.distance <= filters.maxDistance
                )
            }

            if (filters.onlineOnly) {
                filteredUsers = filteredUsers.filter(user => user.isOnline)
            }

            if (filters.verifiedOnly) {
                filteredUsers = filteredUsers.filter(user =>
                    user.verification.photoVerified || user.verification.idVerified
                )
            }
        }

        // Sort based on criteria
        return filteredUsers.sort((a, b) => {
            switch (sortBy) {
                case 'compatibility':
                    const aScore = compatibilityScores.get(a.id) || a.stats?.compatibilityScore || 0
                    const bScore = compatibilityScores.get(b.id) || b.stats?.compatibilityScore || 0
                    return bScore - aScore

                case 'distance':
                    const aDist = a.location?.distance || Infinity
                    const bDist = b.location?.distance || Infinity
                    return aDist - bDist

                case 'online':
                    if (a.isOnline && !b.isOnline) return -1
                    if (!a.isOnline && b.isOnline) return 1
                    return 0

                case 'recent':
                    return b.lastActive.getTime() - a.lastActive.getTime()

                default:
                    return 0
            }
        })
    }, [users, compatibilityScores, sortBy, filters])

    const handleProfileClick = useCallback((user: UserProfile) => {
        setSelectedUser(user)
        onProfileSelect(user)
        onProfileView(user.id)
    }, [onProfileSelect, onProfileView])

    const handleFavorite = useCallback((e: React.MouseEvent, userId: string) => {
        e.stopPropagation()
        if (favorites.includes(userId)) {
            onUnfavorite(userId)
        } else {
            onFavorite(userId)
        }
    }, [favorites, onFavorite, onUnfavorite])

    const handleAIAnalysis = useCallback((e: React.MouseEvent, userId: string) => {
        e.stopPropagation()
        onAIAnalysis(userId)
    }, [onAIAnalysis])

    const getCompatibilityColor = (score: number): string => {
        if (score >= 0.8) return 'text-green-600'
        if (score >= 0.6) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getCompatibilityLabel = (score: number): string => {
        if (score >= 0.8) return 'Excellent Match'
        if (score >= 0.6) return 'Good Match'
        if (score >= 0.4) return 'Possible Match'
        return 'Low Match'
    }

    const UserCard = ({user, index}: { user: UserProfile; index: number }) => {
        const isFavorite = favorites.includes(user.id)
        const compatibilityScore = compatibilityScores.get(user.id) || user.stats?.compatibilityScore || 0
        const isHovered = hoveredUser === user.id

        return (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
                whileHover={{scale: 1.02}}
                className={cn(
                    "relative group cursor-pointer",
                    selectedUser?.id === user.id && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => handleProfileClick(user)}
                onMouseEnter={() => setHoveredUser(user.id)}
                onMouseLeave={() => setHoveredUser(null)}
            >
                <Card className="overflow-hidden h-full">
                    {/* Verification Badge */}
                    {user.verification.photoVerified && (
                        <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-blue-500 text-white text-xs">
                                <Shield className="w-3 h-3"/>
                            </Badge>
                        </div>
                    )}

                    {/* Favorite Badge */}
                    {isFavorite && (
                        <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-red-500 text-white text-xs">
                                <Heart className="w-3 h-3 fill-current"/>
                            </Badge>
                        </div>
                    )}

                    {/* Online Status Indicator */}
                    {user.isOnline && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"/>
                        </div>
                    )}

                    <CardHeader className="p-0">
                        {/* Profile Photo */}
                        <div className="relative h-48 overflow-hidden">
                            <Avatar className="w-full h-full">
                                <AvatarImage
                                    src={user.photos[0]?.url || '/placeholder-avatar.jpg'}
                                    alt={user.displayName}
                                />
                                <AvatarFallback className="text-lg font-semibold">
                                    {user.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            {/* Hover Overlay */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        exit={{opacity: 0}}
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2"
                                    >
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={(e) => handleFavorite(e, user.id)}
                                            className="bg-white/20 hover:bg-white/30"
                                        >
                                            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")}/>
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onMessage(user.id)}
                                            className="bg-white/20 hover:bg-white/30"
                                        >
                                            <MessageCircle className="w-4 h-4"/>
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onCall(user.id)}
                                            className="bg-white/20 hover:bg-white/30"
                                        >
                                            <Zap className="w-4 h-4"/>
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        {/* User Info */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg truncate">{user.displayName}</h3>
                                <span className="text-sm text-muted-foreground">{user.age} years</span>
                            </div>

                            {/* Location */}
                            {user.location?.city && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4"/>
                                    <span>{user.location.city}</span>
                                    {user.location.distance && (
                                        <span className="ml-auto">
                      {user.location.distance < 1
                          ? `${Math.round(user.location.distance * 1000)}m`
                          : `${user.location.distance.toFixed(1)}km`
                      }
                    </span>
                                    )}
                                </div>
                            )}

                            {/* Compatibility Score */}
                            {advancedMode && compatibilityScore > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Brain className="w-4 h-4"/>
                                        <span className="text-sm font-medium">Compatibility</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "text-sm font-bold",
                                            getCompatibilityColor(compatibilityScore)
                                        )}>
                                            {(compatibilityScore * 100).toFixed(0)}%
                                        </div>
                                        <div className={cn(
                                            "text-xs",
                                            getCompatibilityColor(compatibilityScore)
                                        )}>
                                            {getCompatibilityLabel(compatibilityScore)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bio Preview */}
                            {user.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {user.bio}
                                </p>
                            )}

                            {/* Interests */}
                            {user.interests && user.interests.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {user.interests.slice(0, 3).map((interest, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                            {interest}
                                        </Badge>
                                    ))}
                                    {user.interests.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{user.interests.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Stats */}
                            {advancedMode && user.stats && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                    <span>Response: {Math.round(user.stats.responseRate * 100)}%</span>
                                    <span>Trust: {Math.round(user.stats.trustScore * 100)}%</span>
                                    {user.isPremium && (
                                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                            <Sparkles className="w-3 h-3"/>
                                            Premium
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({length: 8}).map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                        <div className="h-64 bg-muted animate-pulse"/>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="h-4 bg-muted rounded animate-pulse"/>
                                <div className="h-3 bg-muted rounded animate-pulse w-3/4"/>
                                <div className="h-3 bg-muted rounded animate-pulse w-1/2"/>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (sortedUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    Try adjusting your filters or search criteria to find more matches.
                </p>
            </div>
        )
    }

    return (
        <div className={cn(
            "grid gap-6",
            viewMode === 'grid'
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-4"
        )}>
            <AnimatePresence>
                {sortedUsers.map((user, index) => (
                    <motion.div
                        key={user.id}
                        layout
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.8}}
                        transition={{duration: 0.3}}
                    >
                        <UserCard user={user} index={index}/>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export default DatingGrid

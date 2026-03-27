'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Heart, MapPin, MessageCircle, Star, User} from 'lucide-react'
import type {Match, Profile} from '@/lib/db/schema'

interface MatchWithProfile extends Match {
    profile?: Profile
}

function calculateAge(birthDate: Date | null): number | null {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}

export default function MatchesPage() {
    const [matches, setMatches] = useState<MatchWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchMatches()
    }, [])

    const fetchMatches = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/matches')
            if (!response.ok) {
                throw new Error('Failed to fetch matches')
            }

            const data = await response.json()
            setMatches(data.matches || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch matches')
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async (matchId: string, profileId: string) => {
        try {
            // Create conversation or navigate to messages
            window.location.href = `/messages?user=${profileId}`
        } catch (err) {
            console.error('Failed to send message:', err)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-48 bg-muted rounded-t-lg"/>
                            <CardContent className="p-4 space-y-3">
                                <div className="h-4 bg-muted rounded w-3/4"/>
                                <div className="h-3 bg-muted rounded w-1/2"/>
                                <div className="h-3 bg-muted rounded w-full"/>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={fetchMatches}>Try Again</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (matches.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-6 text-center">
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Start swiping on the discover page to find your perfect match!
                        </p>
                        <Button onClick={() => window.location.href = '/discover'}>
                            Discover People
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Matches</h1>
                <p className="text-muted-foreground">
                    People you have matched with - start a conversation!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                    <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                            {match.profile?.avatarUrl ? (
                                <img
                                    src={match.profile.avatarUrl}
                                    alt={match.profile.displayName || 'Match'}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                                    <User className="h-16 w-16 text-white"/>
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-green-500 text-white">
                                    Matched
                                </Badge>
                            </div>
                        </div>

                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {match.profile?.displayName || 'Unknown'}
                                    </h3>
                                    {match.profile?.birthDate && (
                                        <p className="text-sm text-muted-foreground">
                                            {calculateAge(match.profile.birthDate)} years old
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>
                                    <span className="text-sm font-medium">85%</span>
                                </div>
                            </div>

                            {match.profile?.bio && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {match.profile.bio}
                                </p>
                            )}

                            {match.profile?.location && (
                                <div className="flex items-center text-sm text-muted-foreground mb-4">
                                    <MapPin className="h-4 w-4 mr-1"/>
                                    {match.profile.location}
                                </div>
                            )}

                            <div className="flex space-x-2">
                                <Button
                                    className="flex-1"
                                    onClick={() => handleSendMessage(match.id, match.profile?.id || '')}
                                >
                                    <MessageCircle className="h-4 w-4 mr-2"/>
                                    Message
                                </Button>
                                <Button variant="outline" size="icon">
                                    <Heart className="h-4 w-4"/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

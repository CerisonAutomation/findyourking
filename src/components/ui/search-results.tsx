'use client'

import {useMemo, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Slider} from '@/components/ui/slider'
import {Checkbox} from '@/components/ui/checkbox'
import {Calendar, Clock, Filter, Heart, MapPin, Search, Sparkles, Users, X} from 'lucide-react'

interface SearchResult {
    id: string
    type: 'user' | 'event' | 'content'
    title: string
    description: string
    image?: string
    location?: string
    date?: string
    attendees?: number
    distance?: number
    matchScore?: number
    interests?: string[]
    verified?: boolean
    premium?: boolean
    lastActive?: string
    category?: string
    readTime?: string
    avatar?: string
    status?: string
}

interface SearchResultsProps {
    query: string
    results: SearchResult[]
    loading?: boolean
    onResultClick?: (result: SearchResult) => void
    onLoadMore?: () => void
    hasMore?: boolean
}

export function SearchResults({
                                  query,
                                  results,
                                  loading,
                                  onResultClick,
                                  onLoadMore,
                                  hasMore
                              }: SearchResultsProps) {
    const [activeTab, setActiveTab] = useState('all')
    const [sortBy, setSortBy] = useState('relevance')
    const [filters, setFilters] = useState({
        distance: [50],
        ageRange: [18, 65],
        verified: false,
        premium: false,
        online: false
    })
    const [showFilters, setShowFilters] = useState(false)

    const filteredResults = useMemo(() => {
        let filtered = results

        // Filter by tab
        if (activeTab !== 'all') {
            filtered = filtered.filter(result => result.type === activeTab)
        }

        // Filter by distance
        if (filters.distance[0] < 50) {
            filtered = filtered.filter(result =>
                !result.distance || result.distance <= filters.distance[0]
            )
        }

        // Filter by verification status
        if (filters.verified) {
            filtered = filtered.filter(result => result.verified)
        }

        // Filter by premium status
        if (filters.premium) {
            filtered = filtered.filter(result => result.premium)
        }

        // Sort results
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distance || 999) - (b.distance || 999)
                case 'match':
                    return (b.matchScore || 0) - (a.matchScore || 0)
                case 'recent':
                    return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime()
                case 'popular':
                    return (b.attendees || 0) - (a.attendees || 0)
                default:
                    return 0
            }
        })

        return filtered
    }, [results, activeTab, sortBy, filters])

    const userResults = filteredResults.filter(result => result.type === 'user')
    const eventResults = filteredResults.filter(result => result.type === 'event')

    const clearFilters = () => {
        setFilters({
            distance: [50],
            ageRange: [18, 65],
            verified: false,
            premium: false,
            online: false
        })
    }

    const activeFilterCount = Object.values(filters).filter(value =>
        Array.isArray(value) ? value[0] !== 50 || value[1] !== 65 : value === true
    ).length

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Search Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5"/>
                                Search Results for "{query}"
                            </CardTitle>
                            <CardDescription>
                                {filteredResults.length} results found
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relevance">Most Relevant</SelectItem>
                                    <SelectItem value="distance">Nearest First</SelectItem>
                                    <SelectItem value="match">Best Match</SelectItem>
                                    <SelectItem value="recent">Recently Active</SelectItem>
                                    <SelectItem value="popular">Most Popular</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="h-4 w-4"/>
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Filters Panel */}
                {showFilters && (
                    <CardContent className="border-t">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Filters</h3>
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="h-4 w-4 mr-1"/>
                                    Clear All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Distance</label>
                                    <div className="px-2">
                                        <Slider
                                            value={filters.distance}
                                            onValueChange={(value) => setFilters(prev => ({...prev, distance: value}))}
                                            max={100}
                                            step={5}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>0 km</span>
                                            <span>{filters.distance[0]} km</span>
                                            <span>100 km</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Age Range</label>
                                    <div className="px-2">
                                        <Slider
                                            value={filters.ageRange}
                                            onValueChange={(value) => setFilters(prev => ({...prev, ageRange: value}))}
                                            min={18}
                                            max={65}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>{filters.ageRange[0]}</span>
                                            <span>{filters.ageRange[1]}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="verified"
                                            checked={filters.verified}
                                            onCheckedChange={(checked) =>
                                                setFilters(prev => ({...prev, verified: !!checked}))
                                            }
                                        />
                                        <label htmlFor="verified"
                                               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Verified Only
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="premium"
                                            checked={filters.premium}
                                            onCheckedChange={(checked) =>
                                                setFilters(prev => ({...prev, premium: !!checked}))
                                            }
                                        />
                                        <label htmlFor="premium"
                                               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Premium Only
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="online"
                                            checked={filters.online}
                                            onCheckedChange={(checked) =>
                                                setFilters(prev => ({...prev, online: !!checked}))
                                            }
                                        />
                                        <label htmlFor="online"
                                               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Online Now
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Results Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Search className="h-4 w-4"/>
                        All ({filteredResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="user" className="flex items-center gap-2">
                        <Users className="h-4 w-4"/>
                        People ({userResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="event" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4"/>
                        Events ({eventResults.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {/* User Results */}
                    {userResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userResults.map((result) => (
                                <UserResultCard
                                    key={result.id}
                                    result={result}
                                    onClick={() => onResultClick?.(result)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Event Results */}
                    {eventResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {eventResults.map((result) => (
                                <EventResultCard
                                    key={result.id}
                                    result={result}
                                    onClick={() => onResultClick?.(result)}
                                />
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {filteredResults.length === 0 && !loading && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Search className="h-12 w-12 text-muted-foreground mb-4"/>
                                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Try adjusting your search terms or filters to find what you're looking for.
                                </p>
                                <Button onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={onLoadMore}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Load More Results'}
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function UserResultCard({result, onClick}: { result: SearchResult; onClick: () => void }) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="relative">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={result.image} alt={result.title}/>
                            <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {result.verified && (
                            <div
                                className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Sparkles className="h-2 w-2 text-white"/>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{result.title}</h3>
                            {result.premium && (
                                <Badge variant="secondary" className="text-xs">
                                    Premium
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {result.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {result.distance && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3"/>
                                    {result.distance} km
                                </div>
                            )}
                            {result.lastActive && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3"/>
                                    {result.lastActive}
                                </div>
                            )}
                            {result.matchScore && (
                                <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3"/>
                                    {result.matchScore}% match
                                </div>
                            )}
                        </div>

                        {result.interests && result.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {result.interests.slice(0, 3).map((interest, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {interest}
                                    </Badge>
                                ))}
                                {result.interests.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{result.interests.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function EventResultCard({result, onClick}: { result: SearchResult; onClick: () => void }) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div
                        className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white"/>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {result.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {result.date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3"/>
                                    {result.date}
                                </div>
                            )}
                            {result.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3"/>
                                    {result.location}
                                </div>
                            )}
                            {result.attendees && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3"/>
                                    {result.attendees} attending
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

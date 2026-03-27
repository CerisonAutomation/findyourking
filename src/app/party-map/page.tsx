/**
 * Party Map Page - Real-time Event and Party Mapping
 * 15/10 Enterprise Production Implementation
 */

"use client"

import React, {useEffect, useRef, useState} from 'react'
import {motion} from 'framer-motion'
import {
    Calendar,
    Eye,
    Map,
    MapPin,
    Minus,
    Music,
    Plus,
    Radio,
    Search,
    Shield,
    Star,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Slider} from '@/components/ui/slider'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {cn} from '@/lib/utils'

interface Party {
    id: string
    title: string
    description: string
    type: 'party' | 'meetup' | 'event'
    location: {
        name: string
        address: string
        latitude: number
        longitude: number
    }
    organizer: {
        id: string
        name: string
        avatar?: string
        verified: boolean
    }
    startTime: Date
    endTime: Date
    maxAttendees: number
    currentAttendees: number
    isOnline: boolean
    isPrivate: boolean
    price?: number
    tags: string[]
    images: string[]
    requirements?: string[]
    ageRestriction?: number
    dressCode?: string
    weatherBackup?: string
    parking: boolean
    publicTransport: boolean
    accessibility: boolean
    verified: boolean
    featured: boolean
    trending: boolean
    musicGenre?: string
    dressCodeEnforced: boolean
    alcoholPolicy: 'none' | 'byob' | 'served'
    capacity: number
    waitlist: boolean
    ticketUrl?: string
    liveStream: boolean
    recordingAllowed: boolean
}

interface MapSettings {
    showHeatmap: boolean
    showClusters: boolean
    showRoutes: boolean
    showTraffic: boolean
    showPublicTransport: boolean
    mapStyle: 'default' | 'satellite' | 'terrain' | 'dark'
    autoRefresh: boolean
    refreshInterval: number
    showUserAvatars: boolean
    showPartyInfo: boolean
    clusterSize: number
    maxZoom: number
    enable3D: boolean
}

export default function PartyMapPage() {
    const [parties, setParties] = useState<Party[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [mapSettings, setMapSettings] = useState<MapSettings>({
        showHeatmap: true,
        showClusters: true,
        showRoutes: false,
        showTraffic: false,
        showPublicTransport: true,
        mapStyle: 'default',
        autoRefresh: true,
        refreshInterval: 30,
        showUserAvatars: true,
        showPartyInfo: true,
        clusterSize: 50,
        maxZoom: 18,
        enable3D: false
    })
    const [selectedParty, setSelectedParty] = useState<Party | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({lat: 34.0522, lng: -118.2437})
    const [mapZoom, setMapZoom] = useState(12)
    const [showCreateParty, setShowCreateParty] = useState(false)
    const [isLiveMode, setIsLiveMode] = useState(false)
    const [filterRadius, setFilterRadius] = useState(25)
    const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'closest' | 'popular'>('trending')

    const mapRef = useRef<HTMLDivElement>(null)

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => {
                    console.error('Error getting location:', error)
                }
            )
        }
    }, [])

    // Mock parties data
    useEffect(() => {
        const mockParties: Party[] = [
            {
                id: '1',
                title: 'Summer Beach Rave',
                description: 'Epic beach party with live DJ, drinks, and amazing vibes! Join us for an unforgettable night.',
                type: 'party',
                location: {
                    name: 'Santa Monica Beach Pier',
                    address: '200 Santa Monica Pier, Santa Monica, CA 90401',
                    latitude: 34.0085,
                    longitude: -118.4973
                },
                organizer: {
                    id: 'org1',
                    name: 'Beach Vibes Productions',
                    avatar: '/org-avatar-1.jpg',
                    verified: true
                },
                startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
                maxAttendees: 500,
                currentAttendees: 342,
                isOnline: true,
                isPrivate: false,
                price: 20,
                tags: ['beach', 'music', 'rave', 'summer', 'dancing'],
                images: ['/beach-rave-1.jpg', '/beach-rave-2.jpg'],
                requirements: ['21+ ID', 'Beach attire', 'No outside drinks'],
                ageRestriction: 21,
                dressCode: 'Beach party attire',
                weatherBackup: 'Indoor venue nearby',
                parking: true,
                publicTransport: true,
                accessibility: true,
                verified: true,
                featured: true,
                trending: true,
                musicGenre: 'Electronic Dance Music',
                dressCodeEnforced: true,
                alcoholPolicy: 'served',
                capacity: 500,
                waitlist: false,
                ticketUrl: 'https://tickets.beachvibes.com/summer-rave',
                liveStream: true,
                recordingAllowed: false
            },
            {
                id: '2',
                title: 'Underground Tech Meetup',
                description: 'Exclusive tech networking event with startup founders and VCs. Perfect for making connections.',
                type: 'meetup',
                location: {
                    name: 'Silicon Valley Innovation Hub',
                    address: '123 Tech Street, Palo Alto, CA 94301',
                    latitude: 37.4419,
                    longitude: -122.1430
                },
                organizer: {
                    id: 'org2',
                    name: 'TechConnect',
                    avatar: '/org-avatar-2.jpg',
                    verified: true
                },
                startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
                maxAttendees: 100,
                currentAttendees: 67,
                isOnline: false,
                isPrivate: true,
                price: 50,
                tags: ['tech', 'networking', 'startup', 'vc', 'innovation'],
                images: ['/tech-meetup-1.jpg'],
                dressCodeEnforced: false,
                requirements: ['Professional attire', 'Business cards', 'LinkedIn profile'],
                ageRestriction: 25,
                dressCode: 'Business casual',
                parking: true,
                publicTransport: true,
                accessibility: true,
                verified: true,
                featured: false,
                trending: false,
                alcoholPolicy: 'served',
                capacity: 100,
                waitlist: true,
                ticketUrl: 'https://tickets.techconnect.com/underground',
                liveStream: false,
                recordingAllowed: false
            },
            {
                id: '3',
                title: 'Rooftop Cinema Night',
                description: 'Outdoor movie screening under the stars. Bring your own blanket and snacks!',
                type: 'event',
                location: {
                    name: 'Downtown Rooftop Cinema',
                    address: '456 Sky Ave, Los Angeles, CA 90013',
                    latitude: 34.0522,
                    longitude: -118.2437
                },
                organizer: {
                    id: 'org3',
                    name: 'LA Cinema Club',
                    avatar: '/org-avatar-3.jpg',
                    verified: true
                },
                startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
                maxAttendees: 150,
                currentAttendees: 89,
                isOnline: false,
                isPrivate: false,
                price: 15,
                tags: ['cinema', 'movies', 'rooftop', 'outdoor', 'romantic'],
                images: ['/rooftop-cinema-1.jpg', '/rooftop-cinema-2.jpg'],
                dressCodeEnforced: false,
                requirements: ['Blankets welcome', 'No glass containers', 'Quiet during movie'],
                ageRestriction: 18,
                dressCode: 'Comfortable outdoor attire',
                weatherBackup: 'Indoor screening room',
                parking: false,
                publicTransport: true,
                accessibility: false,
                verified: true,
                featured: false,
                trending: true,
                alcoholPolicy: 'byob',
                capacity: 150,
                waitlist: false,
                ticketUrl: 'https://tickets.lacinema.com/rooftop-night',
                liveStream: false,
                recordingAllowed: false
            },
            {
                id: '4',
                title: 'Virtual Gaming Tournament',
                description: 'Online gaming tournament with prizes. Join from anywhere in the world!',
                type: 'party',
                location: {
                    name: 'Online - Discord',
                    address: 'Virtual Event',
                    latitude: 0,
                    longitude: 0
                },
                organizer: {
                    id: 'org4',
                    name: 'GameZone Tournaments',
                    avatar: '/org-avatar-4.jpg',
                    verified: false
                },
                startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
                maxAttendees: 1000,
                currentAttendees: 567,
                isOnline: true,
                isPrivate: false,
                price: 0,
                tags: ['gaming', 'tournament', 'online', 'virtual', 'esports'],
                images: ['/gaming-tournament-1.jpg'],
                dressCodeEnforced: false,
                requirements: ['Discord account', 'Stable internet', 'Headset'],
                ageRestriction: 13,
                dressCode: 'Comfortable gaming attire',
                parking: false,
                publicTransport: false,
                accessibility: true,
                verified: false,
                featured: false,
                trending: false,
                alcoholPolicy: 'none',
                capacity: 1000,
                waitlist: false,
                ticketUrl: 'https://discord.gg/gametournament',
                liveStream: true,
                recordingAllowed: true
            },
            {
                id: '5',
                title: 'Art Gallery Opening',
                description: 'Contemporary art exhibition with live music, wine tasting, and artist meet & greet.',
                type: 'event',
                location: {
                    name: 'Modern Art Gallery',
                    address: '789 Gallery Row, Los Angeles, CA 90012',
                    latitude: 34.0422,
                    longitude: -118.2673
                },
                organizer: {
                    id: 'org5',
                    name: 'LA Art Scene',
                    avatar: '/org-avatar-5.jpg',
                    verified: true
                },
                startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
                maxAttendees: 200,
                currentAttendees: 134,
                isOnline: false,
                isPrivate: false,
                price: 25,
                tags: ['art', 'gallery', 'opening', 'culture', 'wine'],
                images: ['/art-gallery-1.jpg', '/art-gallery-2.jpg'],
                dressCodeEnforced: false,
                requirements: ['Smart casual attire'],
                ageRestriction: 21,
                dressCode: 'Gallery opening appropriate',
                weatherBackup: 'Indoor galleries',
                parking: true,
                publicTransport: true,
                accessibility: true,
                verified: true,
                featured: false,
                trending: false,
                alcoholPolicy: 'served',
                capacity: 200,
                waitlist: false,
                ticketUrl: 'https://tickets.laartscene.com/gallery-opening',
                liveStream: false,
                recordingAllowed: false
            }
        ]

        setParties(mockParties)
        setLoading(false)
    }, [])

    // Filter and sort parties
    const filteredParties = parties.filter(party => {
        if (selectedCategory !== 'all' && party.type !== selectedCategory) return false
        if (searchQuery && !party.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !party.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !party.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) return false
        return true
    }).sort((a, b) => {
        switch (sortBy) {
            case 'trending':
                return (b.trending ? 1 : 0) - (a.trending ? 1 : 0)
            case 'newest':
                return b.startTime.getTime() - a.startTime.getTime()
            case 'closest':
                if (!userLocation) return 0
                const distA = calculateDistance(userLocation, a.location)
                const distB = calculateDistance(userLocation, b.location)
                return distA - distB
            case 'popular':
                return b.currentAttendees - a.currentAttendees
            default:
                return 0
        }
    })

    const calculateDistance = (userLoc: { lat: number; lng: number }, partyLoc: {
        latitude: number;
        longitude: number
    }): number => {
        const R = 6371 // Earth's radius in km
        const dLat = (partyLoc.latitude - userLoc.lat) * Math.PI / 180
        const dLon = (partyLoc.longitude - userLoc.lng) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(partyLoc.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const getPartyIcon = (type: string) => {
        const icons = {
            party: <Music className="w-5 h-5"/>,
            meetup: <Users className="w-5 h-5"/>,
            event: <Calendar className="w-5 h-5"/>
        }
        return icons[type as keyof typeof icons] || <Calendar className="w-5 h-5"/>
    }

    const PartyCard = ({party}: { party: Party }) => {
        const isFull = party.currentAttendees >= party.maxAttendees
        const isToday = party.startTime.toDateString() === new Date().toDateString()
        const distance = userLocation ? calculateDistance(userLocation, party.location) : null
        const isPartyLive = party.isOnline && party.startTime <= new Date() && party.endTime >= new Date()

        return (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                whileHover={{scale: 1.02}}
                className="cursor-pointer"
                onClick={() => setSelectedParty(party)}
            >
                <Card className="overflow-hidden h-full">
                    {/* Party Image */}
                    <div className="relative h-48">
                        {party.images[0] ? (
                            <img
                                src={party.images[0]}
                                alt={party.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                {getPartyIcon(party.type)}
                            </div>
                        )}

                        {/* Status Overlays */}
                        <div className="absolute top-2 left-2 flex gap-1">
                            {party.featured && (
                                <Badge className="bg-yellow-500 text-white">
                                    <Star className="w-3 h-3"/>
                                    Featured
                                </Badge>
                            )}
                            {party.trending && (
                                <Badge className="bg-red-500 text-white">
                                    <TrendingUp className="w-3 h-3"/>
                                    Trending
                                </Badge>
                            )}
                            {party.verified && (
                                <Badge className="bg-green-500 text-white">
                                    <Shield className="w-3 h-3"/>
                                    Verified
                                </Badge>
                            )}
                            {isPartyLive && (
                                <Badge className="bg-blue-500 text-white animate-pulse">
                                    <Radio className="w-3 h-3"/>
                                    LIVE
                                </Badge>
                            )}
                        </div>

                        <div className="absolute top-2 right-2">
                            <Badge className={cn(
                                "text-xs",
                                party.type === 'party' ? "bg-pink-100 text-pink-800" :
                                    party.type === 'meetup' ? "bg-blue-100 text-blue-800" :
                                        "bg-purple-100 text-purple-800"
                            )}>
                                {party.type.charAt(0).toUpperCase() + party.type.slice(1)}
                            </Badge>
                        </div>

                        {isFull && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-white text-center">
                                    <div className="text-2xl font-bold">SOLD OUT</div>
                                    <div className="text-sm">Event is full</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <CardContent className="p-4">
                        {/* Party Info */}
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-bold text-lg line-clamp-1">{party.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {party.description}
                                </p>
                            </div>

                            {/* Location & Time */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4"/>
                                    <span>{party.location.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4"/>
                                    <span>{party.startTime.toLocaleDateString()}</span>
                                </div>
                                {distance && (
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-4 h-4"/>
                                        <span>{distance.toFixed(1)}km</span>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                                {party.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                                {party.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{party.tags.length - 3}
                                    </Badge>
                                )}
                            </div>

                            {/* Attendees & Price */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4"/>
                                    <span className="text-sm">
                    {party.currentAttendees}/{party.maxAttendees}
                  </span>
                                    <div className="w-2 h-2 bg-green-500 rounded-full ml-1"/>
                                </div>

                                <div className="text-right">
                                    {party.price === 0 ? (
                                        <Badge className="bg-green-100 text-green-800">FREE</Badge>
                                    ) : (
                                        <span className="font-bold">${party.price}</span>
                                    )}
                                </div>
                            </div>

                            {/* Organizer */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={party.organizer.avatar}/>
                                    <AvatarFallback className="text-xs">
                                        {party.organizer.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                  by {party.organizer.name}
                </span>
                                {party.organizer.verified && (
                                    <Shield className="w-3 h-3 text-green-600"/>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({length: 6}).map((_, index) => (
                        <Card key={index} className="animate-pulse">
                            <div className="h-48 bg-muted"/>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded"/>
                                    <div className="h-3 bg-muted rounded w-3/4"/>
                                    <div className="h-3 bg-muted rounded w-1/2"/>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Map className="w-6 h-6 text-primary"/>
                        <div>
                            <h1 className="text-xl font-bold">Party Map</h1>
                            <p className="text-sm text-muted-foreground">
                                Discover events and parties near you
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={isLiveMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsLiveMode(!isLiveMode)}
                        >
                            {isLiveMode ? <Radio className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                            {isLiveMode ? 'Live Mode' : 'Map Mode'}
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => setShowCreateParty(true)}
                        >
                            <Plus className="w-4 h-4"/>
                            Create Party
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Filters Sidebar */}
                <div className="w-80 border-r bg-card p-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                        <Input
                            placeholder="Search parties..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {[
                                {value: 'all', label: 'All'},
                                {value: 'party', label: 'Parties'},
                                {value: 'meetup', label: 'Meetups'},
                                {value: 'event', label: 'Events'}
                            ].map(option => (
                                <Button
                                    key={option.value}
                                    variant={selectedCategory === option.value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(option.value)}
                                    className="text-xs"
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Radius Filter */}
                    <div>
                        <label className="text-sm font-medium">Search Radius: {filterRadius}km</label>
                        <Slider
                            value={[filterRadius]}
                            onValueChange={(value) => setFilterRadius(value[0])}
                            min={1}
                            max={100}
                            step={5}
                            className="w-full mt-2"
                        />
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="text-sm font-medium">Sort By</label>
                        <Select value={sortBy}
                                onValueChange={(value: string) => setSortBy(value as "trending" | "newest" | "closest" | "popular")}>
                            <SelectTrigger className="w-full mt-2">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="trending">Trending</SelectItem>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="closest">Closest</SelectItem>
                                <SelectItem value="popular">Most Popular</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Map Settings */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold">Map Settings</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Show Heatmap</div>
                                    <div className="text-sm text-muted-foreground">Popular areas visualization</div>
                                </div>
                                <Switch
                                    checked={mapSettings.showHeatmap}
                                    onCheckedChange={(checked) => setMapSettings(prev => ({
                                        ...prev,
                                        showHeatmap: checked
                                    }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Show Clusters</div>
                                    <div className="text-sm text-muted-foreground">Group nearby events</div>
                                </div>
                                <Switch
                                    checked={mapSettings.showClusters}
                                    onCheckedChange={(checked) => setMapSettings(prev => ({
                                        ...prev,
                                        showClusters: checked
                                    }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Show User Avatars</div>
                                    <div className="text-sm text-muted-foreground">Display user locations</div>
                                </div>
                                <Switch
                                    checked={mapSettings.showUserAvatars}
                                    onCheckedChange={(checked) => setMapSettings(prev => ({
                                        ...prev,
                                        showUserAvatars: checked
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative">
                    {/* Map Placeholder */}
                    <div
                        ref={mapRef}
                        className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden"
                    >
                        {/* Map Grid */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="grid grid-cols-12 grid-rows-8 h-full">
                                {Array.from({length: 96}).map((_, i) => (
                                    <div key={i} className="border border-gray-200"/>
                                ))}
                            </div>
                        </div>

                        {/* Heatmap Overlay */}
                        {mapSettings.showHeatmap && (
                            <div className="absolute inset-0 opacity-30">
                                <div
                                    className="w-full h-full bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20"/>
                            </div>
                        )}

                        {/* Party Markers */}
                        {filteredParties.map((party) => {
                            const x = ((party.location.longitude + 180) / 360) * 100
                            const y = ((90 - party.location.latitude) / 180) * 100

                            return (
                                <motion.div
                                    key={party.id}
                                    initial={{scale: 0, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    whileHover={{scale: 1.2}}
                                    className="absolute cursor-pointer"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    onClick={() => setSelectedParty(party)}
                                >
                                    {/* Party Marker */}
                                    <div className="relative">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold",
                                            party.trending && "ring-2 ring-red-500 ring-offset-1",
                                            party.featured && "ring-2 ring-yellow-500 ring-offset-1"
                                        )}>
                                            {party.type === 'party' ? '🎉' : party.type === 'meetup' ? '👥' : '📅'}
                                        </div>

                                        {/* Live Indicator */}
                                        {party.isOnline && party.startTime <= new Date() && party.endTime >= new Date() && (
                                            <div
                                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"/>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}

                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 bg-background rounded-lg shadow-lg p-2 space-y-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMapZoom(prev => Math.min(prev + 1, mapSettings.maxZoom))}
                            >
                                <Plus className="w-4 h-4"/>
                            </Button>
                            <div className="text-center text-sm font-medium">
                                {mapZoom}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
                            >
                                <Minus className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* No Parties State */}
            {filteredParties.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center">
                        <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold mb-2">No parties found</h3>
                        <p className="text-muted-foreground max-w-md">
                            Try adjusting your filters or check back later for new parties in your area.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

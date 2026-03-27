'use client'

import {useEffect, useState} from 'react'
import dynamic from 'next/dynamic'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {Eye, MapPin, Navigation, Shield, Users} from 'lucide-react'
import {useOnlineMembers} from '@/hooks/usePresenceStore'
import {usePresenceChannel} from '@/hooks/usePresenceChannel'

// Dynamically import MapLibre to avoid SSR issues
const Map = dynamic(() => import('@/components/map/MapLibreMap'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-96 bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
            </div>
        </div>
    ),
})

interface NearbyUser {
    id: string
    username: string
    avatar_url?: string
    age: number
    interests: string[]
    verified: boolean
    location?: {
        lat: number
        lng: number
    }
    distance_km?: number
    last_active?: string
}

export default function LiveLocationPage() {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
    const [loading, setLoading] = useState(true)
    const [showExactLocation, setShowExactLocation] = useState(false)
    const [searchRadius, setSearchRadius] = useState(10)
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
    const [locationSharing, setLocationSharing] = useState(false)

    const onlineUsers = useOnlineMembers()
    const {goOffline, comeOnline} = usePresenceChannel({
        userId: '',
        enabled: locationSharing,
    })

    useEffect(() => {
        getUserLocation()
        loadNearbyUsers()
    }, [searchRadius, showExactLocation])

    useEffect(() => {
        if (userLocation) {
            setMapCenter(userLocation)
        }
    }, [userLocation])

    async function getUserLocation() {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported')
            setLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {latitude, longitude} = position.coords
                const location = {lat: latitude, lng: longitude}
                setUserLocation(location)
                setLoading(false)
                updateUserLocation(location)
            },
            (error) => {
                console.error('Geolocation error:', error)
                setLoading(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        )
    }

    async function updateUserLocation(location: { lat: number; lng: number }) {
        try {
            const roundedLocation = showExactLocation
                ? location
                : {
                    lat: Math.round(location.lat * 100) / 100,
                    lng: Math.round(location.lng * 100) / 100,
                }

            const response = await fetch('/api/location/update', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({location: roundedLocation}),
            })

            if (!response.ok) throw new Error('Failed to update location')
        } catch (error) {
            console.error('Update location error:', error)
        }
    }

    async function loadNearbyUsers() {
        if (!userLocation) return

        setLoading(true)
        try {
            const params = new URLSearchParams({
                lat: userLocation.lat.toString(),
                lng: userLocation.lng.toString(),
                radius: searchRadius.toString(),
            })

            const response = await fetch(`/api/location/nearby?${params}`)
            if (!response.ok) throw new Error('Failed to load nearby users')

            const data = await response.json()
            setNearbyUsers(data.users || [])
        } catch (error) {
            console.error('Load nearby users error:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleLocationToggle(enabled: boolean) {
        setLocationSharing(enabled)
        if (enabled) {
            comeOnline()
            if (userLocation) {
                updateUserLocation(userLocation)
            }
        } else {
            goOffline()
        }
    }

    function isOnline(userId: string): boolean {
        return onlineUsers.includes(userId)
    }

    function getPrivacyLevel(): string {
        if (!locationSharing) return 'Private'
        if (showExactLocation) return 'Exact'
        return 'Approximate'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Live Location</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant={locationSharing ? 'default' : 'secondary'}>
                                {getPrivacyLevel()}
                            </Badge>
                            {locationSharing && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"/>
                                    Sharing
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map Section */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5"/>
                                    Nearby Users
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {mapCenter && (
                                    <Map
                                        center={[mapCenter.lng, mapCenter.lat]}
                                        zoom={12}
                                        markers={[
                                            userLocation ? {
                                                id: 'user',
                                                position: [userLocation.lng, userLocation.lat] as [number, number],
                                                title: 'You',
                                            } : null,
                                            ...nearbyUsers
                                                .filter(user => user.location)
                                                .map(user => ({
                                                    id: user.id,
                                                    position: [user.location!.lng, user.location!.lat] as [number, number],
                                                    title: user.username,
                                                })),
                                        ].filter(Boolean) as {id: string; position: [number, number]; title?: string}[]}
                                        height="500px"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Controls & Users List */}
                    <div className="space-y-6">
                        {/* Privacy Controls */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5"/>
                                    Privacy Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="location-sharing">Share Location</Label>
                                        <p className="text-sm text-gray-600">
                                            Allow others to see you are nearby
                                        </p>
                                    </div>
                                    <Switch
                                        id="location-sharing"
                                        checked={locationSharing}
                                        onCheckedChange={handleLocationToggle}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="exact-location">Exact Location</Label>
                                        <p className="text-sm text-gray-600">
                                            Show precise vs approximate location
                                        </p>
                                    </div>
                                    <Switch
                                        id="exact-location"
                                        checked={showExactLocation}
                                        onCheckedChange={setShowExactLocation}
                                        disabled={!locationSharing}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Search Radius: {searchRadius}km</Label>
                                    <Slider
                                        value={[searchRadius]}
                                        onValueChange={([value]) => setSearchRadius(value)}
                                        min={1}
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => getUserLocation()}
                                        variant="outline"
                                        className="w-full"
                                        disabled={!locationSharing}
                                    >
                                        <Navigation className="h-4 w-4 mr-2"/>
                                        Update Location
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Nearby Users List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5"/>
                                    Nearby Users ({nearbyUsers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div
                                            className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : nearbyUsers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                        <p className="text-gray-600">No nearby users found</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Try increasing your search radius
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {nearbyUsers.map((user) => (
                                            <NearbyUserCard
                                                key={user.id}
                                                user={user}
                                                isOnline={isOnline(user.id)}
                                                showDistance={showExactLocation}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

function NearbyUserCard({
                            user,
                            isOnline,
                            showDistance
                        }: {
    user: NearbyUser
    isOnline: boolean
    showDistance: boolean
}) {
    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="relative">
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-400"/>
                    </div>
                )}

                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}/>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{user.username}, {user.age}</h3>
                    {user.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    {showDistance && user.distance_km !== undefined && (
                        <span>{user.distance_km.toFixed(1)} km away</span>
                    )}
                    {!showDistance && (
                        <span className="flex items-center gap-1">
              <Eye className="h-3 w-3"/>
              Approximate
            </span>
                    )}
                </div>

                {user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {user.interests.slice(0, 2).map((interest, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {interest}
                            </Badge>
                        ))}
                        {user.interests.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{user.interests.length - 2}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            <Button size="sm" variant="outline">
                View
            </Button>
        </div>
    )
}

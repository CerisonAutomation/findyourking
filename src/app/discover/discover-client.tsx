'use client'

import {useEffect, useState} from 'react'
import {AnimatePresence, motion, PanInfo} from 'framer-motion'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from '@/components/ui/sheet'
import {Slider} from '@/components/ui/slider'
import {Switch} from '@/components/ui/switch'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Filter, Heart, MapPin, Star, Users, X} from 'lucide-react'
import {useOnlineMembers} from '@/hooks/usePresenceStore'
import type {ProfileSearchInput} from '@/validations/profile'

interface Profile {
    id: string
    username: string
    bio?: string
    interests: string[]
    birth_date: string | null
    location?: string
    verified: boolean
    avatar_url?: string
    online_status?: string
    last_active?: string
}

// Helper function to calculate age from birth_date
function calculateAge(birthDate: string | null): number | null {
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

interface SwipeAction {
    profileId: string
    direction: 'like' | 'pass' | 'super_like'
}

export function DiscoverPageClient() {
    const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe')
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const onlineUsers = useOnlineMembers()

    // Filter states
    const [filters, setFilters] = useState<Partial<ProfileSearchInput>>({
        min_age: 18,
        max_age: 100,
        max_distance: 50,
        verified_only: false,
        online_only: false,
    })

    const currentProfile = profiles[currentIndex]

    // Load profiles
    useEffect(() => {
        loadProfiles()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])

    async function loadProfiles() {
        setLoading(true)
        try {
            const params = new URLSearchParams()

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    if (Array.isArray(value)) {
                        params.set(key, value.join(','))
                    } else {
                        params.set(key, String(value))
                    }
                }
            })

            const response = await fetch(`/api/profiles?${params}`)
            if (!response.ok) throw new Error('Failed to load profiles')

            const data = await response.json()
            setProfiles(data.profiles || [])
            setCurrentIndex(0)
        } catch (error) {
            console.error('Load profiles error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSwipe(direction: SwipeAction['direction']) {
        if (!currentProfile) return

        try {
            const response = await fetch('/api/swipes', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    target_id: currentProfile.id,
                    direction,
                }),
            })

            if (!response.ok) throw new Error('Failed to record swipe')

            // Move to next profile
            if (currentIndex < profiles.length - 1) {
                setCurrentIndex(currentIndex + 1)
            } else {
                // Load more profiles
                await loadProfiles()
            }
        } catch (error) {
            console.error('Swipe error:', error)
        }
    }

    function handleDragEnd(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
        const {offset, velocity} = info
        const swipeThreshold = 50

        if (offset.x > swipeThreshold || velocity.x > 500) {
            handleSwipe('like')
        } else if (offset.x < -swipeThreshold || velocity.x < -500) {
            handleSwipe('pass')
        }
    }

    function isOnline(userId: string): boolean {
        return onlineUsers.includes(userId)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-king-bg">
                <div className="text-center">
                    <div className="animate-spin-slow rounded-full h-12 w-12 border-b-2 border-king-cobalt mx-auto mb-4"></div>
                    <p className="text-king-muted">Loading profiles...</p>
                </div>
            </div>
        )
    }

    if (profiles.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-king-bg">
                <div className="text-center max-w-md animate-fade-in">
                    <Users className="h-16 w-16 text-king-muted mx-auto mb-4"/>
                    <h2 className="text-king-h2 mb-2">No profiles found</h2>
                    <p className="text-king-muted mb-4">Try adjusting your filters to see more people</p>
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button>Adjust Filters</Button>
                        </SheetTrigger>
                        <SheetContent>
                            <FiltersPanel
                                filters={filters}
                                onChange={setFilters}
                                onClose={() => setFiltersOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-king-bg">
            {/* Header */}
            <div className="bg-king-bg-1 border-b border-king-border px-4 py-3">
                <div className="flex items-center justify-between max-w-128 mx-auto">
                    <h1 className="text-king-h1">Discover</h1>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-king-bg-2 rounded-king p-1">
                            <Button
                                variant={viewMode === 'swipe' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('swipe')}
                                className="h-8"
                            >
                                Swipe
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-8"
                            >
                                Grid
                            </Button>
                        </div>

                        {/* Filters */}
                        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2"/>
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <FiltersPanel
                                    filters={filters}
                                    onChange={setFilters}
                                    onClose={() => setFiltersOpen(false)}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-128 mx-auto p-4">
                {viewMode === 'swipe' ? (
                    <SwipeView
                        profile={currentProfile}
                        onSwipe={handleSwipe}
                        onDragEnd={handleDragEnd}
                        isOnline={currentProfile ? isOnline(currentProfile.id) : false}
                    />
                ) : (
                    <GridView
                        profiles={profiles}
                        onSwipe={handleSwipe}
                        isOnline={isOnline}
                    />
                )}
            </div>
        </div>
    )
}

function SwipeView({
                       profile,
                       onSwipe,
                       onDragEnd,
                       isOnline
                   }: {
    profile?: Profile
    onSwipe: (direction: SwipeAction['direction']) => void
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
    isOnline: boolean
}) {
    if (!profile) return null

    return (
        <div className="relative h-[600px] max-w-md mx-auto">
            <AnimatePresence>
                <motion.div
                    key={profile.id}
                    className="absolute inset-0"
                    drag="x"
                    dragConstraints={{left: 0, right: 0}}
                    onDragEnd={onDragEnd}
                    initial={{scale: 1, opacity: 1}}
                    exit={{scale: 0.8, opacity: 0}}
                    transition={{duration: 0.3}}
                >
                    <Card className="h-full overflow-hidden">
                        {/* Image Section */}
                        <div className="relative h-3/4 bg-gray-200">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Users className="h-16 w-16 text-gray-400"/>
                                </div>
                            )}

                            {/* Online Status */}
                            <div className="absolute top-4 right-4">
                                <Badge variant={isOnline ? 'default' : 'secondary'}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </Badge>
                            </div>

                            {/* Verified Badge */}
                            {profile.verified && (
                                <div className="absolute top-4 left-4">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        ✓ Verified
                                    </Badge>
                                </div>
                            )}

                            {/* Profile Info Overlay */}
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <h2 className="text-white text-2xl font-bold">{profile.username}{profile.birth_date && `, ${calculateAge(profile.birth_date)}`}</h2>
                                {profile.location && (
                                    <div className="flex items-center text-white/90 mt-1">
                                        <MapPin className="h-4 w-4 mr-1"/>
                                        {profile.location}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <CardContent className="p-4">
                            {profile.bio && (
                                <p className="text-gray-700 mb-3 line-clamp-2">{profile.bio}</p>
                            )}

                            {profile.interests.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {profile.interests.slice(0, 5).map((interest, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {interest}
                                        </Badge>
                                    ))}
                                    {profile.interests.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{profile.interests.length - 5}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-16 w-16 bg-white shadow-lg"
                    onClick={() => onSwipe('pass')}
                >
                    <X className="h-6 w-6"/>
                </Button>

                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-16 w-16 bg-white shadow-lg"
                    onClick={() => onSwipe('super_like')}
                >
                    <Star className="h-6 w-6 text-blue-600"/>
                </Button>

                <Button
                    size="lg"
                    className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 shadow-lg"
                    onClick={() => onSwipe('like')}
                >
                    <Heart className="h-6 w-6"/>
                </Button>
            </div>
        </div>
    )
}

function GridView({
                      profiles,
                      onSwipe,
                      isOnline
                  }: {
    profiles: Profile[]
    onSwipe: (direction: SwipeAction['direction']) => void
    isOnline: (userId: string) => boolean
}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.map((profile) => (
                <motion.div
                    key={profile.id}
                    layout
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 0.8}}
                    transition={{duration: 0.3}}
                >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-square bg-gray-200">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Users className="h-8 w-8 text-gray-400"/>
                                </div>
                            )}

                            {/* Online Status */}
                            <div className="absolute top-2 right-2">
                                <div className={`w-3 h-3 rounded-full border-2 border-white ${
                                    isOnline(profile.id) ? 'bg-green-500' : 'bg-gray-400'
                                }`}/>
                            </div>

                            {/* Verified Badge */}
                            {profile.verified && (
                                <div className="absolute top-2 left-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-3">
                            <h3 className="font-semibold text-sm">{profile.username}{profile.birth_date && `, ${calculateAge(profile.birth_date)}`}</h3>
                            {profile.location && (
                                <p className="text-xs text-gray-600 flex items-center mt-1">
                                    <MapPin className="h-3 w-3 mr-1"/>
                                    {profile.location}
                                </p>
                            )}

                            <div className="flex gap-1 mt-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-8"
                                    onClick={() => onSwipe('pass')}
                                >
                                    <X className="h-3 w-3"/>
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 h-8"
                                    onClick={() => onSwipe('like')}
                                >
                                    <Heart className="h-3 w-3"/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}

function FiltersPanel({
                          filters,
                          onChange,
                          onClose
                      }: {
    filters: Partial<ProfileSearchInput>
    onChange: (filters: Partial<ProfileSearchInput>) => void
    onClose: () => void
}) {
    return (
        <div className="space-y-6">
            <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
            </SheetHeader>

            {/* Age Range */}
            <div className="space-y-3">
                <Label>Age Range</Label>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Min: {filters.min_age || 18}</span>
                        <span className="text-sm text-gray-600">Max: {filters.max_age || 100}</span>
                    </div>
                    <Slider
                        value={[filters.min_age || 18, filters.max_age || 100]}
                        onValueChange={([min, max]) => onChange({...filters, min_age: min, max_age: max})}
                        min={18}
                        max={100}
                        step={1}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Distance */}
            <div className="space-y-3">
                <Label>Max Distance</Label>
                <div className="space-y-2">
                    <span className="text-sm text-gray-600">{filters.max_distance || 50} km</span>
                    <Slider
                        value={[filters.max_distance || 50]}
                        onValueChange={([max]) => onChange({...filters, max_distance: max})}
                        min={1}
                        max={500}
                        step={5}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="verified-only">Verified only</Label>
                    <Switch
                        id="verified-only"
                        checked={filters.verified_only || false}
                        onCheckedChange={(checked) => onChange({...filters, verified_only: checked})}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="online-only">Online only</Label>
                    <Switch
                        id="online-only"
                        checked={filters.online_only || false}
                        onCheckedChange={(checked) => onChange({...filters, online_only: checked})}
                    />
                </div>
            </div>

            {/* Search Query */}
            <div className="space-y-3">
                <Label htmlFor="search">Search</Label>
                <Input
                    id="search"
                    placeholder="Search by username or bio..."
                    value={filters.query || ''}
                    onChange={(e) => onChange({...filters, query: e.target.value || undefined})}
                />
            </div>

            {/* Apply Button */}
            <div className="pt-4">
                <Button onClick={onClose} className="w-full">
                    Apply Filters
                </Button>
            </div>
        </div>
    )
}
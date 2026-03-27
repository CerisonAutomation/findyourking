'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Progress} from '@/components/ui/progress'
import {Calendar, MapPin, Users} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import type {CreateEventInput, EventFilterInput} from '@/validations/events'
import {createEventSchema} from '@/validations/events'

interface Event {
    id: string
    title: string
    description?: string
    location?: string
    date: string
    capacity: number
    category: 'social' | 'party' | 'meetup' | 'festival' | 'online'
    created_by: string
    attendees_count: number
    is_attending?: boolean
    creator?: {
        username: string
        avatar_url?: string
    }
}

export default function EventsPage() {
    const [activeTab, setActiveTab] = useState('discover')
    const [events, setEvents] = useState<Event[]>([])
    const [myEvents, setMyEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<Partial<EventFilterInput>>({})

    useEffect(() => {
        if (activeTab === 'discover') {
            loadEvents()
        } else if (activeTab === 'my-events') {
            loadMyEvents()
        }
    }, [activeTab, filters])

    async function loadEvents() {
        setLoading(true)
        try {
            const params = new URLSearchParams()

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.set(key, String(value))
                }
            })

            const response = await fetch(`/api/events?${params}`)
            if (!response.ok) throw new Error('Failed to load events')

            const data = await response.json()
            setEvents(data.events || [])
        } catch (error) {
            console.error('Load events error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function loadMyEvents() {
        setLoading(true)
        try {
            const response = await fetch('/api/events/my-events')
            if (!response.ok) throw new Error('Failed to load my events')

            const data = await response.json()
            setMyEvents(data.events || [])
        } catch (error) {
            console.error('Load my events error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAttend(eventId: string) {
        try {
            const response = await fetch(`/api/events/${eventId}/attend`, {
                method: 'POST',
            })

            if (!response.ok) throw new Error('Failed to attend event')

            // Refresh events
            if (activeTab === 'discover') {
                loadEvents()
            } else {
                loadMyEvents()
            }
        } catch (error) {
            console.error('Attend event error:', error)
        }
    }

    async function handleUnattend(eventId: string) {
        try {
            const response = await fetch(`/api/events/${eventId}/attend`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to unattend event')

            // Refresh events
            if (activeTab === 'discover') {
                loadEvents()
            } else {
                loadMyEvents()
            }
        } catch (error) {
            console.error('Unattend event error:', error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-semibold">Events</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="discover">Discover</TabsTrigger>
                        <TabsTrigger value="my-events">My Events</TabsTrigger>
                        <TabsTrigger value="create">Create Event</TabsTrigger>
                    </TabsList>

                    <TabsContent value="discover" className="space-y-4">
                        <EventFilters filters={filters} onChange={setFilters}/>
                        <EventList
                            events={events}
                            loading={loading}
                            onAttend={handleAttend}
                            onUnattend={handleUnattend}
                        />
                    </TabsContent>

                    <TabsContent value="my-events" className="space-y-4">
                        <EventList
                            events={myEvents}
                            loading={loading}
                            onAttend={handleAttend}
                            onUnattend={handleUnattend}
                        />
                    </TabsContent>

                    <TabsContent value="create">
                        <CreateEventForm onSuccess={() => setActiveTab('my-events')}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function EventFilters({
                          filters,
                          onChange
                      }: {
    filters: Partial<EventFilterInput>
    onChange: (filters: Partial<EventFilterInput>) => void
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={filters.category || ''}
                            onValueChange={(value) => onChange({...filters, category: value as any || undefined})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All categories"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All categories</SelectItem>
                                <SelectItem value="social">Social</SelectItem>
                                <SelectItem value="party">Party</SelectItem>
                                <SelectItem value="meetup">Meetup</SelectItem>
                                <SelectItem value="festival">Festival</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="date-from">Date From</Label>
                        <Input
                            id="date-from"
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => onChange({...filters, date_from: e.target.value || undefined})}
                        />
                    </div>

                    <div>
                        <Label htmlFor="date-to">Date To</Label>
                        <Input
                            id="date-to"
                            type="date"
                            value={filters.date_to || ''}
                            onChange={(e) => onChange({...filters, date_to: e.target.value || undefined})}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={() => onChange({})}
                            variant="outline"
                            className="w-full"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function EventList({
                       events,
                       loading,
                       onAttend,
                       onUnattend
                   }: {
    events: Event[]
    loading: boolean
    onAttend: (eventId: string) => void
    onUnattend: (eventId: string) => void
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-gray-600">Try adjusting your filters or create a new event</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    onAttend={() => onAttend(event.id)}
                    onUnattend={() => onUnattend(event.id)}
                />
            ))}
        </div>
    )
}

function EventCard({
                       event,
                       onAttend,
                       onUnattend
                   }: {
    event: Event
    onAttend: () => void
    onUnattend: () => void
}) {
    const eventDate = new Date(event.date)
    const isPast = eventDate < new Date()
    const isFull = event.attendees_count >= event.capacity

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{event.category}</Badge>
                            {event.is_attending && <Badge variant="default">Attending</Badge>}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {event.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2"/>
                        {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                    </div>

                    {event.location && (
                        <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2"/>
                            {event.location}
                        </div>
                    )}

                    <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2"/>
                        {event.attendees_count} / {event.capacity} attending
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Capacity</span>
                            <span>{Math.round((event.attendees_count / event.capacity) * 100)}%</span>
                        </div>
                        <Progress
                            value={(event.attendees_count / event.capacity) * 100}
                            className="h-2"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                    {isPast ? (
                        <Button disabled className="w-full">
                            Event Ended
                        </Button>
                    ) : event.is_attending ? (
                        <Button
                            variant="outline"
                            onClick={onUnattend}
                            className="w-full"
                        >
                            Cancel Attendance
                        </Button>
                    ) : isFull ? (
                        <Button disabled className="w-full">
                            Event Full
                        </Button>
                    ) : (
                        <Button onClick={onAttend} className="w-full">
                            Attend Event
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function CreateEventForm({onSuccess}: { onSuccess: () => void }) {
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
        reset,
    } = useForm<CreateEventInput>({
        resolver: zodResolver(createEventSchema),
    })

    async function onSubmit(data: CreateEventInput) {
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create event')
            }

            reset()
            onSuccess()
        } catch (error) {
            console.error('Create event error:', error)
            // Handle error display
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            {...register('title')}
                            placeholder="Event title"
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Describe your event..."
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                {...register('location')}
                                placeholder="Event location or 'Online'"
                            />
                            {errors.location && (
                                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select {...register('category')}
                                    onValueChange={(value) => register('category').onChange({target: {value}})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="social">Social</SelectItem>
                                    <SelectItem value="party">Party</SelectItem>
                                    <SelectItem value="meetup">Meetup</SelectItem>
                                    <SelectItem value="festival">Festival</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date">Date & Time *</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                {...register('date')}
                            />
                            {errors.date && (
                                <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="capacity">Capacity *</Label>
                            <Input
                                id="capacity"
                                type="number"
                                {...register('capacity', {valueAsNumber: true})}
                                placeholder="Max attendees"
                            />
                            {errors.capacity && (
                                <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => reset()}>
                            Reset
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
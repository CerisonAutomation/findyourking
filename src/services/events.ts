import {createClient} from '@/lib/supabase/client'

export interface Event {
    id: string
    title: string
    description: string
    location: string
    date: string
    organizer_id: string
    max_attendees: number
    attendees: string[]
    category: string
    image_url?: string
    created_at: string
    updated_at: string
}

export interface CreateEventInput {
    title: string
    description: string
    location: string
    date: string
    max_attendees: number
    category: string
    image_url?: string
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
    id: string
}

export interface EventFilters {
    category?: string
    search?: string
    startDate?: string
    endDate?: string
    organizerId?: string
}

export class EventsService {
    private supabase = createClient()

    async getById(id: string): Promise<Event | null> {
        const {data, error} = await this.supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async list(filters?: EventFilters, limit = 20, offset = 0): Promise<Event[]> {
        let query = this.supabase
            .from('events')
            .select('*')
            .order('date', {ascending: true})
            .range(offset, offset + limit - 1)

        if (filters?.category) {
            query = query.eq('category', filters.category)
        }

        if (filters?.search) {
            query = query.ilike('title', `%${filters.search}%`)
        }

        if (filters?.startDate) {
            query = query.gte('date', filters.startDate)
        }

        if (filters?.endDate) {
            query = query.lte('date', filters.endDate)
        }

        if (filters?.organizerId) {
            query = query.eq('organizer_id', filters.organizerId)
        }

        const {data, error} = await query

        if (error) throw error
        return data || []
    }

    async create(input: CreateEventInput, organizerId: string): Promise<Event> {
        const {data, error} = await this.supabase
            .from('events')
            .insert({
                ...input,
                organizer_id: organizerId,
                attendees: [organizerId],
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async update(input: UpdateEventInput): Promise<Event> {
        const {id, ...updates} = input
        const {data, error} = await this.supabase
            .from('events')
            .update({...updates, updated_at: new Date().toISOString()})
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async delete(id: string): Promise<void> {
        const {error} = await this.supabase
            .from('events')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async join(eventId: string, userId: string): Promise<Event> {
        const event = await this.getById(eventId)
        if (!event) throw new Error('Event not found')

        if (event.attendees.length >= event.max_attendees) {
            throw new Error('Event is full')
        }

        if (event.attendees.includes(userId)) {
            throw new Error('Already joined this event')
        }

        const updatedAttendees = [...event.attendees, userId]
        const {data, error} = await this.supabase
            .from('events')
            .update({attendees: updatedAttendees, updated_at: new Date().toISOString()})
            .eq('id', eventId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async leave(eventId: string, userId: string): Promise<Event> {
        const event = await this.getById(eventId)
        if (!event) throw new Error('Event not found')

        if (!event.attendees.includes(userId)) {
            throw new Error('Not attending this event')
        }

        const updatedAttendees = event.attendees.filter((a) => a !== userId)
        const {data, error} = await this.supabase
            .from('events')
            .update({attendees: updatedAttendees, updated_at: new Date().toISOString()})
            .eq('id', eventId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async getUpcoming(userId: string, limit = 10): Promise<Event[]> {
        const {data, error} = await this.supabase
            .from('events')
            .select('*')
            .contains('attendees', [userId])
            .gte('date', new Date().toISOString())
            .order('date', {ascending: true})
            .limit(limit)

        if (error) throw error
        return data || []
    }

    async getByCategory(category: string, limit = 20): Promise<Event[]> {
        const {data, error} = await this.supabase
            .from('events')
            .select('*')
            .eq('category', category)
            .gte('date', new Date().toISOString())
            .order('date', {ascending: true})
            .limit(limit)

        if (error) throw error
        return data || []
    }

    async getOrganized(userId: string): Promise<Event[]> {
        const {data, error} = await this.supabase
            .from('events')
            .select('*')
            .eq('organizer_id', userId)
            .order('date', {ascending: true})

        if (error) throw error
        return data || []
    }

    subscribeToEvents(onUpdate: (event: Event) => void) {
        return this.supabase
            .channel('events')
            .on(
                'postgres_changes',
                {event: '*', schema: 'public', table: 'events'},
                (payload) => {
                    onUpdate(payload.new as Event)
                }
            )
            .subscribe()
    }
}

export const eventsService = new EventsService()

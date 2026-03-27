import {z} from 'zod'

// Shared constants
export const MIN_TITLE_LENGTH = 3
export const MAX_TITLE_LENGTH = 100
export const MAX_DESCRIPTION_LENGTH = 1000
export const MAX_LOCATION_LENGTH = 100
export const MIN_CAPACITY = 1
export const MAX_CAPACITY = 50000

// Event schemas
export const createEventSchema = z.object({
    title: z.string()
        .min(MIN_TITLE_LENGTH, `Title must be at least ${MIN_TITLE_LENGTH} characters`)
        .max(MAX_TITLE_LENGTH, `Title must be no more than ${MAX_TITLE_LENGTH} characters`),
    description: z.string()
        .max(MAX_DESCRIPTION_LENGTH, `Description must be no more than ${MAX_DESCRIPTION_LENGTH} characters`)
        .optional(),
    location: z.string()
        .max(MAX_LOCATION_LENGTH, `Location must be no more than ${MAX_LOCATION_LENGTH} characters`)
        .optional(),
    date: z.string()
        .refine((date) => {
            const eventDate = new Date(date)
            const today = new Date()
            return eventDate > today
        }, 'Event date must be in the future'),
    capacity: z.number()
        .int('Capacity must be a whole number')
        .min(MIN_CAPACITY, `Capacity must be at least ${MIN_CAPACITY}`)
        .max(MAX_CAPACITY, `Capacity must be no more than ${MAX_CAPACITY}`),
    category: z.enum(['social', 'party', 'meetup', 'festival', 'online'], {
        errorMap: () => ({message: 'Category must be one of: social, party, meetup, festival, online'}),
    }),
})

export const updateEventSchema = createEventSchema.partial().extend({
    id: z.string().uuid('Invalid event ID'),
})

export const eventFilterSchema = z.object({
    category: z.enum(['social', 'party', 'meetup', 'festival', 'online']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    near_lat: z.number().min(-90).max(90).optional(),
    near_lng: z.number().min(-180).max(180).optional(),
    radius_km: z.number().min(0.1).max(1000).optional(),
}).refine((data) => {
    if ((data.near_lat || data.near_lng) && !(data.near_lat && data.near_lng)) {
        return false
    }
    if (data.near_lat && !data.radius_km) {
        return false
    }
    if (data.date_from && data.date_to && new Date(data.date_from) > new Date(data.date_to)) {
        return false
    }
    return true
}, {
    message: 'Invalid filter combination',
})

// Export types
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventFilterInput = z.infer<typeof eventFilterSchema>
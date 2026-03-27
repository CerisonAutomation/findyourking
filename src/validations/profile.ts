import {z} from 'zod'

// Shared constants
export const MIN_USERNAME_LENGTH = 3
export const MAX_USERNAME_LENGTH = 30
export const MAX_BIO_LENGTH = 500
export const MAX_LOCATION_LENGTH = 100
export const MIN_INTEREST_LENGTH = 10
export const MAX_INTEREST_LENGTH = 50
export const MIN_LANGUAGE_LENGTH = 5
export const MAX_LANGUAGE_LENGTH = 30
export const MAX_DISTANCE = 500
export const MIN_AGE = 18
export const MAX_AGE = 100
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

// Profile schemas
export const profileUpdateSchema = z.object({
    username: z.string()
        .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
        .max(MAX_USERNAME_LENGTH, `Username must be no more than ${MAX_USERNAME_LENGTH} characters`)
        .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    bio: z.string()
        .max(MAX_BIO_LENGTH, `Bio must be no more than ${MAX_BIO_LENGTH} characters`)
        .optional(),
    birth_date: z.string()
        .refine((date) => {
            const birthDate = new Date(date)
            const today = new Date()
            const age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ? age - 1
                : age
            return actualAge >= 18
        }, 'You must be at least 18 years old')
        .optional(),
    location: z.string()
        .max(MAX_LOCATION_LENGTH, `Location must be no more than ${MAX_LOCATION_LENGTH} characters`)
        .optional(),
    interests: z.array(z.string()
        .min(MIN_INTEREST_LENGTH, `Interest must be at least ${MIN_INTEREST_LENGTH} characters`)
        .max(MAX_INTEREST_LENGTH, `Interest must be no more than ${MAX_INTEREST_LENGTH} characters`)
    ).optional(),
    avatar_url: z.string().url('Invalid avatar URL').optional(),
    languages: z.array(z.string()
        .min(MIN_LANGUAGE_LENGTH, `Language must be at least ${MIN_LANGUAGE_LENGTH} characters`)
        .max(MAX_LANGUAGE_LENGTH, `Language must be no more than ${MAX_LANGUAGE_LENGTH} characters`)
    ).optional(),
})

export const profilePrivacySchema = z.object({
    show_online_status: z.boolean().default(true),
    show_distance: z.boolean().default(true),
    show_age: z.boolean().default(true),
    allow_messages_from: z.enum(['everyone', 'matches_only', 'nobody']).default('everyone'),
})

export const profileSearchSchema = z.object({
    query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    min_age: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    max_age: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    max_distance: z.number().min(0).max(MAX_DISTANCE).optional(),
    interests: z.array(z.string()).optional(),
    verified_only: z.boolean().default(false),
    online_only: z.boolean().default(false),
}).refine((data) => {
    if (data.min_age && data.max_age && data.min_age > data.max_age) {
        return false
    }
    return true
}, {
    message: 'Minimum age cannot be greater than maximum age',
    path: ['min_age'],
})

// Export types
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ProfilePrivacyInput = z.infer<typeof profilePrivacySchema>
export type ProfileSearchInput = z.infer<typeof profileSearchSchema>
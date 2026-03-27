import {z} from 'zod'

// Shared constants
export const MIN_PASSWORD_LENGTH = 6
export const MIN_USERNAME_LENGTH = 3
export const MAX_USERNAME_LENGTH = 30
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
})

export const registerSchema = loginSchema.extend({
    username: z.string()
        .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
        .max(MAX_USERNAME_LENGTH, `Username must be no more than ${MAX_USERNAME_LENGTH} characters`)
        .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores'),
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
        }, 'You must be at least 18 years old'),
})

export const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

// Export types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
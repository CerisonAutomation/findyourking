/**
 * Validation Schemas
 * 
 * Zod schemas for all API request and form validation.
 * Ensures type safety and consistent error messages across the application.
 */

import { z } from 'zod'

/** Sign in form validation */
export const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

/** Sign up form validation */
export const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password should be at least 6 characters'),
})

/** Magic link email validation */
export const sendMagicLinkSchema = z.object({
  email: z.string().email('Invalid email format'),
})

/** Forgot password form validation */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

/** Password update validation */
export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password should be at least 6 characters'),
})

/** Profile update validation */
export const updateProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  username: z.string().min(1, 'Username is required'),
  fullName: z.string().min(1, 'Full name is required'),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .optional()
    .or(z.literal('')),
  bio: z.string().optional(),
})

/** Booking creation validation */
export const createBookingSchema = z.object({
  king_id: z.string().min(1, 'King ID is required'),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
})

/** Chat request validation */
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z
          .string()
          .min(1, 'Message content cannot be empty'),
      })
    )
    .min(1, 'Messages array cannot be empty'),
  kingId: z.string().min(1, 'King ID is required for chat'),
})

/** Stripe checkout validation */
export const stripeCheckoutSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
})

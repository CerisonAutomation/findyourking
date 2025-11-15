import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password should be at least 6 characters"),
});

export const sendMagicLinkSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password should be at least 6 characters"),
});

export const updateProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  username: z.string().min(1, "Username is required"),
  fullName: z.string().min(1, "Full name is required"),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal('')),
  bio: z.string().optional(),
});

export const createBookingSchema = z.object({
  king_id: z.string().min(1, "King ID is required"),
  start_time: z.string().datetime("Invalid start time format"),
  end_time: z.string().datetime("Invalid end time format"),
});

export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1, "Message content cannot be empty"),
  })).min(1, "Messages array cannot be empty"),
  kingId: z.string().min(1, "King ID is required for chat"),
});

export const stripeCheckoutSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

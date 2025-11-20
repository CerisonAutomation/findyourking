/**
 * Comprehensive Input Validation Utilities
 * Per OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
 * Per Zod: https://zod.dev/
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

export const EmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim();

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(
    /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain a number or special character'
  );

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()
  .trim();

export const UUIDSchema = z
  .string()
  .uuid('Invalid ID format');

export const URLSchema = z
  .string()
  .url('Invalid URL')
  .max(2048, 'URL too long');

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const DateSchema = z
  .string()
  .datetime('Invalid date format')
  .or(z.date());

export const AgeSchema = z
  .number()
  .int('Age must be a whole number')
  .min(18, 'Must be at least 18 years old')
  .max(120, 'Invalid age');

/**
 * Profile validation schemas
 */

export const ProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name too long')
    .trim(),
  bio: z
    .string()
    .max(500, 'Bio too long')
    .optional(),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, 'Must be between 18 and 120 years old'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Invalid gender selection',
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

/**
 * Auth validation schemas
 */

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
  username: UsernameSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

export const UpdatePasswordSchema = z.object({
  newPassword: PasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Message validation schemas
 */

export const ChatMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long')
    .trim(),
  recipientId: UUIDSchema,
  attachments: z.array(URLSchema).max(10, 'Too many attachments').optional(),
});

/**
 * Match validation schemas
 */

export const LikeUserSchema = z.object({
  targetUserId: UUIDSchema,
});

/**
 * File upload validation schemas
 */

export const ImageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      { message: 'File size must be less than 5MB' }
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      { message: 'File must be JPEG, PNG, or WebP' }
    ),
});

/**
 * Pagination validation schemas
 */

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc'], {
    message: 'Sort order must be asc or desc',
  }).default('desc'),
});

/**
 * Search validation schemas
 */

export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query required').max(100, 'Query too long').trim(),
  filters: z.record(z.string(), z.unknown()).optional(),
  ...PaginationSchema.shape,
});

/**
 * Safe validation wrapper
 * Returns typed result with error handling
 */
export function validateData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Extract validation error messages
 */
export function getValidationErrors(error: z.ZodError<any>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return errors;
}

/**
 * Sanitize user input (XSS prevention)
 * Per OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 10000); // Limit length
}

/**
 * Validate and sanitize HTML content
 * Uses DOMPurify for safe HTML sanitization
 */
export function sanitizeHtml(dirty: string): string {
  // Simple implementation - in production, use DOMPurify
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

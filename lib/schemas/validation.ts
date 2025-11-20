/**
 * Zod validation schemas for input validation
 * Per Zod docs: https://zod.dev/
 * Per OWASP Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
 */

import { z } from "zod";

// ========== AUTH SCHEMAS ==========

/**
 * Email validation with comprehensive checks
 */
export const emailSchema = z
  .string()
  .min(3, "Email must be at least 3 characters")
  .max(255, "Email must not exceed 255 characters")
  .email("Invalid email format")
  .toLowerCase()
  .trim();

/**
 * Password validation per OWASP recommendations
 * Min 8 chars, max 128, requires uppercase, lowercase, digit, special char
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

/**
 * Username validation
 * Alphanumeric + underscore/hyphen only
 */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must not exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  )
  .toLowerCase()
  .trim();

/**
 * Full sign up schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),
  username: usernameSchema,
});

/**
 * Sign in schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// ========== PROFILE SCHEMAS ==========

/**
 * Bio validation with length limits
 */
export const bioSchema = z
  .string()
  .max(500, "Bio must not exceed 500 characters")
  .optional()
  .transform((val) => val?.trim());

/**
 * Birthdate validation (must be 18+)
 */
export const birthdateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format")
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, "You must be at least 18 years old");

/**
 * Gender enum
 */
export const genderSchema = z.enum(["male", "female", "non-binary", "other"]);

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .optional(),
  bio: bioSchema,
  birthdate: birthdateSchema.optional(),
  gender: genderSchema.optional(),
  preferences: z
    .object({
      gender_preference: z.array(genderSchema).min(1, "Select at least one gender preference"),
      age_min: z.number().int().min(18).max(100).optional(),
      age_max: z.number().int().min(18).max(100).optional(),
      distance_max: z.number().int().min(1).max(500).optional(),
      interests: z.array(z.string().max(50)).max(10).optional(),
      looking_for: z.enum(["friendship", "dating", "relationship", "networking"]).optional(),
    })
    .optional(),
});

// ========== MESSAGE SCHEMAS ==========

/**
 * Chat message validation
 */
export const messageSchema = z.object({
  text: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must not exceed 1000 characters")
    .trim(),
  match_id: z.string().uuid("Invalid match ID"),
});

// ========== REPORT SCHEMAS ==========

/**
 * Report reason enum
 */
export const reportReasonSchema = z.enum([
  "inappropriate_content",
  "harassment",
  "fake_profile",
  "spam",
  "underage",
  "other",
]);

/**
 * Report submission schema
 */
export const reportSchema = z.object({
  reported_user_id: z.string().uuid("Invalid user ID"),
  reason: reportReasonSchema,
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .trim(),
});

// ========== FILE UPLOAD SCHEMAS ==========

/**
 * Image upload validation
 */
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type),
      "File must be a JPEG, PNG, WebP, or AVIF image"
    ),
});

// ========== SEARCH & FILTER SCHEMAS ==========

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * Match filter schema
 */
export const matchFilterSchema = z.object({
  gender: z.array(genderSchema).optional(),
  age_min: z.number().int().min(18).max(100).optional(),
  age_max: z.number().int().min(18).max(100).optional(),
  distance_max: z.number().int().min(1).max(500).optional(),
});

// ========== TYPE EXPORTS ==========

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type MatchFilterInput = z.infer<typeof matchFilterSchema>;

// ========== VALIDATION HELPERS ==========

/**
 * Safe parse with detailed error messages
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`);
  return { success: false, errors };
}

import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters'),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),

  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),

  category: z.enum([
    'general',
    'support',
    'legal',
    'partnership',
    'bug',
    'feature',
  ]),

  priority: z.enum(['low', 'normal', 'high', 'urgent']),

  // Honeypot field for spam detection
  website: z.string().max(0, 'Spam detected').optional(),

  // File attachments (optional)
  attachments: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
        data: z.string(), // base64
      }),
    )
    .max(3, 'Maximum 3 attachments allowed')
    .optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

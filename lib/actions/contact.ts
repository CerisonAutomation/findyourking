'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { sendContactEmail } from '@/lib/email/contact';
import { contactFormSchema, type ContactFormData } from '@/lib/schemas/contact';
import { detectSpam } from '@/lib/security/spam-detection';

export interface ContactSubmissionResult {
  success: boolean;
  messageId?: string;
  error?: string;
  spamDetected?: boolean;
  rateLimited?: boolean;
}

/**
 * Submit contact form with comprehensive validation and security
 */
export async function submitContactForm(
  formData: ContactFormData,
): Promise<ContactSubmissionResult> {
  try {
    // Rate limiting check
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimit(`contact:${ip}`, 3);

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        rateLimited: true,
        error: 'Too many contact submissions. Please try again later.',
      };
    }

    // Validate form data
    const validatedData = contactFormSchema.parse(formData);

    // Spam detection
    const spamScore = detectSpam(validatedData.message, validatedData.email);
    const isSpam = spamScore > 0.7;

    if (isSpam) {
      // Still store spam messages for analysis but mark them
      console.warn(`Spam contact form submission detected: ${spamScore} score`);
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Store message in database
    const { data: message, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        user_id: user?.id || null,
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        category: validatedData.category,
        priority: validatedData.priority,
        ip_address: ip,
        user_agent: headersList.get('user-agent'),
        is_spam: isSpam,
        spam_score: spamScore,
        attachments: validatedData.attachments || [],
        metadata: {
          source: 'contact_form',
          user_authenticated: !!user,
          timestamp: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error storing contact message:', dbError);
      return {
        success: false,
        error: 'Failed to save your message. Please try again.',
      };
    }

    // Send email notifications (only if not spam)
    if (!isSpam) {
      try {
        await sendContactEmail({
          messageId: message.id,
          name: validatedData.name,
          email: validatedData.email,
          subject: validatedData.subject,
          message: validatedData.message,
          category: validatedData.category,
          priority: validatedData.priority,
        });

        // Send auto-reply to user
        await sendContactAutoReply({
          name: validatedData.name,
          email: validatedData.email,
          subject: validatedData.subject,
          category: validatedData.category,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the submission if email fails
      }
    }

    // Revalidate the contact page
    revalidatePath('/contact');

    return {
      success: true,
      messageId: message.id,
      spamDetected: isSpam,
    };
  } catch (error) {
    console.error('Contact form submission error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid form data. Please check your input.',
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get contact form statistics (for admin dashboard)
 */
export async function getContactStats(daysBack: number = 30) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_contact_stats', {
      days_back: daysBack,
    });

    if (error) {
      console.error('Error fetching contact stats:', error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Contact stats error:', error);
    return null;
  }
}

/**
 * Send auto-reply email to contact form submitter
 */
async function sendContactAutoReply({
  name,
  email,
  subject,
  category,
}: {
  name: string;
  email: string;
  subject: string;
  category: string;
}) {
  const autoReplySubject = `Thank you for contacting FindYourKing - ${subject}`;
  const autoReplyMessage = `
Dear ${name},

Thank you for reaching out to FindYourKing! We've received your message regarding "${subject}" and our team will review it shortly.

What happens next:
• Our support team will review your inquiry within 24-48 hours
• You'll receive a response via email with next steps
• For urgent issues, we aim to respond within 12 hours

If you have any additional information or urgent updates, please reply to this email.

Best regards,
The FindYourKing Support Team

---
This is an automated response. Please do not reply to this email.
For urgent matters, please contact support@findyourking.com directly.
  `.trim();

  // TODO: Implement actual email sending
  console.log(`Auto-reply email would be sent to ${email}`);
}

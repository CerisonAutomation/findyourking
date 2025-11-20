import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface ContactEmailData {
  messageId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
}

/**
 * Send contact form submission to support team
 */
export async function sendContactEmail(data: ContactEmailData) {
  try {
    const { messageId, name, email, subject, message, category, priority } =
      data;

    const priorityEmoji =
      {
        low: '🟢',
        normal: '🟡',
        high: '🟠',
        urgent: '🔴',
      }[priority] || '🟡';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .priority-low { background: #d4edda; color: #155724; }
    .priority-normal { background: #fff3cd; color: #856404; }
    .priority-high { background: #f8d7da; color: #721c24; }
    .priority-urgent { background: #f5c6cb; color: #721c24; }
    .message { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Form Submission</h1>
      <p>Message ID: ${messageId}</p>
    </div>

    <div class="content">
      <h2>Contact Details</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Priority:</strong> <span class="priority priority-${priority}">${priorityEmoji} ${priority.toUpperCase()}</span></p>

      <h2>Subject</h2>
      <p>${subject}</p>

      <h2>Message</h2>
      <div class="message">
        ${message.replace(/\n/g, '<br>')}
      </div>

      <div class="footer">
        <p>This message was sent from the FindYourKing contact form.</p>
        <p>Please respond within 24-48 hours for normal priority messages.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const result = await resend.emails.send({
      from: 'FindYourKing Support <support@findyourking.com>',
      to: ['support@findyourking.com'],
      subject: `${priorityEmoji} New Contact: ${subject}`,
      html: emailHtml,
      replyTo: email,
      tags: [
        { name: 'category', value: category },
        { name: 'priority', value: priority },
        { name: 'source', value: 'contact_form' },
      ],
    });

    console.log('Contact email sent successfully:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    throw error;
  }
}

/**
 * Send auto-reply to contact form submitter
 */
export async function sendContactAutoReply({
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
  try {
    const autoReplyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank you for contacting FindYourKing</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .next-steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Contacting FindYourKing! 🙏</h1>
    </div>

    <div class="content">
      <p>Dear ${name},</p>

      <p>Thank you for reaching out to FindYourKing! We've received your message regarding <strong>"${subject}"</strong> and our team will review it shortly.</p>

      <div class="next-steps">
        <h3>What happens next:</h3>
        <ul>
          <li>✅ Our support team will review your inquiry within 24-48 hours</li>
          <li>✅ You'll receive a response via email with next steps</li>
          <li>✅ For urgent issues, we aim to respond within 12 hours</li>
        </ul>
      </div>

      <p>If you have any additional information or urgent updates, please reply to this email.</p>

      <p>Best regards,<br>
      <strong>The FindYourKing Support Team</strong></p>
    </div>

    <div class="footer">
      <p>This is an automated response. Please do not reply to this email.</p>
      <p>For urgent matters, please contact <a href="mailto:support@findyourking.com">support@findyourking.com</a> directly.</p>
    </div>
  </div>
</body>
</html>`;

    const result = await resend.emails.send({
      from: 'FindYourKing Support <noreply@findyourking.com>',
      to: [email],
      subject: `Thank you for contacting FindYourKing - ${subject}`,
      html: autoReplyHtml,
      tags: [
        { name: 'type', value: 'auto_reply' },
        { name: 'category', value: category },
      ],
    });

    console.log('Auto-reply email sent successfully:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send auto-reply email:', error);
    throw error;
  }
}

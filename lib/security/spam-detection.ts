/**
 * Spam Detection Utility
 * Implements multiple spam detection techniques for contact forms
 */

export interface SpamDetectionResult {
  score: number; // 0.0 to 1.0
  isSpam: boolean;
  reasons: string[];
}

/**
 * Detect spam in contact form submissions
 */
export function detectSpam(message: string, email: string): number {
  let score = 0.0;
  const reasons: string[] = [];

  // Convert to lowercase for case-insensitive matching
  const lowerMessage = message.toLowerCase();
  const lowerEmail = email.toLowerCase();

  // Suspicious keywords (weighted)
  const suspiciousWords = {
    viagra: 0.3,
    casino: 0.3,
    lottery: 0.3,
    winner: 0.3,
    'free money': 0.4,
    'urgent business': 0.3,
    'million dollars': 0.4,
    inheritance: 0.3,
    bitcoin: 0.2,
    crypto: 0.2,
    'investment opportunity': 0.3,
    'work from home': 0.3,
    'guaranteed income': 0.3,
    'no experience required': 0.2,
    'click here': 0.2,
    'buy now': 0.2,
    'limited time offer': 0.3,
    'act now': 0.2,
    congratulations: 0.2,
  };

  for (const [word, weight] of Object.entries(suspiciousWords)) {
    if (lowerMessage.includes(word)) {
      score += weight;
      reasons.push(`Contains suspicious word: "${word}"`);
    }
  }

  // Check message length (very short messages might be spam)
  if (message.length < 20) {
    score += 0.2;
    reasons.push('Message too short');
  }

  // Check for excessive URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = message.match(urlRegex);
  if (urls && urls.length > 2) {
    score += 0.4;
    reasons.push('Too many URLs');
  }

  // Check for repeated characters (e.g., !!!! or ?????)
  if (/(.)\1{5,}/.test(message)) {
    score += 0.3;
    reasons.push('Repeated characters detected');
  }

  // Check for all caps
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.7 && message.length > 10) {
    score += 0.2;
    reasons.push('Excessive capitalization');
  }

  // Check email domain (suspicious free email providers)
  const suspiciousDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'temp-mail.org',
    'throwaway.email',
  ];

  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (emailDomain && suspiciousDomains.includes(emailDomain)) {
    score += 0.5;
    reasons.push('Suspicious email domain');
  }

  // Check for phone numbers (potential sales spam)
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(message)) {
    score += 0.1;
    reasons.push('Contains phone number');
  }

  // Check for excessive punctuation
  const punctuationRatio =
    (message.match(/[!?.,;]/g) || []).length / message.length;
  if (punctuationRatio > 0.3) {
    score += 0.1;
    reasons.push('Excessive punctuation');
  }

  // Bayesian-like adjustment based on message structure
  if (score > 0) {
    // If already flagged, check for legitimate patterns that might reduce score
    if (
      message.includes('error') ||
      message.includes('bug') ||
      message.includes('help')
    ) {
      score *= 0.7; // Reduce score for potentially legitimate support requests
    }
  }

  // Ensure score is between 0 and 1
  score = Math.max(0, Math.min(1, score));

  if (score > 0.1) {
    console.log(
      `Spam detection: ${score.toFixed(2)} score for message from ${email}`,
      reasons,
    );
  }

  return score;
}

/**
 * Advanced spam detection with machine learning-like features
 */
export function detectSpamAdvanced(
  message: string,
  email: string,
  metadata: Record<string, any> = {},
): SpamDetectionResult {
  const score = detectSpam(message, email);
  const reasons: string[] = [];

  // Additional checks based on metadata
  if (metadata.ipAddress) {
    // Could check against known spam IP databases
    // For now, just log
  }

  if (metadata.userAgent) {
    // Check for bot-like user agents
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'headless'];

    const lowerUA = metadata.userAgent.toLowerCase();
    if (botPatterns.some((pattern) => lowerUA.includes(pattern))) {
      score + 0.3;
      reasons.push('Bot-like user agent');
    }
  }

  return {
    score: Math.min(1, score),
    isSpam: score > 0.7,
    reasons,
  };
}

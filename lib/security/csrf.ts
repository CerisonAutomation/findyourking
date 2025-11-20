/**
 * CSRF Protection Utility
 * Implements double-submit cookie pattern with per-request token verification
 * Reference: https://owasp.org/www-community/attacks/csrf
 */

import { createHash, randomBytes } from 'crypto';

export interface CSRFToken {
  token: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate a CSRF token with cryptographic signature
 */
export function generateCSRFToken(secretKey: string = process.env.CSRF_SECRET || 'default-secret'): CSRFToken {
  const token = randomBytes(32).toString('hex');
  const timestamp = Date.now();
  const data = `${token}.${timestamp}`;
  
  const signature = createHash('sha256')
    .update(`${data}.${secretKey}`)
    .digest('hex');
  
  return {
    token,
    timestamp,
    signature,
  };
}

/**
 * Verify CSRF token validity
 */
export function verifyCSRFToken(
  clientToken: string,
  serverToken: string,
  secretKey: string = process.env.CSRF_SECRET || 'default-secret',
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
): boolean {
  try {
    // Parse tokens
    const clientParts = clientToken.split('.');
    const serverParts = serverToken.split('.');
    
    if (clientParts.length !== 3 || serverParts.length !== 3) {
      return false;
    }
    
    const [clientTokenValue, , clientSignature] = clientParts;
    const [serverTokenValue, serverTimestamp] = serverParts;
    
    // Verify token matches
    if (clientTokenValue !== serverTokenValue) {
      return false;
    }
    
    // Verify timestamp is recent
    const now = Date.now();
    const timestamp = parseInt(serverTimestamp, 10);
    if (isNaN(timestamp) || now - timestamp > maxAge) {
      return false;
    }
    
    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${serverToken}.${secretKey}`)
      .digest('hex');
    
    if (clientSignature !== expectedSignature) {
      return false;
    }
    
    // Verify server signature
    const expectedServerSignature = createHash('sha256')
      .update(`${serverTokenValue}.${serverTimestamp}.${secretKey}`)
      .digest('hex');
    
    return clientSignature === expectedServerSignature;
  } catch {
    return false;
  }
}

/**
 * Format CSRF token for transmission
 */
export function formatCSRFToken(token: CSRFToken): string {
  return `${token.token}.${token.timestamp}.${token.signature}`;
}

/**
 * Parse CSRF token from string
 */
export function parseCSRFToken(tokenString: string): CSRFToken | null {
  try {
    const [token, timestamp, signature] = tokenString.split('.');
    if (!token || !timestamp || !signature) {
      return null;
    }
    return {
      token,
      timestamp: parseInt(timestamp, 10),
      signature,
    };
  } catch {
    return null;
  }
}

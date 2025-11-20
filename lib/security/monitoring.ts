/**
 * Security Monitoring and Logging System
 * Implements audit logging, anomaly detection, and security event tracking
 * Reference: https://owasp.org/www-project-logging-cheat-sheet/
 */

export enum SecurityEventType {
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_INVALIDATION = 'TOKEN_INVALIDATION',
  CSRF_FAILURE = 'CSRF_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  SESSION_INVALIDATION = 'SESSION_INVALIDATION',
  SESSION_CREATED = 'SESSION_CREATED',
  HANDLER_ERROR = 'HANDLER_ERROR',
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyIndicators {
  failedLoginAttempts: number;
  rateLimitHits: number;
  csrfFailures: number;
  unauthorizedAccesses: number;
  suspiciousPatterns: string[];
}

/**
 * Security event logger
 */
class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 10000;
  private readonly eventRetention = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const logEntry: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(logEntry);

    // Clean up old events
    this.cleanup();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Event]', {
        type: logEntry.type,
        status: logEntry.status,
        riskLevel: logEntry.riskLevel,
        userId: logEntry.userId,
        timestamp: logEntry.timestamp.toISOString(),
      });
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production' && logEntry.riskLevel !== 'low') {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Get events for user
   */
  getEventsForUser(userId: string, hours = 24): SecurityEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events.filter(
      (e) => e.userId === userId && e.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get events by type
   */
  getEventsByType(
    type: SecurityEventType,
    hours = 24
  ): SecurityEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events.filter(
      (e) => e.type === type && e.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get events by IP address
   */
  getEventsByIP(ip: string, hours = 24): SecurityEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events.filter(
      (e) => e.ipAddress === ip && e.timestamp.getTime() > cutoff
    );
  }

  /**
   * Detect anomalies for user
   */
  detectAnomalies(userId: string, hours = 1): AnomalyIndicators {
    const userEvents = this.getEventsForUser(userId, hours);

    const failedLoginAttempts = userEvents.filter(
      (e) => e.type === SecurityEventType.AUTH_FAILURE && e.status === 'failure'
    ).length;

    const rateLimitHits = userEvents.filter(
      (e) => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED
    ).length;

    const csrfFailures = userEvents.filter(
      (e) => e.type === SecurityEventType.CSRF_FAILURE
    ).length;

    const unauthorizedAccesses = userEvents.filter(
      (e) => e.type === SecurityEventType.UNAUTHORIZED_ACCESS
    ).length;

    const suspiciousPatterns: string[] = [];

    if (failedLoginAttempts > 5) {
      suspiciousPatterns.push('Multiple failed login attempts');
    }
    if (rateLimitHits > 10) {
      suspiciousPatterns.push('Excessive rate limit hits');
    }
    if (csrfFailures > 3) {
      suspiciousPatterns.push('Multiple CSRF token failures');
    }
    if (unauthorizedAccesses > 5) {
      suspiciousPatterns.push('Multiple unauthorized access attempts');
    }

    return {
      failedLoginAttempts,
      rateLimitHits,
      csrfFailures,
      unauthorizedAccesses,
      suspiciousPatterns,
    };
  }

  /**
   * Detect anomalies from IP
   */
  detectAnomaliesFromIP(ip: string, hours = 1): AnomalyIndicators {
    const ipEvents = this.getEventsByIP(ip, hours);

    const failedLoginAttempts = ipEvents.filter(
      (e) => e.type === SecurityEventType.AUTH_FAILURE && e.status === 'failure'
    ).length;

    const rateLimitHits = ipEvents.filter(
      (e) => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED
    ).length;

    const suspiciousPatterns: string[] = [];

    if (failedLoginAttempts > 10) {
      suspiciousPatterns.push('IP: Multiple failed login attempts');
    }
    if (rateLimitHits > 50) {
      suspiciousPatterns.push('IP: Excessive rate limit hits - possible DDoS');
    }

    return {
      failedLoginAttempts,
      rateLimitHits,
      csrfFailures: 0,
      unauthorizedAccesses: 0,
      suspiciousPatterns,
    };
  }

  /**
   * Cleanup old events
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.eventRetention;

    // Remove old events
    this.events = this.events.filter((e) => e.timestamp.getTime() > cutoff);

    // Trim if too many
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Send event to external monitoring service
   */
  private sendToMonitoring(event: SecurityEvent): void {
    // TODO: Implement integration with monitoring service
    // Options: Sentry, Datadog, CloudWatch, etc.
    console.warn('[Security Monitoring]', {
      type: event.type,
      riskLevel: event.riskLevel,
      userId: event.userId,
      ipAddress: event.ipAddress,
    });
  }

  /**
   * Get all events (for admin dashboard)
   */
  getAllEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }
}

// Global singleton instance
let logger: SecurityLogger | null = null;

/**
 * Get security logger instance
 */
export function getSecurityLogger(): SecurityLogger {
  if (!logger) {
    logger = new SecurityLogger();
  }
  return logger;
}

/**
 * Log authentication success
 */
export function logAuthSuccess(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.AUTH_SUCCESS,
    userId,
    ipAddress,
    userAgent,
    status: 'success',
    riskLevel: 'low',
  });
}

/**
 * Log authentication failure
 */
export function logAuthFailure(
  email: string,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.AUTH_FAILURE,
    ipAddress,
    userAgent,
    status: 'failure',
    riskLevel: 'medium',
    details: { email, reason },
  });
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  identifier: string,
  ipAddress?: string,
  userId?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    userId,
    ipAddress,
    status: 'failure',
    riskLevel: 'medium',
    details: { identifier },
  });
}

/**
 * Log CSRF failure
 */
export function logCSRFFailure(
  userId?: string,
  ipAddress?: string,
  resource?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.CSRF_FAILURE,
    userId,
    ipAddress,
    resource,
    status: 'failure',
    riskLevel: 'high',
  });
}

/**
 * Log unauthorized access
 */
export function logUnauthorizedAccess(
  resource: string,
  userId?: string,
  ipAddress?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId,
    ipAddress,
    resource,
    status: 'failure',
    riskLevel: 'high',
  });
}

/**
 * Log data access
 */
export function logDataAccess(
  resource: string,
  userId: string,
  ipAddress?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.DATA_ACCESS,
    userId,
    ipAddress,
    resource,
    status: 'success',
    riskLevel: 'low',
  });
}

/**
 * Log data modification
 */
export function logDataModification(
  resource: string,
  action: string,
  userId: string,
  ipAddress?: string
): void {
  getSecurityLogger().log({
    type: SecurityEventType.DATA_MODIFICATION,
    userId,
    ipAddress,
    resource,
    action,
    status: 'success',
    riskLevel: 'medium',
  });
}

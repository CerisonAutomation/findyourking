/**
 * Audit Logging Service
 * Implements comprehensive audit trail per GDPR/SOC2 requirements
 * Per OWASP Logging: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
 */

import { createClient } from "../supabase/server";
import { AuditLog } from "../types";

/**
 * Audit-worthy actions requiring logging
 */
type AuditAction =
  | "user_login"
  | "user_logout"
  | "user_signup"
  | "user_delete"
  | "profile_update"
  | "password_change"
  | "email_change"
  | "match_created"
  | "match_deleted"
  | "user_blocked"
  | "user_unblocked"
  | "user_reported"
  | "message_sent"
  | "message_deleted"
  | "payment_processed"
  | "subscription_created"
  | "subscription_cancelled"
  | "admin_action"
  | "data_export_requested"
  | "data_deletion_requested";

/**
 * Resource types for audit trail
 */
type ResourceType =
  | "user"
  | "profile"
  | "match"
  | "message"
  | "block"
  | "report"
  | "subscription"
  | "payment";

/**
 * Log an auditable action
 *
 * @param userId - User performing the action
 * @param action - Action being performed
 * @param resourceType - Type of resource being acted upon
 * @param resourceId - ID of the specific resource (optional)
 * @param metadata - Additional context (sanitized, no PII)
 * @param ipAddress - IP address of the request (optional)
 * @param userAgent - User agent string (optional)
 */
export async function logAuditEvent(
  userId: string,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = await createClient();

  // Sanitize metadata - remove any PII or sensitive data
  const sanitizedMetadata = sanitizeMetadata(metadata || {});

  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: sanitizedMetadata,
    ip_address: ipAddress,
    user_agent: truncateString(userAgent, 255),
  });

  if (error) {
    // Audit logging failures should not break the app
    // But should be monitored
    if (process.env.NODE_ENV === 'development') {
      console.error("Audit log failed:", error);
    }
    // TODO: Send to error monitoring service (Sentry)
  }
}

/**
 * Get audit trail for a user (GDPR data export requirement)
 *
 * @param userId - User to get logs for
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @param limit - Max number of records (default 1000)
 */
export async function getUserAuditTrail(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 1000
): Promise<AuditLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }

  if (endDate) {
    query = query.lte("created_at", endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit trail: ${error.message}`);
  }

  return (data || []) as AuditLog[];
}

/**
 * Get audit logs for a specific resource
 * Useful for compliance and forensics
 */
export async function getResourceAuditTrail(
  resourceType: ResourceType,
  resourceId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch resource audit trail: ${error.message}`);
  }

  return (data || []) as AuditLog[];
}

/**
 * Cleanup old audit logs
 * Should be run via cron job
 * Retention policy: Keep 1 year for compliance, then delete
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<void> {
  const supabase = await createClient();
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("audit_logs")
    .delete()
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Audit log cleanup failed:", error);
    }
  }
}

/**
 * Get audit statistics for admin dashboard
 */
export async function getAuditStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalActions: number;
  actionBreakdown: Record<string, number>;
  activeUsers: number;
}> {
  const supabase = await createClient();

  // Get all logs in date range
  const { data, error } = await supabase
    .from("audit_logs")
    .select("action, user_id")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch audit statistics: ${error.message}`);
  }

  const logs = data || [];
  const actionBreakdown: Record<string, number> = {};
  const uniqueUsers = new Set<string>();

  logs.forEach((log) => {
    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    uniqueUsers.add(log.user_id);
  });

  return {
    totalActions: logs.length,
    actionBreakdown,
    activeUsers: uniqueUsers.size,
  };
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Sanitize metadata to remove sensitive information
 * Per OWASP: Never log passwords, tokens, credit cards, etc.
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "api_key",
    "credit_card",
    "ssn",
    "authorization",
  ];

  Object.keys(metadata).forEach((key) => {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof metadata[key] === "string") {
      // Truncate long strings
      sanitized[key] = truncateString(metadata[key] as string, 500);
    } else if (typeof metadata[key] === "object" && metadata[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(metadata[key] as Record<string, unknown>);
    } else {
      sanitized[key] = metadata[key];
    }
  });

  return sanitized;
}

/**
 * Truncate string to max length
 */
function truncateString(str: string | undefined, maxLength: number): string | undefined {
  if (!str) return undefined;
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
}

/**
 * Helper to extract IP address from request headers
 * Handles proxies and load balancers
 */
export function extractIpAddress(headers: Headers): string | undefined {
  // Check for common proxy headers
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Helper to extract user agent from request headers
 */
export function extractUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}

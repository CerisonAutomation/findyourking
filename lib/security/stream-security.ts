/**
 * Stream Chat Security Utilities
 * Manages token generation, validation, and permission scopes
 * Reference: https://getstream.io/chat/docs/node/authentication/
 */

// Wrap Stream Chat imports to make them optional
let StreamChat: any = null;
try {
  const streamModule = require('stream-chat');
  StreamChat = streamModule.StreamChat;
} catch {
  console.warn('stream-chat not available');
}

export interface StreamTokenConfig {
  userId: string;
  userName?: string;
  userImage?: string;
  customData?: Record<string, unknown>;
  expiresIn?: number; // Token expiry in seconds
}

export interface StreamUserPermissions {
  canSendMessage: boolean;
  canDeleteOwnMessage: boolean;
  canEditOwnMessage: boolean;
  canMuteUser: boolean;
  canBanUser: boolean;
  isChannelModerator: boolean;
  isChannelOwner: boolean;
}

/**
 * Generate Stream Chat user token
 * Should only be called from secure server-side context
 */
export function generateStreamChatToken(config: StreamTokenConfig): string | null {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const streamSecret = process.env.STREAM_SECRET;

    if (!apiKey || !streamSecret) {
      console.error('Stream Chat credentials missing');
      return null;
    }

    // Create Stream Chat client (server-side only)
    const client = StreamChat.getInstance(apiKey, streamSecret);

    // Generate token directly (simpler approach without setUser)
    const token = client.createToken(config.userId, config.expiresIn || 3600);

    console.info('[Stream Chat] Token generated', {
      userId: config.userId,
      expiresIn: config.expiresIn || 3600,
      timestamp: new Date().toISOString(),
    });

    return token;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stream Chat] Token generation failed:', errorMessage);
    return null;
  }
}

/**
 * Validate Stream token format
 */
export function isValidStreamToken(token: string): boolean {
  try {
    // Stream tokens are JWTs, validate basic JWT format
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Validate each part is base64
    return parts.every((part) => {
      try {
        Buffer.from(part, 'base64').toString();
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Get default user permissions (least privilege)
 */
export function getDefaultUserPermissions(): StreamUserPermissions {
  return {
    canSendMessage: true,
    canDeleteOwnMessage: true,
    canEditOwnMessage: true,
    canMuteUser: false,
    canBanUser: false,
    isChannelModerator: false,
    isChannelOwner: false,
  };
}

/**
 * Get moderator permissions
 */
export function getModeratorPermissions(): StreamUserPermissions {
  return {
    canSendMessage: true,
    canDeleteOwnMessage: true,
    canEditOwnMessage: true,
    canMuteUser: true,
    canBanUser: true,
    isChannelModerator: true,
    isChannelOwner: false,
  };
}

/**
 * Get channel owner permissions
 */
export function getChannelOwnerPermissions(): StreamUserPermissions {
  return {
    canSendMessage: true,
    canDeleteOwnMessage: true,
    canEditOwnMessage: true,
    canMuteUser: true,
    canBanUser: true,
    isChannelModerator: true,
    isChannelOwner: true,
  };
}

/**
 * Validate user can perform action
 */
export function canPerformAction(
  permission: keyof StreamUserPermissions,
  userPermissions: StreamUserPermissions
): boolean {
  return userPermissions[permission] === true;
}

/**
 * Log Stream Chat security event
 */
export function logStreamSecurityEvent(
  event: string,
  userId: string,
  channelId?: string,
  details?: Record<string, unknown>
): void {
  console.info('[Stream Chat Security]', {
    event,
    userId,
    channelId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Verify user is channel member before allowing message
 */
export async function verifyChannelMembership(
  userId: string,
  channelId: string,
  client: InstanceType<typeof StreamChat>
): Promise<boolean> {
  try {
    // Get channel and check membership
    const channel = client.channel('messaging', channelId);
    
    // Query channel members
    const response = await channel.queryMembers({ user_id: userId });
    
    // If we got any members back, user is a member
    return (response.members || []).length > 0;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stream Chat] Membership verification failed:', errorMessage);
    return false;
  }
}

/**
 * Generate short-lived token for temporary access (e.g., video call)
 */
export function generateTemporaryStreamToken(
  userId: string,
  durationSeconds = 300 // 5 minutes default
): string | null {
  return generateStreamChatToken({
    userId,
    expiresIn: durationSeconds,
  });
}

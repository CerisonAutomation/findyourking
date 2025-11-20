/**
 * ENHANCED REALTIME CONNECTION MANAGER
 *
 * Based on @supabase/realtime-js best practices
 * Features:
 * - Connection state management
 * - Automatic reconnection with exponential backoff
 * - Heartbeat monitoring
 * - Error handling and recovery
 * - Message buffering for offline mode
 * - Channel lifecycle management
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, SupabaseClient, RealtimeChannelOptions } from '@supabase/supabase-js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type ChannelState = 'closed' | 'joining' | 'joined' | 'leaving' | 'errored';

export interface ConnectionOptions {
  maxReconnectAttempts?: number;
  reconnectIntervals?: number[];
  heartbeatInterval?: number;
  enableLogging?: boolean;
}

interface PendingMessage {
  channelName: string;
  event: string;
  payload: any;
  timestamp: number;
}

interface ChannelInfo {
  channel: RealtimeChannel;
  state: ChannelState;
  retryCount: number;
  lastError?: Error;
}

const DEFAULT_OPTIONS: Required<ConnectionOptions> = {
  maxReconnectAttempts: 5,
  reconnectIntervals: [1000, 2000, 5000, 10000, 30000],
  heartbeatInterval: 25000,
  enableLogging: false,
};

export class RealtimeConnectionManager {
  private supabase: SupabaseClient;
  private state: ConnectionState = 'disconnected';
  private channels: Map<string, ChannelInfo> = new Map();
  private pendingMessages: PendingMessage[] = [];
  private options: Required<ConnectionOptions>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempt: number = 0;
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private channelStateListeners: Map<string, Set<(state: ChannelState) => void>> = new Map();

  constructor(options: ConnectionOptions = {}) {
    this.supabase = createClient();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  /**
   * Subscribe to channel state changes
   */
  onChannelStateChange(channelName: string, callback: (state: ChannelState) => void): () => void {
    if (!this.channelStateListeners.has(channelName)) {
      this.channelStateListeners.set(channelName, new Set());
    }
    this.channelStateListeners.get(channelName)!.add(callback);

    return () => {
      const listeners = this.channelStateListeners.get(channelName);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.channelStateListeners.delete(channelName);
        }
      }
    };
  }

  /**
   * Create or get existing channel with proper error handling
   */
  async getChannel(
    channelName: string,
    config?: RealtimeChannelOptions
  ): Promise<RealtimeChannel | null> {
    try {
      // Return existing channel if already created
      const existing = this.channels.get(channelName);
      if (existing) {
        this.log(`Reusing existing channel: ${channelName}`);
        return existing.channel;
      }

      // Create new channel
      this.log(`Creating new channel: ${channelName}`);
      const channel = this.supabase.channel(channelName, config);

      // Track channel info
      this.channels.set(channelName, {
        channel,
        state: 'closed',
        retryCount: 0,
      });

      // Subscribe to channel
      return await this.subscribeChannel(channelName);
    } catch (error) {
      this.handleError('getChannel', error);
      return null;
    }
  }

  /**
   * Subscribe to a channel with retry logic
   */
  private async subscribeChannel(channelName: string): Promise<RealtimeChannel | null> {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo) {
      this.log(`Channel not found: ${channelName}`, 'error');
      return null;
    }

    const { channel } = channelInfo;

    return new Promise((resolve) => {
      this.updateChannelState(channelName, 'joining');

      channel.subscribe((status, err) => {
        this.log(`Channel ${channelName} status: ${status}`);

        switch (status) {
          case 'SUBSCRIBED':
            this.updateChannelState(channelName, 'joined');
            this.updateConnectionState('connected');
            this.reconnectAttempt = 0;
            this.flushPendingMessages(channelName);
            this.startHeartbeat();
            resolve(channel);
            break;

          case 'CHANNEL_ERROR':
            this.updateChannelState(channelName, 'errored');
            const error = new Error(err?.message || 'Channel subscription failed');
            this.handleChannelError(channelName, error);
            resolve(null);
            break;

          case 'TIMED_OUT':
            this.updateChannelState(channelName, 'errored');
            this.handleChannelTimeout(channelName);
            resolve(null);
            break;

          case 'CLOSED':
            this.updateChannelState(channelName, 'closed');
            this.handleChannelClose(channelName);
            resolve(null);
            break;
        }
      });
    });
  }

  /**
   * Send message with offline queue support
   */
  async send(
    channelName: string,
    event: string,
    payload: any,
    options?: { retry?: boolean; timeout?: number }
  ): Promise<boolean> {
    const channelInfo = this.channels.get(channelName);

    // Queue message if channel not ready
    if (!channelInfo || channelInfo.state !== 'joined') {
      if (options?.retry !== false) {
        this.queueMessage(channelName, event, payload);
        this.log(`Message queued for ${channelName}: ${event}`);
        return false;
      }
      return false;
    }

    try {
      const result = await channelInfo.channel.send({
        type: 'broadcast',
        event,
        payload,
      });

      return result === 'ok';
    } catch (error) {
      this.handleError('send', error);

      // Queue for retry if enabled
      if (options?.retry !== false) {
        this.queueMessage(channelName, event, payload);
      }

      return false;
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(channelName: string, event: string, payload: any): void {
    this.pendingMessages.push({
      channelName,
      event,
      payload,
      timestamp: Date.now(),
    });

    // Limit queue size to prevent memory issues (max 100 messages)
    if (this.pendingMessages.length > 100) {
      this.pendingMessages.shift();
      this.log('Message queue overflow - oldest message dropped', 'warn');
    }
  }

  /**
   * Flush pending messages for a channel
   */
  private async flushPendingMessages(channelName: string): Promise<void> {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo || channelInfo.state !== 'joined') return;

    const messages = this.pendingMessages.filter(m => m.channelName === channelName);
    if (messages.length === 0) return;

    this.log(`Flushing ${messages.length} pending messages for ${channelName}`);

    for (const msg of messages) {
      try {
        await channelInfo.channel.send({
          type: 'broadcast',
          event: msg.event,
          payload: msg.payload,
        });
      } catch (error) {
        this.log(`Failed to flush message: ${error}`, 'error');
      }
    }

    // Remove flushed messages
    this.pendingMessages = this.pendingMessages.filter(m => m.channelName !== channelName);
  }

  /**
   * Handle channel error with retry logic
   */
  private handleChannelError(channelName: string, error: Error): void {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo) return;

    channelInfo.lastError = error;
    this.log(`Channel error for ${channelName}: ${error.message}`, 'error');

    // Attempt reconnection if under retry limit
    if (channelInfo.retryCount < this.options.maxReconnectAttempts) {
      this.scheduleChannelReconnect(channelName);
    } else {
      this.log(`Max reconnect attempts reached for ${channelName}`, 'error');
      this.updateConnectionState('error');
    }
  }

  /**
   * Handle channel timeout
   */
  private handleChannelTimeout(channelName: string): void {
    this.log(`Channel timeout for ${channelName}`, 'warn');
    this.scheduleChannelReconnect(channelName);
  }

  /**
   * Handle channel close
   */
  private handleChannelClose(channelName: string): void {
    this.log(`Channel closed: ${channelName}`);
    const channelInfo = this.channels.get(channelName);

    // Only reconnect if not intentionally closed
    if (channelInfo && channelInfo.state !== 'leaving') {
      this.scheduleChannelReconnect(channelName);
    }
  }

  /**
   * Schedule channel reconnection with exponential backoff
   */
  private scheduleChannelReconnect(channelName: string): void {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo) return;

    channelInfo.retryCount++;
    const interval = this.options.reconnectIntervals[
      Math.min(channelInfo.retryCount - 1, this.options.reconnectIntervals.length - 1)
    ];

    this.log(`Scheduling reconnect for ${channelName} in ${interval}ms (attempt ${channelInfo.retryCount})`);
    this.updateConnectionState('reconnecting');

    setTimeout(async () => {
      this.log(`Attempting to reconnect ${channelName}...`);
      await this.subscribeChannel(channelName);
    }, interval);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, this.options.heartbeatInterval);
  }

  /**
   * Check connection health
   */
  private checkConnectionHealth(): void {
    let allHealthy = true;

    for (const [name, info] of this.channels.entries()) {
      if (info.state !== 'joined') {
        allHealthy = false;
        this.log(`Channel ${name} unhealthy (state: ${info.state})`, 'warn');
      }
    }

    if (!allHealthy && this.state === 'connected') {
      this.updateConnectionState('reconnecting');
    }
  }

  /**
   * Remove a channel
   */
  async removeChannel(channelName: string): Promise<void> {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo) return;

    this.log(`Removing channel: ${channelName}`);
    this.updateChannelState(channelName, 'leaving');

    try {
      await this.supabase.removeChannel(channelInfo.channel);
    } catch (error) {
      this.log(`Error removing channel ${channelName}: ${error}`, 'error');
    }

    this.channels.delete(channelName);
    this.channelStateListeners.delete(channelName);

    // Remove pending messages for this channel
    this.pendingMessages = this.pendingMessages.filter(m => m.channelName !== channelName);
  }

  /**
   * Cleanup all channels and timers
   */
  async cleanup(): Promise<void> {
    this.log('Cleaning up connection manager');

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Remove all channels
    const channelNames = Array.from(this.channels.keys());
    await Promise.all(channelNames.map(name => this.removeChannel(name)));

    // Clear state
    this.pendingMessages = [];
    this.stateListeners.clear();
    this.channelStateListeners.clear();
    this.updateConnectionState('disconnected');
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(newState: ConnectionState): void {
    if (this.state === newState) return;

    this.log(`Connection state: ${this.state} -> ${newState}`);
    this.state = newState;

    this.stateListeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        this.log(`Error in state listener: ${error}`, 'error');
      }
    });
  }

  /**
   * Update channel state and notify listeners
   */
  private updateChannelState(channelName: string, newState: ChannelState): void {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo || channelInfo.state === newState) return;

    this.log(`Channel ${channelName} state: ${channelInfo.state} -> ${newState}`);
    channelInfo.state = newState;

    const listeners = this.channelStateListeners.get(channelName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          this.log(`Error in channel state listener: ${error}`, 'error');
        }
      });
    }
  }

  /**
   * Handle errors
   */
  private handleError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.log(`Error in ${context}: ${message}`, 'error');
  }

  /**
   * Log messages if logging is enabled
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.options.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = `[RealtimeConnectionManager ${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Get channel state
   */
  getChannelState(channelName: string): ChannelState | null {
    return this.channels.get(channelName)?.state || null;
  }

  /**
   * Get all channel names
   */
  getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get pending message count
   */
  getPendingMessageCount(channelName?: string): number {
    if (channelName) {
      return this.pendingMessages.filter(m => m.channelName === channelName).length;
    }
    return this.pendingMessages.length;
  }
}

// Export singleton instance
export const realtimeConnectionManager = new RealtimeConnectionManager({
  enableLogging: process.env.NODE_ENV === 'development',
});

export default RealtimeConnectionManager;

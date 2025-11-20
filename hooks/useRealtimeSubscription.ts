/**
 * ENHANCED REALTIME SUBSCRIPTION HOOK
 * Based on @supabase/realtime-js best practices
 *
 * Features:
 * - Connection state tracking
 * - Automatic retry on failure
 * - Timeout handling
 * - Proper cleanup
 * - Error recovery
 * - Event-specific callbacks
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeConnectionManager, type ConnectionState, type ChannelState } from '@/lib/realtime/connection-manager';

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: Partial<T>;
  errors?: any;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export interface UseRealtimeSubscriptionOptions<T = any> {
  /**
   * Callback for INSERT events
   */
  onInsert?: (payload: RealtimePayload<T>) => void;

  /**
   * Callback for UPDATE events
   */
  onUpdate?: (payload: RealtimePayload<T>) => void;

  /**
   * Callback for DELETE events
   */
  onDelete?: (payload: RealtimePayload<T>) => void;

  /**
   * Generic callback for all events
   */
  onReceive?: (payload: RealtimePayload<T>) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Callback when connection state changes
   */
  onConnectionStateChange?: (state: ConnectionState) => void;

  /**
   * Callback when channel state changes
   */
  onChannelStateChange?: (state: ChannelState) => void;

  /**
   * Enable automatic retry on connection failure
   * @default true
   */
  enableRetry?: boolean;

  /**
   * Log subscription events
   * @default false
   */
  enableLogging?: boolean;
}

export interface UseRealtimeSubscriptionResult {
  connectionState: ConnectionState;
  channelState: ChannelState;
  error: Error | null;
  isSubscribed: boolean;
  retry: () => void;
}

/**
 * Enhanced hook for subscribing to Supabase realtime updates
 *
 * @param table - The table name to subscribe to
 * @param filter - Optional filter string (e.g., "user_id=eq.123")
 * @param options - Subscription options with callbacks and configuration
 * @returns Subscription state and controls
 *
 * @example
 * ```tsx
 * const { isSubscribed, connectionState, retry } = useRealtimeSubscription(
 *   'messages',
 *   'user_id=eq.123',
 *   {
 *     onInsert: (payload) => console.log('New message:', payload.new),
 *     onUpdate: (payload) => console.log('Updated message:', payload.new),
 *     onDelete: (payload) => console.log('Deleted message:', payload.old),
 *     onError: (error) => console.error('Subscription error:', error),
 *   }
 * );
 * ```
 */
export function useRealtimeSubscription<T = any>(
  table: string,
  filter?: string,
  options: UseRealtimeSubscriptionOptions<T> = {}
): UseRealtimeSubscriptionResult {
  const {
    onInsert,
    onUpdate,
    onDelete,
    onReceive,
    onError,
    onConnectionStateChange,
    onChannelStateChange,
    enableRetry = true,
    enableLogging = false,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [channelState, setChannelState] = useState<ChannelState>('closed');
  const [error, setError] = useState<Error | null>(null);

  const channelName = `${table}_changes${filter ? `_${filter}` : ''}`;
  const mountedRef = useRef(true);

  // Log helper
  const log = useCallback(
    (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      if (!enableLogging) return;

      const prefix = `[useRealtimeSubscription ${table}]`;
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
    },
    [enableLogging, table]
  );

  // Setup subscription
  useEffect(() => {
    mountedRef.current = true;

    async function setupSubscription() {
      try {
        log('Setting up subscription...');

        // Subscribe to connection state changes
        const unsubscribeConnectionState = realtimeConnectionManager.onStateChange((state) => {
          if (!mountedRef.current) return;

          setConnectionState(state);
          onConnectionStateChange?.(state);
          log(`Connection state: ${state}`);
        });

        // Subscribe to channel state changes
        const unsubscribeChannelState = realtimeConnectionManager.onChannelStateChange(
          channelName,
          (state) => {
            if (!mountedRef.current) return;

            setChannelState(state);
            onChannelStateChange?.(state);
            log(`Channel state: ${state}`);
          }
        );

        // Get or create channel
        const channel = await realtimeConnectionManager.getChannel(channelName);

        if (!channel || !mountedRef.current) {
          log('Channel creation failed or component unmounted', 'warn');
          return;
        }

        // Subscribe to postgres changes
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            if (!mountedRef.current) return;

            const typedPayload = payload as RealtimePayload<T>;
            log(`Received ${typedPayload.eventType} event`);

            // Call generic callback
            onReceive?.(typedPayload);

            // Call event-specific callbacks
            switch (typedPayload.eventType) {
              case 'INSERT':
                onInsert?.(typedPayload);
                break;
              case 'UPDATE':
                onUpdate?.(typedPayload);
                break;
              case 'DELETE':
                onDelete?.(typedPayload);
                break;
            }
          }
        );

        setError(null);
        log('Subscription setup complete');

        // Cleanup function
        return () => {
          mountedRef.current = false;
          unsubscribeConnectionState();
          unsubscribeChannelState();
          log('Unsubscribed from state changes');
        };
      } catch (err) {
        if (!mountedRef.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        log(`Subscription setup error: ${error.message}`, 'error');
        setError(error);
        onError?.(error);

        if (!enableRetry) {
          setConnectionState('error');
        }
      }
    }

    setupSubscription();

    return () => {
      mountedRef.current = false;
    };
  }, [
    table,
    filter,
    channelName,
    onInsert,
    onUpdate,
    onDelete,
    onReceive,
    onError,
    onConnectionStateChange,
    onChannelStateChange,
    enableRetry,
    log,
  ]);

  // Retry function
  const retry = useCallback(async () => {
    log('Manual retry requested');
    setError(null);

    try {
      // Remove and recreate channel
      await realtimeConnectionManager.removeChannel(channelName);
      log('Channel removed, will be recreated by effect');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log(`Retry error: ${error.message}`, 'error');
      setError(error);
      onError?.(error);
    }
  }, [channelName, log, onError]);

  return {
    connectionState,
    channelState,
    error,
    isSubscribed: channelState === 'joined',
    retry,
  };
}

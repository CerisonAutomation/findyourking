'use client';

/**
 * REALTIME CONNECTION STATUS COMPONENT
 *
 * Displays real-time connection status with visual indicators
 * Based on @supabase/realtime-js connection states
 */

import { useEffect, useState } from 'react';
import { type ConnectionState, type ChannelState } from '@/lib/realtime/connection-manager';
import {
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  channelState?: ChannelState;
  error?: Error | null;
  pendingMessageCount?: number;
  onRetry?: () => void;
  /**
   * Show minimal status (just icon)
   * @default false
   */
  minimal?: boolean;
  /**
   * Show connection details
   * @default false
   */
  showDetails?: boolean;
  className?: string;
}

interface StatusConfig {
  icon: React.ReactNode;
  text: string;
  description: string;
  color: string;
  bgColor: string;
  pulse?: boolean;
}

const getStatusConfig = (
  connectionState: ConnectionState,
  channelState?: ChannelState
): StatusConfig => {
  // Connection state takes precedence
  switch (connectionState) {
    case 'connected':
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Connected',
        description: 'Real-time updates active',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
      };

    case 'connecting':
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Connecting',
        description: 'Establishing connection...',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        pulse: true,
      };

    case 'reconnecting':
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        text: 'Reconnecting',
        description: 'Connection lost, attempting to reconnect...',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        pulse: true,
      };

    case 'error':
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Connection Error',
        description: 'Unable to establish connection',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      };

    case 'disconnected':
    default:
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Disconnected',
        description: 'Real-time updates unavailable',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      };
  }
};

export function ConnectionStatus({
  connectionState,
  channelState,
  error,
  pendingMessageCount = 0,
  onRetry,
  minimal = false,
  showDetails = false,
  className = '',
}: ConnectionStatusProps) {
  const [showBanner, setShowBanner] = useState(false);
  const status = getStatusConfig(connectionState, channelState);

  // Show banner for non-connected states after a delay
  useEffect(() => {
    if (connectionState !== 'connected') {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [connectionState]);

  // Minimal mode - just an icon
  if (minimal) {
    return (
      <div
        className={`inline-flex items-center gap-1 ${status.color} ${className}`}
        title={status.description}
      >
        {status.icon}
        {status.pulse && (
          <span className="flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${status.bgColor} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.bgColor}`}></span>
          </span>
        )}
      </div>
    );
  }

  // Full banner mode for errors or disconnected state
  if (showBanner && connectionState !== 'connected') {
    return (
      <Alert className={`${status.bgColor} border-none ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={status.color}>
              {status.icon}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${status.color}`}>
                {status.text}
              </div>
              <AlertDescription className="text-sm">
                {error?.message || status.description}
                {pendingMessageCount > 0 && (
                  <span className="ml-2 font-medium">
                    ({pendingMessageCount} message{pendingMessageCount !== 1 ? 's' : ''} pending)
                  </span>
                )}
              </AlertDescription>
            </div>
          </div>
          {onRetry && (connectionState === 'error' || connectionState === 'disconnected') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  // Compact status indicator
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor}`}>
        <div className={`${status.color} flex items-center gap-1`}>
          {status.icon}
          {status.pulse && (
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color}`}></span>
            </span>
          )}
        </div>
        <span className={`text-sm font-medium ${status.color}`}>
          {status.text}
        </span>
        {pendingMessageCount > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/50 ${status.color}`}>
            {pendingMessageCount}
          </span>
        )}
      </div>

      {showDetails && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {channelState && `Channel: ${channelState}`}
        </div>
      )}
    </div>
  );
}

/**
 * Simple connection dot indicator
 */
export function ConnectionDot({
  connectionState,
  className = '',
}: {
  connectionState: ConnectionState;
  className?: string;
}) {
  const colorMap: Record<ConnectionState, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-blue-500',
    reconnecting: 'bg-yellow-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  };

  const shouldPulse = connectionState === 'connecting' || connectionState === 'reconnecting';

  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      {shouldPulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorMap[connectionState]} opacity-75`}
        ></span>
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${colorMap[connectionState]}`}
      ></span>
    </span>
  );
}

export default ConnectionStatus;

'use client';

/**
 * STREAM CHAT INTERFACE - Optional Stream.io Integration
 * Per Stream Chat Docs: https://getstream.io/chat/docs/react/
 * NOTE: This is a placeholder for optional Stream.io integration
 */

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface StreamChatInterfaceProps {
  userId?: string;
  channelId?: string;
}

export default function StreamChatInterface({ userId, channelId }: StreamChatInterfaceProps) {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if Stream is configured
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    setIsConfigured(!!apiKey && apiKey !== 'your-stream-api-key');
  }, []);

  if (!isConfigured) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Stream Chat is not configured. Using native Supabase Realtime chat instead.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Stream Chat integration is optional. Native Supabase Realtime chat is fully functional.
      </p>
    </div>
  );
}

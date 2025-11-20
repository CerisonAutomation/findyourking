import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ChatConversationSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* Incoming message */}
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg max-w-xs">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="bg-blue-500 px-4 py-2 rounded-lg max-w-xs">
            <Skeleton className="h-4 w-28 mb-1 bg-blue-400" />
            <Skeleton className="h-3 w-12 bg-blue-400" />
          </div>
        </div>

        {/* Incoming message */}
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg max-w-xs">
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="bg-blue-500 px-4 py-2 rounded-lg max-w-xs">
            <Skeleton className="h-4 w-36 mb-1 bg-blue-400" />
            <Skeleton className="h-3 w-14 bg-blue-400" />
          </div>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="flex-1 h-10 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}
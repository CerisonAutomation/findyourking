/**
 * CHAT LIST SKELETON - LOADING STATE
 */

export default function ChatListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-2" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded mx-auto" />
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center p-6 bg-white dark:bg-gray-800 rounded-2xl">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 ml-4 space-y-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
              </div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

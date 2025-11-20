/**
 * MATCHES SKELETON - LOADING STATE
 * Per Next.js Loading UI: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 */

export default function MatchesSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="text-center mb-8 animate-pulse">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-2" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded mx-auto" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="aspect-[3/4] bg-gray-300 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-12 flex-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    <div className="h-12 flex-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

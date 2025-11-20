/**
 * Parallel Route: Analytics Slot
 */

import { Suspense } from 'react';

async function AnalyticsData() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-lg mb-4">Analytics</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Views</span>
          <span className="font-bold">1,234</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Engagement</span>
          <span className="font-bold">87%</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsSlot() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <AnalyticsData />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Matches error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Failed to load matches
      </h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

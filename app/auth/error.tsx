'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-pink-50">
      <div className="text-center px-4 max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Authentication Error
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'Something went wrong with authentication'}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

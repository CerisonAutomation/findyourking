/**
 * Advanced Lazy Loading Module - Per Next.js Dynamic Imports
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */

import dynamic from 'next/dynamic';

const LoadingSkeleton = () => (
  <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
);

export const LazyMatchCard = dynamic(() => import('@/components/MatchCard'), {
  loading: LoadingSkeleton,
  ssr: false,
});

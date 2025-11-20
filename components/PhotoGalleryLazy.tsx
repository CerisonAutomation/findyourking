'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load PhotoGallery component
const PhotoGallery = dynamic(() => import('@/components/PhotoGallery').then(mod => ({ default: mod.PhotoGallery })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  ),
  ssr: false,
});

export default PhotoGallery;

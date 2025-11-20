/**
 * Optimized Avatar Component with Next.js Image Optimization
 * Features: lazy loading, blur placeholder, fallback, responsive sizing
 * Per Next.js docs: https://nextjs.org/docs/app/api-reference/components/image
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import {
  getOptimizedImageUrl,
  getAvatarFallback,
  getBlurDataURL,
  IMAGE_QUALITY,
  IMAGE_SIZES,
} from '@/lib/utils/image-optimization';
import { cn } from '@/lib/utils';

interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
  className?: string;
  fallbackColor?: string;
}

const sizeMap = {
  sm: IMAGE_SIZES.AVATAR_SM.width,
  md: IMAGE_SIZES.AVATAR_MD.width,
  lg: IMAGE_SIZES.AVATAR_LG.width,
  xl: 200,
};

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  priority = false,
  className = '',
  fallbackColor = '#e11d48',
}: OptimizedAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeValue = sizeMap[size];
  const initials = getAvatarFallback(alt);

  // Show fallback if no src or image failed to load
  if (!src || imageError) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full bg-linear-to-br',
          className
        )}
        style={{
          width: sizeValue,
          height: sizeValue,
          background: `linear-gradient(135deg, ${fallbackColor} 0%, ${adjustColor(fallbackColor, -20)} 100%)`,
        }}
        aria-label={alt}
      >
        {initials ? (
          <span
            className="font-semibold text-white"
            style={{ fontSize: sizeValue * 0.4 }}
          >
            {initials}
          </span>
        ) : (
          <User className="text-white" size={sizeValue * 0.5} />
        )}
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src, {
    width: sizeValue * 2, // 2x for retina displays
    height: sizeValue * 2,
    quality: IMAGE_QUALITY.HIGH,
    format: 'webp',
  });

  return (
    <div
      className={cn('relative rounded-full overflow-hidden', className)}
      style={{ width: sizeValue, height: sizeValue }}
    >
      {imageLoading && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          aria-hidden="true"
        />
      )}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={sizeValue}
        height={sizeValue}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL={getBlurDataURL(fallbackColor)}
        className={cn(
          'rounded-full object-cover transition-opacity duration-300',
          imageLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        quality={IMAGE_QUALITY.HIGH}
        unoptimized={false}
      />
    </div>
  );
}

/**
 * Adjust color brightness for gradient
 */
function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

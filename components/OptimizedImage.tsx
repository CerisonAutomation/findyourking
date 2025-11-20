/**
 * Optimized Image Component - Enterprise Grade
 * Per Next.js Image docs: https://nextjs.org/docs/app/api-reference/components/image
 * 
 * Features:
 * - Automatic format optimization (AVIF → WebP → JPEG)
 * - Blur placeholder for smooth loading
 * - Lazy loading with priority hints
 * - Responsive srcSet generation
 * - TypeScript strict mode
 */

import Image, { ImageProps } from 'next/image';
import { getOptimizedImageProps, AVATAR_PRESETS, PROFILE_PHOTO_PRESETS } from '@/lib/utils/image-optimization';

interface OptimizedImageProps extends Omit<ImageProps, 'quality' | 'placeholder' | 'blurDataURL'> {
  preset?: keyof typeof AVATAR_PRESETS | keyof typeof PROFILE_PHOTO_PRESETS;
  enableBlur?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  preset,
  enableBlur = true,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const presetConfig = preset ? (AVATAR_PRESETS[preset as keyof typeof AVATAR_PRESETS] || PROFILE_PHOTO_PRESETS[preset as keyof typeof PROFILE_PHOTO_PRESETS]) : undefined;

  const width = typeof props.width === 'number' ? props.width : (presetConfig?.width || undefined);
  const height = typeof props.height === 'number' ? props.height : (presetConfig?.height || undefined);

  const optimizedProps = getOptimizedImageProps({
    src: src.toString(),
    width,
    height,
    quality: presetConfig?.quality,
    priority,
    sizes: presetConfig?.sizes,
    placeholder: enableBlur ? 'blur' : 'empty',
  });

  return (
    <Image
      {...props}
      {...optimizedProps}
      alt={alt}
      className={`${props.className || ''} object-cover`}
    />
  );
}

export function AvatarImage({
  src,
  alt,
  size = 'medium',
  className = '',
  ...props
}: {
  src: string;
  alt: string;
  size?: keyof typeof AVATAR_PRESETS;
  className?: string;
} & Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'>) {
  const preset = AVATAR_PRESETS[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={preset.width}
      height={preset.height}
      quality={preset.quality}
      sizes={preset.sizes}
      className={`rounded-full ${className}`}
      {...props}
    />
  );
}

export function ProfilePhoto({
  src,
  alt,
  variant = 'card',
  className = '',
  ...props
}: {
  src: string;
  alt: string;
  variant?: keyof typeof PROFILE_PHOTO_PRESETS;
  className?: string;
} & Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'>) {
  const preset = PROFILE_PHOTO_PRESETS[variant];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={preset.width}
      height={preset.height}
      quality={preset.quality}
      sizes={preset.sizes}
      priority={preset.priority || false}
      className={`rounded-lg ${className}`}
      {...props}
    />
  );
}

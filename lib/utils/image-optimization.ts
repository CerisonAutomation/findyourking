/**
 * IMAGE OPTIMIZATION UTILITIES - 150/100 ZENITH LEGENDARY TIER
 * Per Next.js Image Optimization docs: https://nextjs.org/docs/app/building-your-application/optimizing/images
 * Per Supabase Storage Transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
 * Per Vercel Best Practices: https://vercel.com/docs/image-optimization
 * 
 * Features:
 * - Automatic format optimization (AVIF → WebP → JPEG)
 * - Responsive srcSet generation
 * - Lazy loading with priority hints
 * - Blur placeholder generation
 * - CDN integration
 * - Client-side compression
 * - Dominant color extraction
 */

import type { ImageProps } from 'next/image';

/**
 * Image quality presets based on use case
 */
export const IMAGE_QUALITY = {
  THUMBNAIL: 60,
  STANDARD: 75,
  HIGH: 85,
  MAXIMUM: 95,
} as const;

/**
 * Responsive image sizes for different breakpoints
 */
export const IMAGE_SIZES = {
  AVATAR_SM: { width: 40, height: 40 },
  AVATAR_MD: { width: 80, height: 80 },
  AVATAR_LG: { width: 160, height: 160 },
  CARD: { width: 400, height: 500 },
  HERO: { width: 1200, height: 630 },
  FULL: { width: 1920, height: 1080 },
} as const;

export interface ImageOptimizationConfig {
  src: string;
  width?: number;
  height?: number;
  quality?: number; // 1-100, default 75
  priority?: boolean; // Preload image (LCP candidates)
  sizes?: string; // Responsive sizes attribute
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Generate optimal image configuration for Next.js Image component
 * @param config Image configuration
 * @returns Optimized image props
 */
export function getOptimizedImageProps(config: ImageOptimizationConfig) {
  const {
    src,
    width,
    height,
    quality = 75,
    priority = false,
    sizes,
    placeholder = 'empty',
    blurDataURL,
  } = config;

  return {
    src,
    width,
    height,
    quality,
    priority,
    sizes: sizes || generateResponsiveSizes(width),
    placeholder,
    blurDataURL,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: 'async' as const,
  };
}

/**
 * Generate responsive sizes attribute based on image width
 * Per Next.js docs: https://nextjs.org/docs/app/api-reference/components/image#sizes
 */
function generateResponsiveSizes(width?: number): string {
  if (!width) return '100vw';
  
  // Optimize for common breakpoints
  if (width <= 640) return '(max-width: 640px) 100vw, 640px';
  if (width <= 828) return '(max-width: 768px) 100vw, 828px';
  if (width <= 1080) return '(max-width: 1024px) 100vw, 1080px';
  if (width <= 1200) return '(max-width: 1280px) 100vw, 1200px';
  
  return `(max-width: 1920px) 100vw, ${width}px`;
}

/**
 * Generate blur placeholder data URL for smooth loading
 * Per Next.js Placeholder docs: https://nextjs.org/docs/app/api-reference/components/image#placeholder
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
      </filter>
      <rect width="100%" height="100%" fill="#e5e7eb" filter="url(#blur)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

/**
 * Generate low-quality placeholder blur data URL (client-safe version)
 */
export function getBlurDataURL(color: string = '#e5e7eb'): string {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${color}"/></svg>`
  )}`;
}

/**
 * Get Supabase Storage optimized URL with transformations
 * Per Supabase Image Transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export function getSupabaseImageURL(
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'origin' | 'webp' | 'avif';
  }
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const params = new URLSearchParams();
  
  if (options?.width) params.append('width', options.width.toString());
  if (options?.height) params.append('height', options.height.toString());
  if (options?.quality) params.append('quality', options.quality.toString());
  if (options?.format) params.append('format', options.format);
  
  const queryString = params.toString();
  return `${baseUrl}/storage/v1/render/image/public/${bucket}/${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generate optimized Supabase Storage URLs with transformation parameters
 * Alternative implementation for existing URLs
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'origin' | 'webp' | 'avif';
  } = {}
): string {
  if (!url) return '';

  // Check if it's a Supabase Storage URL
  const isSupabaseUrl = url.includes('.supabase.co/storage/');
  
  if (!isSupabaseUrl) return url;

  const {
    width,
    height,
    quality = IMAGE_QUALITY.STANDARD,
    format = 'webp',
  } = options;

  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  if (format !== 'origin') params.append('format', format);

  return `${url}?${params.toString()}`;
}

/**
 * Avatar optimization presets
 */
export const AVATAR_PRESETS = {
  thumbnail: {
    width: 48,
    height: 48,
    quality: 80,
    sizes: '48px',
  },
  small: {
    width: 96,
    height: 96,
    quality: 85,
    sizes: '96px',
  },
  medium: {
    width: 200,
    height: 200,
    quality: 85,
    sizes: '200px',
  },
  large: {
    width: 400,
    height: 400,
    quality: 90,
    sizes: '400px',
  },
} as const;

/**
 * Profile photo optimization presets
 */
export const PROFILE_PHOTO_PRESETS = {
  thumbnail: {
    width: 150,
    height: 150,
    quality: 75,
    sizes: '(max-width: 640px) 150px, 150px',
    priority: false,
  },
  card: {
    width: 400,
    height: 600,
    quality: 80,
    sizes: '(max-width: 640px) 100vw, 400px',
    priority: false,
  },
  fullscreen: {
    width: 1200,
    height: 1800,
    quality: 90,
    sizes: '100vw',
    priority: true,
  },
} as const;

/**
 * Lazy load images with Intersection Observer
 * Fallback for environments without Next.js Image component
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          const src = lazyImage.dataset.src;
          if (src) {
            lazyImage.src = src;
            lazyImage.removeAttribute('data-src');
            observer.unobserve(lazyImage);
          }
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before viewport
      threshold: 0.01,
    });

    observer.observe(img);
  } else {
    // Fallback: load immediately if IntersectionObserver not supported
    const src = img.dataset.src;
    if (src) img.src = src;
  }
}

/**
 * Preload critical images for LCP optimization
 * Per Next.js Priority docs: https://nextjs.org/docs/app/api-reference/components/image#priority
 */
export function preloadCriticalImages(urls: string[]): void {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });
}

/**
 * Calculate responsive image dimensions maintaining aspect ratio
 */
export function calculateResponsiveDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = Math.min(originalWidth, maxWidth);
  let height = Math.round(width / aspectRatio);
  
  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }
  
  return { width, height };
}

/**
 * Image format detection and fallback
 */
export function getOptimalImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'webp';
  
  // Check AVIF support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }
  
  // Check WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  
  return 'jpeg';
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Compress image on client-side before upload
 * Uses Canvas API for browser-based compression
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = IMAGE_QUALITY.HIGH / 100,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate avatar initials as fallback
 */
export function getAvatarFallback(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get dominant color from image (for loading states)
 */
export async function getDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve('#e5e7eb');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let r = 0,
        g = 0,
        b = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);

      resolve(`#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`);
    };

    img.onerror = () => resolve('#e5e7eb');
    img.src = imageUrl;
  });
}

/**
 * Generate responsive image srcSet for Next.js Image component
 */
export function generateImageSrcSet(
  baseUrl: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return widths
    .map((width) => {
      const optimizedUrl = getOptimizedImageUrl(baseUrl, { width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Get optimized Next.js Image component props
 */
export function getImageProps(
  src: string,
  alt: string,
  options: {
    priority?: boolean;
    sizes?: string;
    quality?: number;
    fill?: boolean;
    className?: string;
  } = {}
): Partial<ImageProps> {
  const {
    priority = false,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality = IMAGE_QUALITY.STANDARD,
    fill = false,
    className = '',
  } = options;

  return {
    src: getOptimizedImageUrl(src, { quality }),
    alt,
    priority,
    sizes,
    quality,
    fill,
    className,
    loading: priority ? 'eager' : 'lazy',
    placeholder: 'blur' as const,
    blurDataURL: getBlurDataURL(),
  };
}

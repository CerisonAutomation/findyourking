import type { MetadataRoute } from 'next';

/**
 * Next.js App Router manifest route.
 * Resolves to /manifest.webmanifest — fixes the 401 on Vercel preview deployments.
 * Ensure /public/icon-192.png and /public/icon-512.png exist.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Find Your King',
    short_name: 'FYK',
    description: 'Discover your perfect king.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    categories: ['social', 'lifestyle'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

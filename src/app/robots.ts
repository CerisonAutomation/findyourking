import type { MetadataRoute } from 'next';

/**
 * Generated robots.txt
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://findyourking.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/discover', '/login', '/signup'],
        disallow: ['/admin/', '/api/', '/onboarding', '/profile/', '/messages/', '/bookings/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

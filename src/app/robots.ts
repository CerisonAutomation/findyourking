import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/onboarding'] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fyking.men'}/sitemap.xml`,
  };
}

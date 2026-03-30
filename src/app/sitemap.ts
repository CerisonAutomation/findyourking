import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fyking.men';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE}/discover`,lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/meet-now`,lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${BASE}/login`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/signup`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}

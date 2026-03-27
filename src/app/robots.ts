import type {MetadataRoute} from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findyourking.app'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/_next/',
                    '/private/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
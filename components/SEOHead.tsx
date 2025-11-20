/**
 * SEO Component with Open Graph and Twitter Cards
 * Per Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 * Per Open Graph: https://ogp.me/
 * Per Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
 */

import { Metadata } from 'next';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Generate complete metadata for a page
 * Use in page.tsx or layout.tsx:
 *
 * export const metadata = generateMetadata({
 *   title: 'My Page',
 *   description: 'Page description'
 * });
 */
export function generateMetadata(props: SEOProps): Metadata {
  const {
    title,
    description,
    keywords = [],
    ogImage = '/og-image.png',
    ogType = 'website',
    twitterCard = 'summary_large_image',
    canonicalUrl,
    noindex = false,
    nofollow = false,
    author,
    publishedTime,
    modifiedTime,
  } = props;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findyourking.com';
  const fullTitle = `${title} | FindYourKing`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    creator: 'FindYourKing',
    publisher: 'FindYourKing',

    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    },

    alternates: {
      canonical: canonicalUrl || appUrl,
    },

    openGraph: {
      type: ogType,
      title: fullTitle,
      description,
      url: canonicalUrl || appUrl,
      siteName: 'FindYourKing',
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime,
      modifiedTime,
    },

    twitter: {
      card: twitterCard,
      title: fullTitle,
      description,
      images: [fullOgImage],
      creator: '@findyourking',
      site: '@findyourking',
    },

    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

/**
 * Default metadata for the application
 */
export const defaultMetadata: Metadata = generateMetadata({
  title: 'Find Your Perfect Match',
  description: 'Connect with amazing people. FindYourKing is the premium dating platform for meaningful relationships.',
  keywords: [
    'dating',
    'relationships',
    'online dating',
    'matchmaking',
    'singles',
    'love',
    'romance',
    'dating app',
    'meet people',
    'find love',
  ],
});

/**
 * Metadata for specific pages
 */
export const pagesMetadata = {
  auth: generateMetadata({
    title: 'Sign In',
    description: 'Sign in to FindYourKing to connect with amazing people.',
    noindex: true, // Don't index auth pages
  }),

  signUp: generateMetadata({
    title: 'Create Account',
    description: 'Join FindYourKing today and start your journey to finding love.',
    noindex: true,
  }),

  profile: generateMetadata({
    title: 'Your Profile',
    description: 'Manage your FindYourKing profile and preferences.',
    noindex: true, // User-specific content
  }),

  matches: generateMetadata({
    title: 'Your Matches',
    description: 'Discover and connect with your matches on FindYourKing.',
    noindex: true,
  }),

  chat: generateMetadata({
    title: 'Messages',
    description: 'Chat with your matches on FindYourKing.',
    noindex: true,
  }),

  pricing: generateMetadata({
    title: 'Premium Subscription',
    description: 'Upgrade to FindYourKing Premium for unlimited matches, video calls, and exclusive features.',
    keywords: ['premium', 'subscription', 'pricing', 'membership'],
  }),

  about: generateMetadata({
    title: 'About Us',
    description: 'Learn about FindYourKing and our mission to help people find meaningful relationships.',
    keywords: ['about', 'company', 'mission', 'team'],
  }),

  privacy: generateMetadata({
    title: 'Privacy Policy',
    description: 'Read our privacy policy to understand how we protect your data on FindYourKing.',
    keywords: ['privacy', 'data protection', 'security', 'GDPR'],
  }),

  terms: generateMetadata({
    title: 'Terms of Service',
    description: 'Read the terms of service for using FindYourKing.',
    keywords: ['terms', 'legal', 'conditions', 'agreement'],
  }),
};

/**
 * Generate JSON-LD structured data for SEO
 * Per Google: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */
export function generateStructuredData(type: 'Organization' | 'WebSite' | 'Person', data: any) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findyourking.com';

  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  if (type === 'Organization') {
    return {
      ...baseData,
      name: 'FindYourKing',
      url: appUrl,
      logo: `${appUrl}/logo.png`,
      description: 'Premium dating platform for meaningful relationships',
      sameAs: [
        'https://twitter.com/findyourking',
        'https://facebook.com/findyourking',
        'https://instagram.com/findyourking',
      ],
      ...data,
    };
  }

  if (type === 'WebSite') {
    return {
      ...baseData,
      name: 'FindYourKing',
      url: appUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${appUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
      ...data,
    };
  }

  return { ...baseData, ...data };
}

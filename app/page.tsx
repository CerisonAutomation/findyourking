import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart, Shield, Zap, Users, Star, CheckCircle } from 'lucide-react';

/**
 * HOMEPAGE - LANDING PAGE
 * Per Next.js 15 docs: https://nextjs.org/docs/app/building-your-application/rendering/server-components
 * Server Component for optimal SEO and performance
 */

export const metadata: Metadata = {
  title: 'FindYourKing - Premium Gay Dating & Live Streaming Platform',
  description: 'Connect with amazing gay men through live streaming, meaningful conversations, and authentic connections. Join the premier LGBTQ+ dating community.',
  keywords: ['gay dating', 'LGBTQ+', 'live streaming', 'gay men', 'dating app', 'find love'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FindYourKing - Premium Gay Dating Platform',
    description: 'Connect with amazing gay men through live streaming and authentic connections.',
    type: 'website',
    locale: 'en_US',
    siteName: 'FindYourKing',
    url: '/',
    images: [{
      url: '/fyklogo.png',
      width: 512,
      height: 512,
      alt: 'FindYourKing Logo'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FindYourKing - Premium Gay Dating',
    description: 'Connect with amazing gay men worldwide',
    images: ['/fyklogo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function HomePage() {
  // Server-side auth check with error handling
  let user = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Auth check error:', error.message);
    } else {
      user = data?.user;
    }
  } catch (error) {
    console.error('Failed to check auth:', error);
  }

  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://findyourking.com/#organization',
        name: 'FindYourKing',
        url: 'https://findyourking.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://findyourking.com/fyklogo.png',
          width: 512,
          height: 512
        },
        description: 'Premium gay dating and live streaming platform connecting amazing gay men worldwide',
        foundingDate: '2024',
        slogan: 'Find Your Perfect King'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://findyourking.com/#website',
        url: 'https://findyourking.com',
        name: 'FindYourKing',
        publisher: { '@id': 'https://findyourking.com/#organization' },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://findyourking.com/matches?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'WebPage',
        '@id': 'https://findyourking.com/#webpage',
        url: 'https://findyourking.com',
        name: 'FindYourKing - Premium Gay Dating & Live Streaming Platform',
        isPartOf: { '@id': 'https://findyourking.com/#website' },
        about: { '@id': 'https://findyourking.com/#organization' },
        description: 'Connect with amazing gay men through live streaming, meaningful conversations, and authentic connections. Join the premier LGBTQ+ dating community.',
        inLanguage: 'en-US',
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: 'https://findyourking.com/fyklogo.png',
          width: 512,
          height: 512
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Skip Navigation Link */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-slate-800 focus:text-black dark:focus:text-white focus:rounded focus:outline-2 focus:outline-pink-500"
      >
        Skip to main content
      </a>
      
        {/* Hero Section */}
      <main id="main-content" className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-6 py-20 lg:py-32 min-h-[500px] lg:min-h-[600px] relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Find Your Perfect{' '}
              <span className="block bg-linear-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                King
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-200 mb-12 leading-relaxed">
              Connect with amazing gay men through live streaming, meaningful
              conversations, and authentic connections.
            </p>

            {/* CTA Buttons */}
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/matches"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 text-white text-lg font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  aria-label="Start discovering matches"
                >
                  Start Discovering
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-pink-500 text-pink-500 dark:text-pink-400 text-lg font-semibold rounded-full hover:bg-pink-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 transition-all duration-300"
                  aria-label="View your profile"
                >
                  View Profile
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 text-white text-lg font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  aria-label="Get started - Sign up now"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-pink-500 text-pink-500 dark:text-pink-400 text-lg font-semibold rounded-full hover:bg-pink-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 transition-all duration-300"
                  aria-label="Learn more about FindYourKing"
                >
                  Learn More
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <section 
          className="container mx-auto px-6 py-16"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading" className="sr-only">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <article className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center" role="img" aria-label="Heart icon">
                <Heart className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Authentic Connections
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Meet genuine people looking for real relationships
              </p>
            </article>

            {/* Feature 2 */}
            <article className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center" role="img" aria-label="Shield icon">
                <Shield className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Safe & Secure
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Enterprise-grade security with verified profiles
              </p>
            </article>

            {/* Feature 3 */}
            <article className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center" role="img" aria-label="Lightning icon">
                <Zap className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Instant Matching
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                AI-powered algorithm finds your perfect match
              </p>
            </article>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-white dark:bg-slate-800 py-16" aria-labelledby="testimonials-heading" suppressHydrationWarning>
          <div className="container mx-auto px-6">
            <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
              What Our Members Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto" role="list">
              <article className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg" role="listitem">
                <div className="flex items-center mb-4" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 mb-4">
                  "FindYourKing helped me find my perfect match. The live streaming feature made it so easy to connect authentically."
                </blockquote>
                <cite className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Alex M., New York
                </cite>
              </article>

              <article className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg" role="listitem">
                <div className="flex items-center mb-4" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 mb-4">
                  "The AI matching algorithm is incredible. I've never felt so understood by a dating platform."
                </blockquote>
                <cite className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Jordan K., Los Angeles
                </cite>
              </article>

              <article className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg" role="listitem">
                <div className="flex items-center mb-4" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 mb-4">
                  "Safe, secure, and genuinely focused on real connections. Finally, a dating app that gets it right."
                </blockquote>
                <cite className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Taylor R., Chicago
                </cite>
              </article>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-16" aria-labelledby="pricing-heading">
          <div className="container mx-auto px-6">
            <h2 id="pricing-heading" className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Choose Your Plan
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" role="list">
              <article className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center" role="listitem" aria-labelledby="free-plan-heading">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Free</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0</div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Perfect for getting started</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">Create profile</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">Browse profiles</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">Basic matching</span>
                  </li>
                </ul>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-pink-500 text-pink-500 dark:text-pink-400 font-semibold rounded-full hover:bg-pink-500 hover:text-white transition-all duration-300"
                  aria-label="Get started with free plan"
                >
                  Get Started
                </Link>
              </article>

              <article className="bg-linear-to-br from-pink-500 to-purple-600 text-white rounded-lg p-8 text-center relative" role="listitem" aria-labelledby="premium-plan-heading">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold" aria-label="Most popular plan">
                  Most Popular
                </div>
                <h3 id="premium-plan-heading" className="text-2xl font-bold mb-4">Premium</h3>
                <div className="text-4xl font-bold mb-2">$9.99<span className="text-lg">/month</span></div>
                <p className="text-pink-100 mb-6">Unlock all features</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
                    <span>Unlimited messaging</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
                    <span>Live streaming</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
                    <span>Advanced filters</span>
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-pink-600 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300"
                  aria-label="Upgrade to premium plan"
                >
                  Upgrade Now
                </Link>
              </article>

              <article className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center" role="listitem" aria-labelledby="vip-plan-heading">
                <h3 id="vip-plan-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">VIP</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$19.99<span className="text-lg">/month</span></div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Maximum visibility</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">Everything in Premium</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">Priority matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">Profile boost</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">VIP support</span>
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-purple-500 text-purple-500 dark:text-purple-400 font-semibold rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300"
                  aria-label="Upgrade to VIP plan"
                >
                  Go VIP
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 dark:bg-slate-900 py-16" aria-labelledby="faq-heading">
          <div className="container mx-auto px-6">
            <h2 id="faq-heading" className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <details className="bg-white dark:bg-slate-800 rounded-lg p-6">
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                  Is FindYourKing safe and secure?
                </summary>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  Yes, we prioritize safety with enterprise-grade security, profile verification, and strict community guidelines. All personal information is encrypted and never shared.
                </p>
              </details>

              <details className="bg-white dark:bg-slate-800 rounded-lg p-6">
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                  How does the AI matching work?
                </summary>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  Our AI analyzes your preferences, behavior, and profile data to find compatible matches. It learns from your interactions to improve recommendations over time.
                </p>
              </details>

              <details className="bg-white dark:bg-slate-800 rounded-lg p-6">
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                  Can I use FindYourKing on mobile?
                </summary>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  Yes! FindYourKing is fully responsive and works perfectly on all devices. We're also developing native mobile apps for iOS and Android.
                </p>
              </details>

              <details className="bg-white dark:bg-slate-800 rounded-lg p-6">
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                  What makes FindYourKing different from other dating apps?
                </summary>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  Unlike other apps, we focus exclusively on the LGBTQ+ community with live streaming, AI-powered matching, and a commitment to authentic connections over superficial swiping.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="container mx-auto px-6 py-12" aria-label="Community statistics">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 mb-8">
              <Users className="w-5 h-5" aria-hidden="true" />
              <p className="text-lg">
                Join <span className="font-bold text-pink-500">10,000+</span> members worldwide
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" aria-hidden="true" />
                <span>4.8/5 App Store</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" aria-hidden="true" />
                <span>4.9/5 Google Play</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-linear-to-r from-pink-500 to-purple-600 py-16">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Find Your Perfect King?
            </h2>
            <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
              Join thousands of gay men who have found meaningful connections on FindYourKing.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-pink-600 text-lg font-semibold rounded-full hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              aria-label="Join FindYourKing now"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

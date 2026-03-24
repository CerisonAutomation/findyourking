import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';

// ─── Font — subset + display swap for CLS=0 ─────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

// ─── Root Metadata ───────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://findyourking.app'
  ),
  title: {
    default: 'FindYourKing — Gay Dating & Meet-Now',
    template: '%s | FindYourKing',
  },
  description:
    'The premier gay dating, meet-now and booking platform. Discover, connect and book now.',
  keywords: ['gay dating', 'meet now', 'gay app', 'LGBTQ+', 'booking'],
  authors: [{ name: 'FindYourKing', url: 'https://findyourking.app' }],
  creator: 'FindYourKing',
  publisher: 'FindYourKing',
  manifest: '/manifest.json',
  // ─── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://findyourking.app',
    siteName: 'FindYourKing',
    title: 'FindYourKing — Gay Dating & Meet-Now',
    description:
      'The premier gay dating, meet-now and booking platform.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'FindYourKing' }],
  },
  // ─── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'FindYourKing',
    description: 'The premier gay dating, meet-now & booking platform.',
    images: ['/og-image.png'],
  },
  // ─── PWA / Apple ───────────────────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FyKing Men',
  },
  // ─── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${
          inter.variable
        } font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";

/**
 * Font optimization using system fonts for maximum reliability
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
 * Using Tailwind's default font stack for production reliability
 */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "FindYourKing - Find Your Perfect Match",
    template: "%s | FindYourKing"
  },
  description: "Connect with like-minded people through live streaming, meaningful conversations, and authentic connections on FindYourKing.",
  keywords: ["dating", "matches", "connections", "live streaming", "relationships"],
  authors: [{ name: "FindYourKing Team" }],
  creator: "FindYourKing",
  publisher: "FindYourKing",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "FindYourKing - Find Your Perfect Match",
    description: "Connect with like-minded people through live streaming, meaningful conversations, and authentic connections.",
    siteName: "FindYourKing",
    images: [{
      url: "/fyklogo.png",
      width: 512,
      height: 512,
      alt: "FindYourKing"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "FindYourKing - Find Your Perfect Match",
    description: "Connect with like-minded people through live streaming and authentic connections.",
    images: ["/fyklogo.png"],
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FindYourKing',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 2,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* DNS Prefetch & Preconnect for Performance */}
        <link rel="preconnect" href="https://imljzgcuelzzzncfzlnc.supabase.co" />
        <link rel="dns-prefetch" href="https://imljzgcuelzzzncfzlnc.supabase.co" />
      </head>
      <body
        className="font-sans antialiased h-full"
        data-scroll-behavior="smooth"
      >
        <ErrorBoundary>
          <AuthProvider>
            <div className="h-full flex flex-col">
              <Navbar />
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Find Your King',
    template: '%s | Find Your King',
  },
  description:
    'The premium LGBTQ+ dating platform. Find meaningful connections, plan dates, and meet your king.',
  keywords: ['LGBTQ dating', 'gay dating', 'find your king', 'queer dating app'],
  authors: [{ name: 'Find Your King' }],
  creator: 'Find Your King',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://findyourking.vercel.app',
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Find Your King',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@findyourking',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

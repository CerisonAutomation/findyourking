import type {Metadata, Viewport} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import {ThemeProvider} from '@/components/providers/theme-provider'
import {QueryProvider} from '@/components/providers/query-provider'
import {Toaster} from '@/components/ui/toaster'
import {AuthProvider} from '@/lib/auth/use-auth'
import {MasculineThemeProvider} from '@/components/ui/masculine-theme'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: {
        default: 'Find Your King',
        template: '%s | Find Your King'
    },
    description: 'Premium dating platform with AI matching, real-time events, and meaningful connections',
    keywords: ['dating', 'relationships', 'AI matching', 'events', 'social', 'love'],
    authors: [{name: 'Find Your King Team'}],
    creator: 'Find Your King',
    publisher: 'Find Your King',
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://findyourking.app',
        siteName: 'Find Your King',
        title: 'Find Your King - Premium Dating Platform',
        description: 'Premium dating platform with AI matching, real-time events, and meaningful connections',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Find Your King - Premium Dating Platform',
        description: 'Premium dating platform with AI matching, real-time events, and meaningful connections',
    },
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
        <body className={`${inter.className} bg-black text-cyan-400`}>
        <MasculineThemeProvider>
            <AuthProvider>
                <ThemeProvider>
                    <QueryProvider>
                        {children}
                        <Toaster/>
                    </QueryProvider>
                </ThemeProvider>
            </AuthProvider>
        </MasculineThemeProvider>
        </body>
        </html>
    )
}

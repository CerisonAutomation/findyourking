import type {Metadata} from 'next'
import dynamic from 'next/dynamic'

const DiscoverPageClient = dynamic(() => import('./discover-client').then(mod => ({default: mod.DiscoverPageClient})), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen bg-king-bg">
            <div className="text-center">
                <div className="animate-spin-slow rounded-full h-12 w-12 border-b-2 border-king-cobalt mx-auto mb-4"></div>
                <p className="text-king-muted">Loading...</p>
            </div>
        </div>
    )
})

export const metadata: Metadata = {
    title: 'Discover Profiles | Find Your King',
    description: 'Find your perfect match with AI-powered matching. Browse profiles, filter by interests, and connect with people near you.',
    openGraph: {
        title: 'Discover Profiles | Find Your King',
        description: 'Find your perfect match with AI-powered matching.',
        images: ['/og-discover.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Discover Profiles | Find Your King',
        description: 'Find your perfect match with AI-powered matching.',
    },
}

export default function DiscoverPage() {
    return <DiscoverPageClient />
}
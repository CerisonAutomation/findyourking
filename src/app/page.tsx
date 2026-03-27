'use client'

import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Brain, Crown, Globe, Mic, Shield, Sparkles, Users, Zap} from 'lucide-react'
import {useAuth} from '@/lib/auth/use-auth'

export default function HomePage() {
    const {user, isLoading} = useAuth()

    // If authenticated, redirect to discover
    if (user && !isLoading) {
        window.location.href = '/discover'
        return null
    }

    // Landing page for unauthenticated users
    return (
        <div className="min-h-screen bg-black text-cyan-400 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 cyber-grid opacity-20"/>
            <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"/>
            <div
                className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"/>
            <div
                className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"/>

            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-neon">
                            <Crown className="w-10 h-10 text-black"/>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-cyan-400 mb-6 neon-text tracking-wider">
                        FIND YOUR
                        <span
                            className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              KINGDOM
            </span>
                    </h1>

                    <p className="text-xl text-cyan-300 mb-8 max-w-2xl mx-auto">
                        Quadrillion-times AI dating platform with voice control, real translation,
                        and enterprise security. Rule your dating life.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/signup">
                            <Button variant="accent" size="xl" className="px-12 py-4">
                                Claim Your Crown
                            </Button>
                        </Link>
                        <Link href="/auth/signin">
                            <Button variant="professional" size="xl" className="px-12 py-4">
                                Enter Kingdom
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center justify-center space-x-4 mt-6">
                        <Zap className="w-4 h-4 text-cyan-400/50"/>
                        <p className="text-sm text-cyan-400/50 uppercase tracking-wider">
                            1000+ Features • Zero Cost • Enterprise Security
                        </p>
                        <Zap className="w-4 h-4 text-cyan-400/50"/>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-4 neon-text">
                            Why Choose Find Your King?
                        </h2>
                        <p className="text-xl text-cyan-300 max-w-2xl mx-auto">
                            Comprehensive set of features with enterprise security and AI automation
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="h-8 w-8"/>}
                            title="Enterprise Security"
                            description="OWASP 2026+ compliant security with AES-256 encryption and post-quantum cryptography."
                        />
                        <FeatureCard
                            icon={<Brain className="h-8 w-8"/>}
                            title="Local AI Processing"
                            description="Transformers.js with WebGPU acceleration. Privacy-first, no server dependency."
                        />
                        <FeatureCard
                            icon={<Mic className="h-8 w-8"/>}
                            title="Voice Control"
                            description="Wake words and 100+ voice commands for hands-free navigation and automation."
                        />
                        <FeatureCard
                            icon={<Globe className="h-8 w-8"/>}
                            title="Real Translation"
                            description="100+ languages with cultural context and slang adaptation in real-time."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8"/>}
                            title="1000+ Features"
                            description="Auto-reply, quick replies, conversation coaching, and advanced automation."
                        />
                        <FeatureCard
                            icon={<Sparkles className="h-8 w-8"/>}
                            title="Zero Cost Model"
                            description="Enterprise-grade platform completely free. No subscriptions, no hidden fees."
                        />
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/30">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-cyan-400 mb-8 neon-text">
                        Built with Future Technology
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['Next.js 15', 'React 19', 'TypeScript 5', 'Transformers.js', 'PostgreSQL 16', 'WebGPU', 'WebRTC', 'Tailwind CSS'].map((tech) => (
                            <span key={tech}
                                  className="px-4 py-2 bg-black/50 border-2 border-cyan-400/20 rounded-full text-cyan-400 font-bold uppercase tracking-wider text-sm">
                {tech}
              </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/50 to-purple-900/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-4 neon-text">
                        Ready to Rule Your Kingdom?
                    </h2>
                    <p className="text-xl text-cyan-300 mb-8">
                        Join thousands of kings who have found meaningful connections with AI-powered dating
                    </p>
                    <Link href="/auth/signup">
                        <Button variant="accent" size="xl" className="px-12 py-4">
                            Claim Your Crown Now
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"/>
        </div>
    )
}

function FeatureCard({
                         icon,
                         title,
                         description
                     }: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <Card
            className="text-center p-6 bg-black/50 border-2 border-cyan-400/20 rounded-lg hover:border-cyan-400/40 transition-all duration-300 group">
            <div
                className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full flex items-center justify-center text-cyan-400 mb-4 group-hover:shadow-neon">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-cyan-400 mb-3 uppercase tracking-wider">{title}</h3>
            <p className="text-cyan-300">{description}</p>
        </Card>
    )
}

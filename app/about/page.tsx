import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Heart,
  Shield,
  Sparkles,
  Users,
  Crown,
  MessageCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | FindYourKing',
  description:
    'Learn about FindYourKing - the premium dating platform connecting seekers with providers.',
};

export default function AboutPage() {
  const features = [
    {
      icon: Heart,
      title: 'Authentic Connections',
      description:
        'We verify all providers to ensure genuine, safe connections',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Bank-level encryption and Row Level Security protect your data',
    },
    {
      icon: Sparkles,
      title: 'AI Boyfriend',
      description: 'Chat with your personalized AI boyfriend anytime, anywhere',
    },
    {
      icon: Users,
      title: 'Dual Roles',
      description:
        'Be a seeker finding companionship or a provider offering experiences',
    },
    {
      icon: Crown,
      title: 'King Tier',
      description:
        'Premium features including unlimited likes, profile boost, and priority support',
    },
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description:
        'Stream-powered messaging and video calls for seamless communication',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <Crown className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-200">
            About FindYourKing
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            The next-generation dating platform combining human connections with
            AI companionship
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            FindYourKing was created to revolutionize online dating by providing
            a safe, premium platform where seekers can find meaningful
            connections with verified providers, while also offering an
            innovative AI boyfriend feature for companionship anytime.
          </p>
          <p className="text-gray-300 leading-relaxed">
            We believe that everyone deserves genuine connections, whether with
            real people or AI companions. Our platform combines cutting-edge
            technology with human-centered design to create the best dating
            experience possible.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            What Makes Us Different
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-linear-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Built With Enterprise Technology
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">
                Frontend
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>Next.js 15 (App Router)</li>
                <li>React 19</li>
                <li>TypeScript 5.9 (Strict Mode)</li>
                <li>Tailwind CSS 4</li>
                <li>Radix UI Components</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">
                Backend
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>Supabase (PostgreSQL)</li>
                <li>Row Level Security (RLS)</li>
                <li>Google Gemini AI 2.0</li>
                <li>Stream Chat & Video</li>
                <li>Stripe Payments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
            <p className="text-4xl font-black text-purple-400 mb-2">99.9%</p>
            <p className="text-gray-400">Uptime SLA</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
            <p className="text-4xl font-black text-purple-400 mb-2">&lt;50ms</p>
            <p className="text-gray-400">API Response</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
            <p className="text-4xl font-black text-purple-400 mb-2">A+</p>
            <p className="text-gray-400">Security Grade</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your King?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join thousands of users who have found meaningful connections on our
            platform
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm text-gray-400">
          <Link
            href="/terms"
            className="hover:text-purple-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="hover:text-purple-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="hover:text-purple-400 transition-colors"
          >
            Contact Us
          </Link>
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

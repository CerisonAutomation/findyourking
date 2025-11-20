import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdvancedAuthForm from '@/components/auth/AdvancedAuthForm';
import Link from 'next/link';
import { Sparkles, Shield, Heart } from 'lucide-react';

/**
 * AUTHENTICATION PAGE - 150/100 LEGENDARY TIER
 * Per Next.js 15: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 * Per Supabase Auth: https://supabase.com/docs/guides/auth/server-side/nextjs
 * Per WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
 * Per OWASP Auth: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */

export const metadata: Metadata = {
  title: 'Sign In | FindYourKing - Premium Gay Dating Platform',
  description: 'Sign in to FindYourKing to connect with amazing gay men worldwide. Secure authentication with magic link or password.',
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
};

export default async function AuthPage() {
  // Server-side auth check - redirect if already authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden relative">
      {/* Animated Background - GPU Accelerated */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-black to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-linear-to-br from-purple-700/20 to-pink-600/20 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-linear-to-br from-pink-600/20 to-purple-700/20 rounded-full blur-3xl opacity-40 animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              {/* Logo & Headline */}
              <div>
                <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  FindYourKing
                </h1>
                <p className="text-xl text-gray-400">
                  Premium gay dating & live streaming platform
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-linear-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Authentic Connections</h2>
                    <p className="text-gray-400 text-sm">
                      Meet genuine people looking for real relationships
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Safe & Secure</h2>
                    <p className="text-gray-400 text-sm">
                      Enterprise-grade security with end-to-end encryption
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-1">AI-Powered Matching</h2>
                    <p className="text-gray-400 text-sm">
                      Smart algorithm finds your perfect match
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="pt-8 border-t border-white/10">
                <p className="text-gray-400 text-sm">
                  Trusted by <span className="text-pink-500 font-bold">10,000+</span> members worldwide
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="relative">
            {/* Glassmorphism Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8 lg:hidden">
                <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  FindYourKing
                </h1>
                <p className="text-gray-400 text-sm">Premium gay dating platform</p>
              </div>

              <AdvancedAuthForm />

              {/* Footer Links */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-2">
                <p className="text-sm text-gray-400">
                  By signing in, you agree to our{' '}
                  <Link href="/terms" className="text-pink-500 hover:text-pink-400 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-pink-500 hover:text-pink-400 transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-600/10 rounded-full blur-2xl opacity-20 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-2xl opacity-20 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </main>
    </div>
  );
}

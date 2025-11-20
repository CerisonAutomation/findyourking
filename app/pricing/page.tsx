'use client';

import { useState, useEffect } from 'react';
import { PricingCard } from '@/components/PricingCard';
import { TIER_FEATURES } from '@/lib/stripe';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            <span className="bg-linear-to-r from-pink-400 to-amber-400 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Upgrade your experience with premium features designed to help you find your perfect match
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <PricingCard
            tier="free"
            name={TIER_FEATURES.free.name}
            price={TIER_FEATURES.free.price}
            features={[...TIER_FEATURES.free.features]}
          />
          
          <PricingCard
            tier="bronze"
            name={TIER_FEATURES.bronze.name}
            price={TIER_FEATURES.bronze.price}
            features={[...TIER_FEATURES.bronze.features]}
          />
          
          <PricingCard
            tier="silver"
            name={TIER_FEATURES.silver.name}
            price={TIER_FEATURES.silver.price}
            features={[...TIER_FEATURES.silver.features]}
            popular={true}
          />
          
          <PricingCard
            tier="gold"
            name={TIER_FEATURES.gold.name}
            price={TIER_FEATURES.gold.price}
            features={[...TIER_FEATURES.gold.features]}
            premium={true}
          />
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span className="text-gray-300 text-sm">
              Secure payment processing powered by Stripe. Cancel anytime.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
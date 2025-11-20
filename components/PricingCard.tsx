'use client';

import { useState } from 'react';

interface PricingCardProps {
  tier: 'free' | 'bronze' | 'silver' | 'gold';
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  premium?: boolean;
}

export function PricingCard({ tier, name, price, features, popular, premium }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (tier === 'free') {
      // Handle free tier selection
      window.location.href = '/dashboard';
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
      popular 
        ? 'border-amber-500 bg-linear-to-br from-amber-500/10 to-pink-500/10 shadow-lg shadow-amber-500/20' 
        : premium
        ? 'border-yellow-500 bg-linear-to-br from-yellow-500/10 to-amber-500/10 shadow-lg shadow-yellow-500/20'
        : 'border-gray-700 bg-white/5 hover:border-pink-500'
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">
          MOST POPULAR
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className={`text-xl font-bold mb-2 ${
          premium ? 'text-yellow-400' : popular ? 'text-amber-400' : 'text-white'
        }`}>
          {name}
        </h3>
        <p className="text-3xl font-black bg-linear-to-r from-pink-400 to-amber-400 bg-clip-text text-transparent">
          {price}
          <span className="text-sm font-normal text-gray-400">/month</span>
        </p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
          tier === 'free'
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : popular
            ? 'bg-linear-to-r from-amber-500 to-pink-500 text-white hover:shadow-lg hover:shadow-amber-500/50'
            : premium
            ? 'bg-linear-to-r from-yellow-500 to-amber-500 text-white hover:shadow-lg hover:shadow-yellow-500/50'
            : 'bg-linear-to-r from-pink-500 to-red-500 text-white hover:shadow-lg hover:shadow-pink-500/50'
        } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : tier === 'free' ? (
          'Continue with Free'
        ) : (
          `Choose ${name}`
        )}
      </button>
    </div>
  );
}
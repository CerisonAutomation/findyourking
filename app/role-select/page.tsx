'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/lib/actions/profile';
import { Crown, Search, Briefcase, Shield } from 'lucide-react';

export default function RoleSelectPage() {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleSelect(role: 'seeker' | 'provider' | 'admin') {
    setSelecting(true);
    setError(null);
    try {
      await updateUserProfile({ user_role: role });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
      setSelecting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-3xl w-full mx-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to FindYourKing
          </h1>
          <p className="text-gray-300 text-lg">
            Choose how you want to use our platform
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          {/* Seeker Card */}
          <button
            onClick={() => handleRoleSelect('seeker')}
            disabled={selecting}
            className="group p-8 bg-linear-to-br from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 rounded-xl border border-pink-500/30 hover:border-pink-500/60 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-center mb-4">
              <Search size={40} className="text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Seeker</h2>
            <p className="text-gray-300 mb-6">
              Find and book amazing providers for experiences
            </p>
            <ul className="text-sm text-gray-400 space-y-2 text-left">
              <li>✓ Browse provider profiles</li>
              <li>✓ Book appointments</li>
              <li>✓ Rate and review</li>
              <li>✓ Direct messaging</li>
            </ul>
          </button>

          {/* Provider Card */}
          <button
            onClick={() => handleRoleSelect('provider')}
            disabled={selecting}
            className="group p-8 bg-linear-to-br from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-center mb-4">
              <Briefcase size={40} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Provider</h2>
            <p className="text-gray-300 mb-6">
              Offer your services and grow your business
            </p>
            <ul className="text-sm text-gray-400 space-y-2 text-left">
              <li>✓ Manage your availability</li>
              <li>✓ Set your rates</li>
              <li>✓ Accept/decline bookings</li>
              <li>✓ Track earnings</li>
            </ul>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => handleRoleSelect('admin')}
            disabled={selecting}
            className="group p-8 bg-linear-to-br from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-center mb-4">
              <Shield size={40} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Admin</h2>
            <p className="text-gray-300 mb-6">
              Manage the platform and users
            </p>
            <ul className="text-sm text-gray-400 space-y-2 text-left">
              <li>✓ User management</li>
              <li>✓ Verify providers</li>
              <li>✓ View analytics</li>
              <li>✓ Platform settings</li>
            </ul>
          </button>

          {/* Provider Card */}
          <button
            onClick={() => handleRoleSelect('provider')}
            disabled={selecting}
            className="group p-8 bg-linear-to-br from-amber-500/30 to-pink-500/30 hover:from-amber-500/50 hover:to-pink-500/50 rounded-xl border border-amber-500/50 hover:border-yellow-400/80 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-400/10 to-pink-400/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <Crown size={40} className="text-amber-400 drop-shadow-lg" />
              </div>
              <h2 className="text-2xl font-bold text-amber-300 mb-1">King</h2>
              <p className="text-yellow-200 text-xs font-semibold mb-3">
                🌟 PREMIUM ELITE 🌟
              </p>
              <p className="text-gray-200 mb-4">
                Get exclusive access to legendary features
              </p>
              <ul className="text-xs text-gray-300 space-y-1 text-left font-medium">
                <li>✓ Unlimited Likes & Super Likes</li>
                <li>✓ Profile Spotlight Featured</li>
                <li>✓ Video Verification Badge</li>
                <li>✓ Instant Chat Priority</li>
              </ul>
            </div>
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-12">
          You can change your role later in settings
        </p>
      </div>
    </div>
  );
}

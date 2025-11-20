'use client';

import { useRouter } from 'next/navigation';

export default function KingDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            King Dashboard 👑
          </h1>
          <p className="text-gray-400">
            Ultimate platform control and premium features
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button 
            onClick={() => router.push('/boyfriend')}
            className="p-6 rounded-lg bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105 text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-amber-300 mb-2">AI Boyfriend</h3>
            <p className="text-amber-200">Access your personal AI companion</p>
            <span className="inline-block mt-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              Premium
            </span>
          </button>

          <div className="p-6 rounded-lg bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-xl">💎</span>
            </div>
            <h3 className="text-xl font-bold text-amber-300 mb-2">VIP Support</h3>
            <p className="text-amber-200">Priority customer support</p>
            <span className="inline-block mt-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              Premium
            </span>
          </div>

          <div className="p-6 rounded-lg bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-xl">📈</span>
            </div>
            <h3 className="text-xl font-bold text-amber-300 mb-2">Advanced Analytics</h3>
            <p className="text-amber-200">Detailed insights and reports</p>
            <span className="inline-block mt-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              Premium
            </span>
          </div>

          <div className="p-6 rounded-lg bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-amber-300 mb-2">Priority Matching</h3>
            <p className="text-amber-200">Get matched faster</p>
            <span className="inline-block mt-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              Premium
            </span>
          </div>

          <div className="p-6 rounded-lg bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-xl">🔓</span>
            </div>
            <h3 className="text-xl font-bold text-amber-300 mb-2">Unlimited Features</h3>
            <p className="text-amber-200">Access all platform features</p>
            <span className="inline-block mt-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              Premium
            </span>
          </div>

          <div className="p-6 rounded-lg bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-xl">👑</span>
            </div>
            <h3 className="text-xl font-bold text-amber-300 mb-2">King Perks</h3>
            <p className="text-amber-200">Exclusive benefits and features</p>
            <span className="inline-block mt-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              King
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
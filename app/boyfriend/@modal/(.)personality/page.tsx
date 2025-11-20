'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function PersonalityModal() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-white/10">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Choose Your Boyfriend</h2>
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <iframe
            src="/boyfriend/personality"
            className="w-full h-[70vh] border-0"
            title="Choose Boyfriend"
          />
        </div>
      </div>
    </div>
  );
}

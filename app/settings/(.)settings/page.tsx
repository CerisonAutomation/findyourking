'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import SettingsPage from '../page';

export default function SettingsModal() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto bg-slate-900 rounded-lg border border-slate-700">
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <SettingsPage />
        </div>
      </div>
    </div>
  );
}
'use client';

/**
 * CHAT HEADER - USER INFO AND ACTIONS
 */

import Image from 'next/image';
import { Video, Phone, MoreVertical, ArrowLeft } from 'lucide-react';
import type { ChatUser } from '../types';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  user: ChatUser;
}

export function ChatHeader({ user }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          <Image
            src={user.avatar_url || '/default-avatar.png'}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          {user.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
          )}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {user.is_online ? 'Online' : user.last_seen ? `Last seen ${new Date(user.last_seen).toLocaleTimeString()}` : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

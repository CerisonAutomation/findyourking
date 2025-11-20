"use client";

import { UserProfile } from "@/app/profile/page";
import { calculateAge } from "@/lib/helpers";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ChatHeaderProps {
  user: UserProfile;
  isOnline?: boolean;
}
export default function ChatHeader({ user, isOnline = false }: ChatHeaderProps) {
  const router = useRouter();
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Go back to chat list"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={user.avatar_url || '/default-avatar.png'}
                alt={`${user.full_name}'s profile picture`}
                width={48}
                height={48}
                className="object-cover"
                priority
              />
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
                aria-label={isOnline ? "Online" : "Offline"}
                role="status"
              ></div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.full_name}, {user.birthdate ? calculateAge(user.birthdate) : 'Age unknown'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

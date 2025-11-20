import { UserProfile } from "@/app/profile/page";
import { calculateAge } from "@/lib/helpers";
import Image from "next/image";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";

export default function MatchCard({ user }: { user: UserProfile }) {
  const avatarUrl = user.avatar_url?.trim() || DEFAULT_AVATAR;
  const fullName = user?.full_name || "Unknown";
  const bio = user?.bio || "";
  const username = user?.username || "";
  const birthdate = user?.birthdate || new Date().toISOString();

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="card-swipe aspect-[3/4] overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={avatarUrl}
            alt={`${fullName}'s profile`}
            fill
            className={`object-cover transition-opacity duration-300`}
            priority
            loading="lazy"
          />

          <div className="gradient-overlay" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {fullName}, {calculateAge(birthdate)}
                </h2>
                {username && <p className="text-sm opacity-90 mb-2">@{username}</p>}
                {bio && <p className="text-sm leading-relaxed line-clamp-2">{bio}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

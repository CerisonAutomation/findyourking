'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MapPin, Crown } from 'lucide-react';
import { useOptimistic, useTransition, memo } from 'react';
import { toast } from 'sonner';

import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
import { toggleFavorite } from '@/lib/actions/favorites';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  user: UserProfile;
  matchScore?: number;
  isOnline?: boolean;
  distanceMiles?: number;
  isFavorite?: boolean;
  onFavoriteChange?: (userId: string, isFav: boolean) => void;
}

/**
 * Premium profile card with optimistic favorite toggle (Server Action),
 * inline message CTA, match score badge, online pulse, and distance label.
 * Fully keyboard + screen-reader accessible.
 */
export const ProfileCard = memo(function ProfileCard({
  user: profileUser,
  matchScore,
  isOnline,
  distanceMiles,
  isFavorite: initialFavorite = false,
  onFavoriteChange,
}: ProfileCardProps) {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFav, setOptimisticFav] = useOptimistic(initialFavorite);

  const profileId = (profileUser as UserProfile & { userId?: string }).userId
    ?? (profileUser as UserProfile & { user_id?: string }).user_id;
  const displayName = (profileUser as UserProfile & { displayName?: string }).displayName
    ?? (profileUser as UserProfile & { id?: string }).id
    ?? 'King';
  const avatarSrc = (profileUser as UserProfile & { avatarUrl?: string }).avatarUrl
    ?? `https://picsum.photos/seed/${profileId}/600/800`;
  const age = profileUser.age;
  const isSelf = currentUser?.id === profileId;

  function handleMessage(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || isSelf || !profileId) return;
    router.push(`/messages/${profileId}`);
  }

  function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || isSelf || !profileId) return;

    startTransition(async () => {
      const nextFav = !optimisticFav;
      setOptimisticFav(nextFav);
      const result = await toggleFavorite(profileId);
      if ('error' in result) {
        toast.error('Could not update favorites', { description: result.error });
        setOptimisticFav(optimisticFav); // rollback
      } else {
        toast.success(result.favorited ? '❤️ Added to favorites' : 'Removed from favorites');
        onFavoriteChange?.(profileId, result.favorited);
      }
    });
  }

  if (!profileId) return null;

  return (
    <Link
      href={`/profile/${profileId}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      aria-label={`View ${displayName}'s profile`}
    >
      <Card className="overflow-hidden h-full border-0 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4]">
            {/* Profile image */}
            <Image
              src={avatarSrc}
              alt={`${displayName}, ${age ? age + ' years old' : ''}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
            />

            {/* Match score badge */}
            {matchScore !== undefined && (
              <div
                className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold py-1 px-2 rounded-full"
                aria-label={`${matchScore}% match`}
              >
                <Crown className="size-3 text-yellow-400" aria-hidden="true" />
                {matchScore}%
              </div>
            )}

            {/* Gradient overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
              aria-hidden="true"
            />

            {/* Action buttons — visible on hover / focus-within */}
            {!isSelf && currentUser && (
              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                <Button
                  size="icon"
                  variant="secondary"
                  className={cn(
                    'rounded-full size-9 bg-black/60 text-white backdrop-blur-sm hover:bg-primary',
                    optimisticFav && 'text-rose-400 hover:text-rose-400',
                  )}
                  onClick={handleToggleFavorite}
                  disabled={isPending}
                  aria-label={optimisticFav ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={optimisticFav}
                >
                  <Heart
                    className={cn('size-4', optimisticFav && 'fill-current')}
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full size-9 bg-black/60 text-white backdrop-blur-sm hover:bg-primary"
                  onClick={handleMessage}
                  aria-label={`Message ${displayName}`}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}

            {/* Profile info */}
            <div className="absolute bottom-0 inset-x-0 p-3 text-white">
              <div className="flex items-baseline gap-2">
                <h3 className="font-bold text-base leading-tight truncate">{displayName}</h3>
                {age && <span className="text-sm opacity-90">{age}</span>}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                {isOnline && (
                  <span className="flex items-center gap-1" aria-label="Online now">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    Online
                  </span>
                )}
                {distanceMiles !== undefined && distanceMiles < Infinity && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden="true" />
                    {distanceMiles < 1
                      ? 'Less than 1 mi'
                      : `${distanceMiles.toFixed(1)} mi`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

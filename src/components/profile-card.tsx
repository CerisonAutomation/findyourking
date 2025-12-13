'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface ProfileCardProps {
  user: UserProfile;
  matchScore?: number;
  isOnline?: boolean;
  distance?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ProfileCard({ user: profileUser, matchScore, isOnline, distance, isFavorite: initialIsFavorite, onToggleFavorite }: ProfileCardProps) {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);
  const supabase = createClient();

  useEffect(() => {
    setIsFavorite(initialIsFavorite || false);
  }, [initialIsFavorite]);

  const handleStartConversation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser || !profileUser.userId || currentUser.id === profileUser.userId) return;

    // Just navigate, the chat page will handle creating the conversation
    router.push(`/messages/${profileUser.userId}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser || !profileUser.userId || currentUser.id === profileUser.userId) return;

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('favorited_user_id', profileUser.userId);

        if (error) throw error;

        setIsFavorite(false);
        toast.success('Removed from favorites');
        onToggleFavorite?.();
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUser.id,
            favorited_user_id: profileUser.userId
          });

        if (error) throw error;

        setIsFavorite(true);
        toast.success('Added to favorites');
        onToggleFavorite?.();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };
  
  if (!profileUser || !profileUser.userId) {
    return null;
  }

  return (
    <Link href={`/profile/${profileUser.userId}`} className="block group">
      <Card className="overflow-hidden h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4]">
            <Image
              src={profileUser.avatarUrl ?? `https://picsum.photos/seed/${profileUser.userId}/600/800`}
              alt={profileUser.id ?? 'User profile'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
             {matchScore && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold py-1 px-2 rounded-full">
                {matchScore}% Match
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                    size="icon"
                    variant="secondary"
                    className={`rounded-full h-10 w-10 bg-black/50 text-white hover:bg-primary ${isFavorite ? 'text-red-500' : ''}`}
                    onClick={handleToggleFavorite}
                    disabled={!currentUser || currentUser.id === profileUser.userId}
                    aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                    <Heart className={`size-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full h-10 w-10 bg-black/50 text-white hover:bg-primary"
                    onClick={handleStartConversation}
                    disabled={!currentUser || currentUser.id === profileUser.userId}
                    aria-label="Send Message"
                >
                    <MessageCircle className="size-5" />
                </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <div className="flex items-baseline gap-2">
                <h3 className="font-bold text-lg truncate">{profileUser.id}</h3>
                <p className="text-base">{profileUser.age}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-300 mt-1">
                 {isOnline && (
                    <div className='flex items-center gap-1.5'>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Online
                    </div>
                )}
                {distance !== undefined && (
                    <div className='flex items-center gap-1.5'>
                        <MapPin className="size-3" />
                        {distance.toFixed(1)} miles away
                    </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

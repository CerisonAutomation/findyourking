'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase-client';
import { ProfileCard } from '@/components/profile-card';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserProfile } from '@/lib/types';

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-xl bg-black/40 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        // Get user's favorites
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('favorited_user_id')
          .eq('user_id', user.id);

        if (favoritesError) throw favoritesError;

        if (favoritesData && favoritesData.length > 0) {
          const favoritedUserIds = favoritesData.map(f => f.favorited_user_id);

          // Get profiles of favorited users
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('userId', favoritedUserIds);

          if (profilesError) throw profilesError;

          setFavorites(profilesData as UserProfile[]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user, supabase]);

  const handleRemoveFavorite = async (favoritedUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorited_user_id', favoritedUserId);

      if (error) throw error;

      // Update local state
      setFavorites(prev => prev.filter(profile => profile.userId !== favoritedUserId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 h-full flex flex-col">
        <header className="flex-col items-center justify-between mb-6 md:mb-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              My Favorites
            </h1>
            <p className="text-muted-foreground mt-1">
              Your saved profiles
            </p>
          </div>
        </header>
        <FavoritesSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <header className="flex-col items-center justify-between mb-6 md:mb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-1">
            Your saved profiles
          </p>
        </div>
      </header>

      {favorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 border-2 border-dashed border-border/50 rounded-xl p-8">
          <Heart className="size-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">No Favorites Yet</h2>
          <p className="max-w-xs">
            Start exploring profiles and save your favorites to see them here.
          </p>
          <Link href="/discover">
            <Button>
              Discover Profiles
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {favorites.map((profile) => (
            <div key={profile.userId} className="relative group">
              <ProfileCard
                user={profile}
                isFavorite={true}
                onToggleFavorite={() => handleRemoveFavorite(profile.userId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
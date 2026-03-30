'use client';

import { useUser } from '@/hooks/use-user';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import { ProfileCard } from '@/components/profile-card';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function fetchFavoriteProfiles(userId: string): Promise<UserProfile[]> {
  const supabase = createClient();

  const { data: favRows, error: favError } = await supabase
    .from('favorites')
    .select('favorited_user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (favError) throw new Error(favError.message);
  if (!favRows || favRows.length === 0) return [];

  const ids = favRows.map((r) => r.favorited_user_id);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', ids);

  if (profileError) throw new Error(profileError.message);

  return (profiles ?? []).map((row) => transformToCamel<UserProfile>(row));
}

function FavoritesSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
      aria-hidden="true"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: favorites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => fetchFavoriteProfiles(user!.id),
    enabled: !!user,
  });

  const handleRemoveFavorite = async (favoritedUserId: string) => {
    if (!user) return;
    const supabase = createClient();

    queryClient.setQueryData<UserProfile[]>(
      ['favorites', user.id],
      (old) => (old ?? []).filter((p) => p.userId !== favoritedUserId)
    );

    const { error: removeError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('favorited_user_id', favoritedUserId);

    if (removeError) {
      await queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
      toast.error('Could not remove favorite', { description: removeError.message });
    } else {
      toast.success('Removed from favorites');
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-full flex flex-col gap-6">
      <header>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Favorites</h1>
          {favorites.length > 0 && (
            <span className="text-sm text-muted-foreground font-medium">
              {favorites.length} saved
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">Kings you&apos;ve saved for later.</p>
      </header>

      {isLoading ? (
        <FavoritesSkeleton />
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-destructive text-sm">
          Failed to load favorites. Please try again.
        </div>
      ) : favorites.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 border-2 border-dashed border-border/50 rounded-xl p-10"
          role="status"
        >
          <Heart className="size-16 opacity-40" />
          <h2 className="text-xl font-semibold">No Favorites Yet</h2>
          <p className="max-w-xs text-sm">
            Tap the heart on any profile to save them here.
          </p>
          <Link href="/discover">
            <Button>Discover Kings</Button>
          </Link>
        </div>
      ) : (
        <section
          aria-label="Favorite profiles"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {favorites.map((profile) => (
            <ProfileCard
              key={profile.userId}
              user={profile}
              isFavorite
              onToggleFavorite={() => handleRemoveFavorite(profile.userId)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

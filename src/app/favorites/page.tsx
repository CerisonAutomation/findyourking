'use client';

import { useUser } from '@/hooks/use-user';
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites';
import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Loader2, HeartOff } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

async function fetchFavoriteProfiles(userIds: string[]) {
  if (!userIds.length) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url, role, is_verified, location')
    .in('user_id', userIds);
  return data ?? [];
}

export default function FavoritesPage() {
  const { user }                            = useUser();
  const { data: favorites = [], isLoading } = useFavorites(user?.id);
  const toggleFav                           = useToggleFavorite(user?.id);

  const favoriteIds = favorites.map((f) => (f as Record<string, string>).favorited_user_id);

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['favoriteProfiles', favoriteIds],
    queryFn:  () => fetchFavoriteProfiles(favoriteIds),
    enabled:  favoriteIds.length > 0,
    staleTime: 2 * 60_000,
  });

  const loading = isLoading || isLoadingProfiles;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3">
          <h1 className="text-lg font-bold">Favorites</h1>
          <p className="text-xs text-muted-foreground">{favorites.length} saved kings</p>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground text-center">
            <HeartOff className="size-12 opacity-30" />
            <p className="font-medium">No favorites yet</p>
            <p className="text-sm">Heart a profile on Discover to save them here.</p>
            <Link href="/discover">
              <Button variant="outline" size="sm">Discover Kings</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {profiles.map((profile: Record<string, string>) => (
              <div key={profile.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                <Link href={`/profile/${profile.user_id}`}>
                  <Avatar className="size-12">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
                    <AvatarFallback>{(profile.display_name ?? 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${profile.user_id}`}>
                    <p className="font-semibold text-sm truncate">{profile.display_name}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                  {profile.location && (
                    <p className="text-xs text-muted-foreground">{profile.location}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/messages/${profile.user_id}`}>
                    <Button size="icon" variant="outline" className="size-9" aria-label="Message">
                      <MessageCircle className="size-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon" variant="outline" className="size-9"
                    onClick={() => toggleFav.mutate(profile.user_id)}
                    disabled={toggleFav.isPending}
                    aria-label="Unfavorite"
                  >
                    <Heart className="size-4 fill-current text-primary" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

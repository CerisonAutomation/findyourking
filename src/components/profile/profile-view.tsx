'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useToggleFavorite, useFavorites } from '@/hooks/use-favorites';
import { uploadAvatar, MAX_AVATAR_BYTES } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Heart, MessageCircle, Crown, MapPin, Star, CheckCircle2, Camera,
  ArrowLeft, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';

interface Props {
  initialProfile: Record<string, unknown>;
  userId: string;
}

interface AlbumPhoto { id: string; url: string; sortOrder: number; }

async function fetchAlbum(userId: string): Promise<AlbumPhoto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('album_photos')
    .select('id, url, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .limit(12);
  return (data ?? []).map((r) => ({ id: r.id, url: r.url, sortOrder: r.sort_order }));
}

export function ProfileView({ initialProfile, userId }: Props) {
  const { user }   = useUser();
  const qc         = useQueryClient();
  const isOwn      = user?.id === userId;
  const [lightbox, setLightbox] = useState<string | null>(null);

  const profile = initialProfile as unknown as Profile;
  const displayName = (profile as Record<string, string>).display_name ?? 'King';
  const avatarUrl   = (profile as Record<string, string>).avatar_url ?? null;
  const bio         = (profile as Record<string, string>).bio ?? '';
  const isVerified  = Boolean((profile as Record<string, boolean>).is_verified);
  const role        = (profile as Record<string, string>).role ?? 'seeker';
  const location    = (profile as Record<string, string>).location ?? null;
  const tribes      = (profile as Record<string, string[]>).tribes ?? [];
  const interests   = (profile as Record<string, string[]>).interests ?? [];

  const { data: album = [] } = useQuery({
    queryKey: ['album', userId],
    queryFn:  () => fetchAlbum(userId),
  });

  const { data: favorites = [] } = useFavorites(user?.id);
  const isFavorited = favorites.some((f) => (f as Record<string, string>).favorited_user_id === userId);
  const toggleFav   = useToggleFavorite(user?.id);

  // Avatar upload (own profile)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > MAX_AVATAR_BYTES) { toast.error('Max 3 MB'); return; }
    try {
      const url        = await uploadAvatar(file, user.id);
      const supabase   = createClient();
      const { error }  = await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      if (error) throw error;
      void qc.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Avatar updated!');
    } catch (e) {
      toast.error((e as Error).message);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Back */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center px-4 py-2 border-b">
        <Link href="/discover" aria-label="Back">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <span className="ml-2 font-semibold truncate">{displayName}</span>
        {!isOwn && (
          <Link href={`/messages/${userId}`} className="ml-auto">
            <Button size="sm" variant="outline">
              <MessageCircle className="mr-1.5 size-4" /> Message
            </Button>
          </Link>
        )}
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="h-40 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        <div className="absolute -bottom-14 left-4">
          <div className="relative">
            <Avatar className="size-28 border-4 border-background shadow-xl">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-3xl"><Crown /></AvatarFallback>
            </Avatar>
            {isOwn && (
              <label
                className="absolute bottom-1 right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow"
                aria-label="Change avatar"
              >
                <Camera className="size-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isOwn && user && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              variant={isFavorited ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFav.mutate(userId)}
              disabled={toggleFav.isPending}
              aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
            >
              <Heart className={cn('size-4', isFavorited && 'fill-current')} />
            </Button>
            <Link href={`/messages/${userId}`}>
              <Button size="sm">
                <MessageCircle className="mr-1.5 size-4" /> Chat
              </Button>
            </Link>
          </div>
        )}
        {isOwn && (
          <div className="absolute bottom-4 right-4">
            <Link href="/profile/edit">
              <Button size="sm" variant="outline">Edit Profile</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-16 px-4 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {isVerified && <CheckCircle2 className="size-5 text-primary" aria-label="Verified" />}
          <Badge variant="secondary" className="capitalize ml-auto">{role}</Badge>
        </div>

        {location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />{location}
          </p>
        )}

        {bio && <p className="text-sm leading-relaxed">{bio}</p>}

        {/* Tribes */}
        {tribes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tribes.map((t) => (
              <Badge key={t} variant="outline" className="capitalize text-xs">{t}</Badge>
            ))}
          </div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {interests.map((i) => (
                <span key={i} className="text-xs bg-muted rounded-full px-2.5 py-0.5">{i}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Album */}
      {album.length > 0 && (
        <section className="mt-6 px-4" aria-label="Photo album">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Photos · {album.length}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {album.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(photo.url)}
                className="aspect-square rounded-xl overflow-hidden bg-muted"
                aria-label={`View photo ${idx + 1}`}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Photo lightbox"
          aria-modal="true"
        >
          <img
            src={lightbox}
            alt="Full size photo"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
            aria-label="Close lightbox"
          >
            <ExternalLink className="size-6" />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  ShieldAlert,
  Octagon,
  MapPin,
  Ruler,
  Pencil,
  ArrowLeft,
  Loader2,
  Share2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import type { UserProfile } from '@/lib/types';

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? transformToCamel<UserProfile>(data) : null;
}

async function fetchIsFavorited(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('favorites')
    .select('favorited_user_id')
    .eq('user_id', currentUserId)
    .eq('favorited_user_id', targetUserId)
    .maybeSingle();
  return !!data;
}

function ProfilePageSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6" aria-label="Loading profile">
      <Skeleton className="h-8 w-24" />
      <div className="flex flex-col md:flex-row items-center gap-6">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: profileUserId } = use(params);
  const { user: currentUser } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profilePage', profileUserId],
    queryFn: () => fetchProfile(profileUserId),
    enabled: !!profileUserId,
  });

  const { data: isFavorited = false } = useQuery({
    queryKey: ['isFavorited', currentUser?.id, profileUserId],
    queryFn: () => fetchIsFavorited(currentUser!.id, profileUserId),
    enabled: !!currentUser && !!profileUserId && currentUser.id !== profileUserId,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (favorite: boolean) => {
      const supabase = createClient();
      if (favorite) {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: currentUser!.id, favorited_user_id: profileUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser!.id)
          .eq('favorited_user_id', profileUserId);
        if (error) throw error;
      }
    },
    onMutate: async (newFavorite) => {
      await queryClient.cancelQueries({
        queryKey: ['isFavorited', currentUser?.id, profileUserId],
      });
      const previous = queryClient.getQueryData<boolean>([
        'isFavorited', currentUser?.id, profileUserId,
      ]);
      queryClient.setQueryData(
        ['isFavorited', currentUser?.id, profileUserId],
        newFavorite
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        ['isFavorited', currentUser?.id, profileUserId],
        context?.previous
      );
      toast.error('Failed to update favorites');
    },
    onSuccess: (_data, newFavorite) => {
      toast.success(newFavorite ? 'Added to favorites' : 'Removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['favorites', currentUser?.id] });
    },
  });

  const handleStartConversation = async () => {
    if (!currentUser || !profile) return;
    const conversationId = [currentUser.id, profileUserId].sort().join('_');
    const supabase = createClient();
    const { error } = await supabase.from('conversations').upsert(
      {
        id: conversationId,
        participant1_id: currentUser.id,
        participant2_id: profileUserId,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) {
      toast.error('Could not start conversation.', { description: error.message });
      return;
    }
    router.push(`/messages/${profileUserId}`);
  };

  const handleBlockUser = async () => {
    if (!currentUser || !profile) return;
    const supabase = createClient();
    const { error } = await supabase.from('user_blocks').upsert(
      { blocker_id: currentUser.id, blocked_id: profileUserId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );
    if (error) {
      toast.error('Could not block user.');
      return;
    }
    toast.success(`${profile.id} has been blocked.`);
    router.push('/discover');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profileUserId}`;
    if (navigator.share) {
      await navigator.share({ title: profile?.id ?? 'Profile', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard');
    }
  };

  if (isLoading) return <ProfilePageSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-muted-foreground">
        <p className="text-lg font-semibold">This king does not exist in our realm.</p>
        <Link href="/discover">
          <Button variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUserId;

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto" aria-label={`${profile.id}'s profile`}>
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
      </div>

      <section className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="relative shrink-0">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.id ?? ''} />
            <AvatarFallback className="text-4xl">
              {(profile.id ?? 'K').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold">
              {profile.id}
              {profile.age && (
                <span className="font-normal text-muted-foreground">, {profile.age}</span>
              )}
            </h1>
            {profile.role && profile.role !== 'user' && (
              <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground text-sm mb-4">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.location}
              </span>
            )}
            {profile.height && (
              <span className="flex items-center gap-1">
                <Ruler className="size-3.5" />
                {profile.height} cm
              </span>
            )}
          </div>

          {!isOwnProfile ? (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Button onClick={handleStartConversation} disabled={!currentUser}>
                <MessageCircle className="mr-2 size-4" />
                Message
              </Button>
              <Button
                variant={isFavorited ? 'default' : 'outline'}
                onClick={() => favoriteMutation.mutate(!isFavorited)}
                disabled={!currentUser || favoriteMutation.isPending}
              >
                <Heart
                  className={`mr-2 size-4 ${
                    isFavorited ? 'fill-current' : ''
                  }`}
                />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share profile">
                <Share2 className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More actions">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>More actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={handleBlockUser}
                  >
                    <ShieldAlert className="mr-2 size-4" />
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Octagon className="mr-2 size-4" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/account">
              <Button variant="outline">
                <Pencil className="mr-2 size-4" />
                Edit Profile
              </Button>
            </Link>
          )}
        </div>
      </section>

      <Separator className="mb-8" />

      <div className="space-y-6">
        {profile.bio && (
          <section aria-labelledby="bio-heading">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle id="bio-heading">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {profile.bio}
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <section aria-labelledby="interests-heading">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle id="interests-heading">Interests &amp; Tribes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(profile.interests as string[]).map((interest) => (
                    <Badge key={interest} variant="secondary" className="text-sm py-1 px-3">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {profile.avatarUrl && (
          <section aria-labelledby="photos-heading">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle id="photos-heading">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[profile.avatarUrl].map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={src}
                        alt={`${profile.id} photo ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}

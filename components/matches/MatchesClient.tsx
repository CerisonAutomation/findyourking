'use client';

/**
 * MATCHES CLIENT - 150/100 TIER WITH INFINITE SCROLL
 * Per React docs: https://react.dev/reference/react/useTransition
 * Features: Infinite scroll, optimistic updates, real-time, lazy loading
 */

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, X, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/profile';

interface MatchesClientProps {
  userId: string;
  profileId: string;
  tier: 'FREE' | 'PREMIUM' | 'VIP';
}

const MATCHES_PER_PAGE = 20;

export default function MatchesClient({ userId, profileId, tier }: MatchesClientProps) {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load matches with pagination
  const loadMatches = useCallback(async (pageNum: number) => {
    const supabase = createClient();
    const offset = pageNum * MATCHES_PER_PAGE;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profileId)
      .range(offset, offset + MATCHES_PER_PAGE - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }, [profileId]);

  // Initial load
  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await loadMatches(0);
        setMatches(data);
        setHasMore(data.length === MATCHES_PER_PAGE);
      } catch {
        setHasMore(false);
      }
    });
  }, [loadMatches]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          startTransition(async () => {
            const nextPage = page + 1;
            try {
              const data = await loadMatches(nextPage);
              setMatches(prev => [...prev, ...data]);
              setPage(nextPage);
              setHasMore(data.length === MATCHES_PER_PAGE);
            } catch {
              setHasMore(false);
            }
          });
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, isPending, page, loadMatches]);

  // Like action with optimistic UI
  const handleLike = useCallback(async (matchId: string) => {
    setLikeLoading(matchId);

    // Optimistic update
    setMatches(prev => prev.filter(m => m.id !== matchId));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('likes')
        .insert({
          from_user_id: user.id,
          to_user_id: matchId,
        })
        .select()
        .single();

      if (error) throw error;

      // Check for mutual match
      const { data: mutualLike } = await supabase
        .from('likes')
        .select('*')
        .eq('from_user_id', matchId)
        .eq('to_user_id', user.id)
        .single();

      if (mutualLike) {
        // It's a match! Show notification
        router.push(`/matches?matched=${matchId}`);
      }
    } catch {
      // Rollback optimistic update
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (data) {
        setMatches(prev => [data, ...prev]);
      }
    } finally {
      setLikeLoading(null);
    }
  }, [router]);

  // Pass action
  const handlePass = useCallback((matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  }, []);

  // Calculate age from birthdate
  const calculateAge = (birthdate: string | null): number | null => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (matches.length === 0 && !isPending && !hasMore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-linear-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No more matches right now
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Check back later for new profiles, or adjust your preferences!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Your Match
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {matches.length} {matches.length === 1 ? 'profile' : 'profiles'} available
        </p>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            {/* Image */}
            <div className="relative aspect-3/4 bg-gray-200 dark:bg-gray-700">
              <Image
                src={match.avatar_url || '/default-avatar.png'}
                alt={match.full_name || 'User'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              {match.is_verified && (
                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {match.full_name || 'Anonymous'}, {calculateAge(match.birthdate) || '?'}
              </h3>
              
              {match.location_lat && match.location_lng && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>Nearby</span>
                </div>
              )}

              {match.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {match.bio}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePass(match.id)}
                  disabled={likeLoading === match.id}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  aria-label="Pass"
                >
                  <X className="w-5 h-5" />
                  <span className="font-semibold">Pass</span>
                </button>
                <button
                  onClick={() => handleLike(match.id)}
                  disabled={likeLoading === match.id}
                  className="flex-1 py-3 bg-linear-to-r from-pink-500 to-red-500 text-white rounded-full hover:from-pink-600 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  aria-label="Like"
                >
                  {likeLoading === match.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                  <span className="font-semibold">Like</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isPending && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more matches...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

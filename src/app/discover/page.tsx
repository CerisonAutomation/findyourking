'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import type { UserProfile } from '@/lib/types';
import { ProfileCard } from '@/components/profile-card';
import { Frown, Loader2, BrainCircuit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { findKings, type FindKingsOutput } from '@/ai/flows/find-kings-flow';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import { createClient, transformToCamel } from '@/lib/supabase-client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FilterDialog } from '@/components/filter-dialog';
import { useLocation } from '@/hooks/use-location';
import { useInView } from 'react-intersection-observer';

const PAGE_SIZE = 20;

interface DiscoverFilters {
  ageRange: [number, number];
  distance: number;
  tribes: string[];
  interests: string[];
}

const DEFAULT_FILTERS: DiscoverFilters = {
  ageRange: [18, 65],
  distance: 50,
  tribes: [],
  interests: [],
};

async function fetchProfilesPage(
  currentUserId: string | undefined,
  page: number
): Promise<{ users: UserProfile[]; hasMore: boolean; total: number }> {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (currentUserId) {
    query = query.neq('user_id', currentUserId); // ✅ snake_case
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const users = (data ?? []).map((row) => transformToCamel<UserProfile>(row));
  const total = count ?? 0;
  return { users, hasMore: from + PAGE_SIZE < total, total };
}

function haversineDistanceMiles(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Module-level components (no remount on parent re-render) ──────────────────
const ProfileGridSkeleton = memo(function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
});

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-4 py-24">
      <Icon className="size-14 opacity-40" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-xs text-sm">{body}</p>
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useUser();
  const location = useLocation();
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FindKingsOutput | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['discover-profiles', user?.id],
    queryFn: ({ pageParam = 1 }) => fetchProfilesPage(user?.id, pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!user && !searchResults,
  });

  const allUsers = data?.pages.flatMap((p) => p.users) ?? [];

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !searchResults) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, searchResults, fetchNextPage]);

  // Realtime presence
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase.channel('presence:global');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set(
          Object.values(state)
            .flat()
            .map((p) => p.user_id)
        );
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) { setSearchResults(null); return; }
      if (!user) { toast.error('Sign in to use AI search.'); return; }

      setIsSearching(true);
      setSearchResults(null);
      try {
        const results = await findKings({ query: searchQuery, requestingUserId: user.id });
        setSearchResults(results);
      } catch {
        toast.error('AI search unavailable', { description: 'Please try again.' });
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, user]
  );

  const clearSearch = () => { setSearchResults(null); setSearchQuery(''); };

  // Client-side filter + distance sort
  const filteredUsers = (() => {
    let list = allUsers;

    if (location?.latitude && location?.longitude) {
      const withDist = list.map((p) => {
        const loc = (p as UserProfile & { location?: { latitude: number; longitude: number } | null }).location;
        if (loc?.latitude && loc?.longitude) {
          return {
            p,
            dist: haversineDistanceMiles(
              location.latitude!, location.longitude!,
              loc.latitude, loc.longitude
            ),
          };
        }
        return { p, dist: Infinity };
      });
      list = withDist
        .filter(({ dist }) => dist <= filters.distance)
        .sort((a, b) => a.dist - b.dist)
        .map(({ p }) => p);
    }

    if (filters.tribes.length > 0) {
      list = list.filter((p) =>
        filters.tribes.every((t) => (p.tribes ?? []).includes(t))
      );
    }
    if (filters.interests.length > 0) {
      list = list.filter((p) =>
        filters.interests.every((i) => (p.interests ?? []).includes(i))
      );
    }

    return list;
  })();

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 min-h-full">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">The Throne Room</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse kings, or use AI search to find your perfect match.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <BrainCircuit className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Describe your ideal king…"
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setSearchResults(null);
              }}
              disabled={isSearching}
              aria-label="AI king search"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <><Search className="size-4 mr-2" />Find Kings</>
            )}
          </Button>
          {searchResults && (
            <Button type="button" variant="ghost" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </form>
        <FilterDialog setFilters={setFilters} />
      </div>

      {isSearching || isLoading ? (
        <ProfileGridSkeleton />
      ) : searchResults ? (
        searchResults.kings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {searchResults.kings.map((k) => (
              <ProfileCard
                key={k.profile.userId}
                user={k.profile}
                matchScore={k.matchScore}
                isOnline={onlineUserIds.has(k.profile.userId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Frown}
            title="No Kings Found"
            body="The Oracle found no matches. Try rephrasing your search."
          />
        )
      ) : filteredUsers.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredUsers.map((p) => (
              <ProfileCard
                key={p.userId}
                user={p}
                isOnline={onlineUserIds.has(p.userId)}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="No Kings Here Yet"
          body="Be the first to claim your throne, or adjust your filters."
        />
      )}
    </div>
  );
}

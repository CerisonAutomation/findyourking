'use client';

import { useState, useCallback, memo } from 'react';
import type { UserProfile, DiscoverFilters, PaginatedResult } from '@/lib/types';
import { DEFAULT_DISCOVER_FILTERS } from '@/lib/types';
import { ProfileCard } from '@/components/profile-card';
import { Frown, Loader2, BrainCircuit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-user';
import { usePresence } from '@/hooks/use-presence';
import { useLocation } from '@/hooks/use-location';
import { toast } from 'sonner';
import { createClient, transformToCamel } from '@/lib/supabase/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from '@/hooks/use-in-view';
import { FilterDialog } from '@/components/filter-dialog';
import { haversineDistanceMiles, parseProfileLocation } from '@/lib/geo';
import { findKings, type FindKingsOutput } from '@/ai/flows/find-kings-flow';

const PAGE_SIZE = 20;

async function fetchProfilesPage(
  currentUserId: string | undefined,
  page: number,
): Promise<PaginatedResult<UserProfile>> {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (currentUserId) {
    query = query.neq('user_id', currentUserId);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data ?? []).map((row) => transformToCamel<UserProfile>(row)),
    hasMore: from + PAGE_SIZE < total,
    total,
    page,
  };
}

const ProfileGridSkeleton = memo(function ProfileGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      aria-busy="true"
      aria-label="Loading profiles"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
          aria-hidden="true"
        />
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
    <div className="flex flex-col items-center justify-center text-center gap-4 py-24">
      <Icon className="size-16 text-muted-foreground/30" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useUser();
  const location = useLocation();
  const onlineIds = usePresence(user?.id);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<FindKingsOutput | null>(null);
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_DISCOVER_FILTERS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['discover-profiles', user?.id],
    queryFn: ({ pageParam }) => fetchProfilesPage(user?.id, pageParam as number),
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
    initialPageParam: 1,
    enabled: !!user && !aiResults,
  });

  if (inView && hasNextPage && !isFetchingNextPage && !aiResults) {
    fetchNextPage();
  }

  const handleAiSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) { setAiResults(null); return; }
      if (!user) { toast.error('Sign in to use AI search'); return; }
      setIsAiSearching(true);
      setAiResults(null);
      try {
        const results = await findKings({ query: q, requestingUserId: user.id });
        setAiResults(results);
      } catch {
        toast.error('AI search unavailable', { description: 'Try again in a moment.' });
      } finally {
        setIsAiSearching(false);
      }
    },
    [searchQuery, user],
  );

  const clearSearch = useCallback(() => {
    setAiResults(null);
    setSearchQuery('');
  }, []);

  const allProfiles = data?.pages.flatMap((p) => p.data) ?? [];

  const displayProfiles = (() => {
    let list = allProfiles;
    const geo =
      location.latitude && location.longitude
        ? { lat: location.latitude, lon: location.longitude }
        : null;

    if (geo) {
      list = list
        .map((p) => {
          const loc = parseProfileLocation(p.location);
          const dist = loc
            ? haversineDistanceMiles(geo.lat, geo.lon, loc.latitude, loc.longitude)
            : Infinity;
          return { ...p, distanceMiles: dist };
        })
        .filter((p) => p.distanceMiles <= filters.distanceMiles)
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
    }

    if (filters.tribes.length > 0) {
      list = list.filter((p) =>
        filters.tribes.every((t) =>
          ((p as UserProfile & { tribes?: string[] }).tribes ?? []).includes(t),
        ),
      );
    }
    if (filters.interests.length > 0) {
      list = list.filter((p) =>
        filters.interests.every((i) =>
          ((p as UserProfile & { interests?: string[] }).interests ?? []).includes(i),
        ),
      );
    }
    if (filters.onlineOnly) {
      list = list.filter((p) => {
        const id =
          (p as UserProfile & { userId?: string }).userId ??
          (p as UserProfile & { user_id?: string }).user_id;
        return id ? onlineIds.has(id) : false;
      });
    }

    return list;
  })();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-full">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">The Throne Room</h1>
        <p className="text-sm text-muted-foreground">
          Browse kings near you, or let the Oracle find your perfect match.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <form
          onSubmit={handleAiSearch}
          className="flex flex-1 items-center gap-2"
          role="search"
        >
          <div className="relative flex-1">
            <BrainCircuit
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Describe your ideal king…"
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setAiResults(null);
              }}
              disabled={isAiSearching}
              aria-label="AI king search"
            />
          </div>
          <Button type="submit" size="sm" disabled={isAiSearching} className="h-11">
            {isAiSearching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Search className="size-4 mr-1.5" aria-hidden="true" />
                Find Kings
              </>
            )}
          </Button>
          {aiResults && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11"
              onClick={clearSearch}
            >
              Clear
            </Button>
          )}
        </form>
        <FilterDialog filters={filters} setFilters={setFilters} />
      </div>

      {isAiSearching || isLoading ? (
        <ProfileGridSkeleton />
      ) : aiResults ? (
        aiResults.kings.length > 0 ? (
          <section aria-label="AI search results">
            <p className="text-xs text-muted-foreground mb-3">
              {aiResults.kings.length} king
              {aiResults.kings.length !== 1 ? 's' : ''} found by Oracle
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {aiResults.kings.map((k) => (
                <ProfileCard
                  key={(k.profile as UserProfile & { userId?: string }).userId}
                  user={k.profile}
                  matchScore={k.matchScore}
                  isOnline={onlineIds.has(
                    (k.profile as UserProfile & { userId?: string }).userId ?? '',
                  )}
                />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            icon={Frown}
            title="No Kings Found"
            body="The Oracle found no matches. Try rephrasing your search."
          />
        )
      ) : displayProfiles.length > 0 ? (
        <section aria-label="Browse profiles">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayProfiles.map((p) => {
              const id =
                (p as UserProfile & { userId?: string }).userId ??
                (p as UserProfile & { user_id?: string }).user_id ??
                '';
              return (
                <ProfileCard
                  key={id}
                  user={p}
                  isOnline={onlineIds.has(id)}
                  distanceMiles={p.distanceMiles}
                />
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </section>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="No Kings Here Yet"
          body="Be the first to claim your throne — or adjust your filters."
        />
      )}
    </div>
  );
}

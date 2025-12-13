'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { ProfileCard } from '@/components/profile-card';
import { Frown, Loader2, BrainCircuit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { findKings, FindKingsOutput } from '@/ai/flows/find-kings-flow';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { FilterDialog } from '@/components/filter-dialog';
import { useLocation } from '@/hooks/use-location';
import { useInView } from 'react-intersection-observer';


async function fetchAllUsers(currentUserId?: string, page: number = 1, pageSize: number = 20): Promise<{ users: UserProfile[], hasMore: boolean }> {
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(from, to);

    if (currentUserId) {
        query = query.neq('userId', currentUserId);
    }

    const { data, error, count } = await query;
    if (error) {
        console.error("Error fetching users:", error);
        return { users: [], hasMore: false };
    }

    const hasMore = count ? from + pageSize < count : false;
    return { users: data as UserProfile[], hasMore };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function FilterSkeleton() {
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

export default function DiscoverPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FindKingsOutput | null>(
    null
  );
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [filters, setFilters] = useState({ ageRange: [18, 65], distance: 50, tribes: [], interests: [] });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const location = useLocation();
  const { ref, inView } = useInView();

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Load initial users
  useEffect(() => {
    if (!user || searchResults) return;

    const loadInitialUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const { users, hasMore } = await fetchAllUsers(user.id, 1);
        setAllUsers(users);
        setHasMore(hasMore);
        setPage(1);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadInitialUsers();
  }, [user, searchResults]);

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasMore && !loadingMore && !searchResults) {
      loadMoreUsers();
    }
  }, [inView, hasMore, loadingMore, searchResults]);

  const loadMoreUsers = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { users: newUsers, hasMore: more } = await fetchAllUsers(user?.id, nextPage);
      setAllUsers(prev => [...prev, ...newUsers]);
      setPage(nextPage);
      setHasMore(more);
    } catch (error) {
      console.error('Error loading more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, user?.id]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase.channel('presence:global');

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setOnlineUsers(newState);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
      
      return () => {
        supabase.removeChannel(channel);
      }
  }, [user]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If search is cleared, show all users again
      setSearchResults(null);
      return;
    }
    if (!user) {
      toast.error('You must be logged in to command the search.');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    try {
      const results = await findKings({
        query: searchQuery,
        requestingUserId: user.id,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('AI King Search Error:', error);
      toast.error('The Oracle is silent', {
        description: 'Could not complete the search. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const profilesToDisplay = searchResults?.kings;
  const initialProfiles = allUsers?.map(p => ({ profile: p, matchScore: 0, matchReason: '' }));

  const DisplayGrid = () => {
    if (isSearching || isLoadingUsers) {
        return <FilterSkeleton />;
    }

    let filteredProfiles = initialProfiles;

    if (location.latitude && location.longitude) {
        filteredProfiles = filteredProfiles?.map(p => {
            const profileLat = p.profile.location?.latitude;
            const profileLng = p.profile.location?.longitude;
            if (profileLat && profileLng) {
                const distance = haversineDistance(location.latitude as number, location.longitude as number, profileLat, profileLng);
                return { ...p, distance };
            }
            return { ...p, distance: Infinity }; // Put profiles without location at the end
        }).filter(p => p.distance <= filters.distance).sort((a,b) => a.distance - b.distance);
    }

    if(filters.tribes.length > 0) {
        filteredProfiles = filteredProfiles?.filter(p => filters.tribes.every(tribe => p.profile.tribes?.includes(tribe)));
    }

    if(filters.interests.length > 0) {
        filteredProfiles = filteredProfiles?.filter(p => filters.interests.every(interest => p.profile.interests?.includes(interest)));
    }

    if (searchResults) { // Active search results
        if (profilesToDisplay && profilesToDisplay.length > 0) {
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {profilesToDisplay.map((king) => (
                        <ProfileCard
                        key={king.profile.userId}
                        user={king.profile}
                        matchScore={king.matchScore}
                        isOnline={!!onlineUsers[king.profile.userId]}
                        />
                    ))}
                </div>
            )
        }
        return (
             <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 border-2 border-dashed border-border/50 rounded-xl">
                <Frown className="size-16" />
                <h2 className="text-xl font-semibold">No Kings Found</h2>
                <p className="max-w-xs">
                  The Oracle found no one matching your description. Try a different
                  search for your sovereign.
                </p>
              </div>
        )
    }

    if (filteredProfiles && filteredProfiles.length > 0) { // Default view
        return (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {filteredProfiles.map((king) => (
                    <ProfileCard
                        key={king.profile.userId}
                        user={king.profile}
                        isOnline={!!onlineUsers[king.profile.userId]}
                        distance={king.distance}
                    />
                ))}
            </div>
        )
    }

    // Default empty state
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4 border-2 border-dashed border-border/50 rounded-xl">
          <BrainCircuit className="size-16" />
          <h2 className="text-xl font-semibold">Awaiting Your Command</h2>
          <p className="max-w-xs">
            Use the AI Matchmaker above to find your perfect connection across
            the realm.
          </p>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <header className="flex-col items-center justify-between mb-6 md:mb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            The Throne Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Describe your ideal king and the AI Oracle shall find him.
          </p>
        </div>
        <div className="flex w-full items-center space-x-2">
            <form
            onSubmit={handleSearch}
            className="flex-1 flex items-center space-x-2"
            >
                <div className="relative flex-1">
                    <BrainCircuit className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="e.g., An ambitious architect who loves minimalist design..."
                    className="pl-12 h-12 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                    />
                </div>
                <Button type="submit" size="lg" disabled={isSearching}>
                    {isSearching ? (
                    <Loader2 className="animate-spin" />
                    ) : (
                    <>
                        <Search className="mr-2" /> Find Kings
                    </>
                    )}
                </Button>
            </form>
            <FilterDialog setFilters={setFilters} />
        </div>
      </header>

      <DisplayGrid />
      
    </div>
  );
}

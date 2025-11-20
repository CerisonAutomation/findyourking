'use client';

import { useState, useMemo } from 'react';
import { UserProfile } from '@/app/profile/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, X, Sparkles, User, Filter, Grid3x3, LayoutList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface MatchesGridProps {
  matches: UserProfile[];
  onLike: (userId: string) => Promise<void>;
  onPass: (userId: string) => void;
  loading?: boolean;
}

type ViewMode = 'grid' | 'stack';
type FilterType = 'all' | 'ai' | 'real' | 'online' | 'verified';
type SortType = 'recent' | 'distance' | 'active';

export default function MatchesGrid({
  matches,
  onLike,
  onPass,
  loading = false,
}: MatchesGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [showAI, setShowAI] = useState(true);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Apply AI filter
    if (!showAI) {
      filtered = filtered.filter(m => !m.is_ai);
    }

    // Apply type filter
    if (filter === 'ai') {
      filtered = filtered.filter(m => m.is_ai);
    } else if (filter === 'real') {
      filtered = filtered.filter(m => !m.is_ai);
    } else if (filter === 'online') {
      filtered = filtered.filter(m => m.is_online);
    } else if (filter === 'verified') {
      filtered = filtered.filter(m => m.is_verified);
    }

    // Apply verified filter
    if (showVerifiedOnly) {
      filtered = filtered.filter(m => m.is_verified);
    }

    // Sort matches
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance ?? 999999) - (b.distance ?? 999999);
        case 'active':
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [matches, filter, sortBy, showAI, showVerifiedOnly]);

  const aiCount = matches.filter(m => m.is_ai).length;
  const realCount = matches.filter(m => !m.is_ai).length;

  return (
    <div className="w-full space-y-6">
      {/* Controls Header */}
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {aiCount} AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {realCount} Kings
                </span>
              </div>
              <Badge variant="outline" className="text-sm">
                {filteredMatches.length} shown
              </Badge>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'stack' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('stack')}
                className="gap-2"
              >
                <LayoutList className="w-4 h-4" />
                Stack
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            {/* Filter Type */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filter} onValueChange={(v: string) => setFilter(v as FilterType)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ai">AI Only</SelectItem>
                  <SelectItem value="real">Real Only</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortType)}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="distance">Nearest</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggles */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-ai"
                  checked={showAI}
                  onCheckedChange={setShowAI}
                />
                <Label htmlFor="show-ai" className="text-sm cursor-pointer">
                  Show AI
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="verified-only"
                  checked={showVerifiedOnly}
                  onCheckedChange={setShowVerifiedOnly}
                />
                <Label htmlFor="verified-only" className="text-sm cursor-pointer">
                  Verified Only
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMatches.map((match) => (
            <MatchGridCard
              key={match.id}
              match={match}
              onLike={onLike}
              onPass={onPass}
              loading={loading}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <MatchListCard
              key={match.id}
              match={match}
              onLike={onLike}
              onPass={onPass}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredMatches.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-linear-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No matches found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
}

function MatchGridCard({
  match,
  onLike,
  onPass,
  loading,
}: {
  match: UserProfile;
  onLike: (userId: string) => Promise<void>;
  onPass: (userId: string) => void;
  loading: boolean;
}) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    await onLike(match.id);
    setIsLiking(false);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="relative aspect-3/4 overflow-hidden">
        <Image
          src={match.avatar_url || '/default-avatar.png'}
          alt={match.full_name || 'User'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {match.is_ai && (
            <Badge className="bg-purple-500/90 backdrop-blur-sm text-white border-none">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          )}
          {match.is_verified && (
            <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-none">
              ✓ Verified
            </Badge>
          )}
          {match.is_online && (
            <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-none">
              ● Online
            </Badge>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-bold mb-1">{match.full_name}</h3>
          <p className="text-sm opacity-90 line-clamp-2">{match.bio}</p>
          {match.distance && (
            <p className="text-xs opacity-75 mt-1">
              {Math.round(match.distance)} km away
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <CardContent className="p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            onClick={() => onPass(match.id)}
            disabled={loading || isLiking}
          >
            <X className="w-5 h-5 text-red-500" />
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-linear-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            onClick={handleLike}
            disabled={loading || isLiking}
          >
            {isLiking ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className="w-5 h-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchListCard({
  match,
  onLike,
  onPass,
  loading,
}: {
  match: UserProfile;
  onLike: (userId: string) => Promise<void>;
  onPass: (userId: string) => void;
  loading: boolean;
}) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    await onLike(match.id);
    setIsLiking(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Image */}
          <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden shrink-0">
            <Image
              src={match.avatar_url || '/default-avatar.png'}
              alt={match.full_name || 'User'}
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {match.full_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{match.username}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {match.is_ai && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
                {match.is_verified && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    ✓
                  </Badge>
                )}
                {match.is_online && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                    ●
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
              {match.bio}
            </p>

            {match.distance && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                📍 {Math.round(match.distance)} km away
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                onClick={() => onPass(match.id)}
                disabled={loading || isLiking}
              >
                <X className="w-4 h-4 text-red-500 mr-1" />
                Pass
              </Button>
              <Button
                size="sm"
                className="bg-linear-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                onClick={handleLike}
                disabled={loading || isLiking}
              >
                {isLiking ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Heart className="w-4 h-4 mr-1" />
                )}
                Like
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

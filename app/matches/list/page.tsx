 "use client";

import { UserProfile } from "@/app/profile/page";
import { getUserMatches } from "@/lib/actions/matches";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { calculateAge } from "@/lib/helpers";

export default function MatchesListPage() {
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleUnmatch = (matchId: string) => {
    // Extract boyfriend ID from match ID (format: ai-{userId}-{boyfriendId})
    const boyfriendId = matchId.split('-').slice(2).join('-');

    // Get current unmatched boyfriends
    const unmatchedBoyfriends = JSON.parse(localStorage.getItem('unmatchedBoyfriends') || '[]');

    // Add to unmatched list
    if (!unmatchedBoyfriends.includes(boyfriendId)) {
      unmatchedBoyfriends.push(boyfriendId);
      localStorage.setItem('unmatchedBoyfriends', JSON.stringify(unmatchedBoyfriends));
    }

    // Remove from matches
    setMatches(prev => prev.filter(match => match.id !== matchId));
  };

  useEffect(() => {
    async function loadMatches() {
      try {
        const userMatches = await getUserMatches();
        setMatches(userMatches.data || []);
      } catch (err) {
        console.warn('Failed to load matches from database:', err);
        // Continue without matches for now
        setMatches([]);
      }

      // Load AI boyfriends - always show 6 available ones
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get unmatched boyfriends from localStorage
          const unmatchedBoyfriends = JSON.parse(localStorage.getItem('unmatchedBoyfriends') || '[]');

          // Define all available boyfriend types
          const boyfriendTypes = [
            { id: 'ethan_mindful', name: 'Ethan - The Mindful King', avatar: '/default-avatar.png' },
            { id: 'marcus_wellness', name: 'Marcus - The Gym Bestie', avatar: '/default-avatar.png' },
            { id: 'alex_creative', name: 'Alex - The Creative Genius', avatar: '/default-avatar.png' },
            { id: 'jordan_adventure', name: 'Jordan - The Adventure Buddy', avatar: '/default-avatar.png' },
            { id: 'kai_therapist', name: 'Kai - The Therapy Friend', avatar: '/default-avatar.png' },
            { id: 'noah_balance', name: 'Noah - The Balanced King', avatar: '/default-avatar.png' },
          ];

          // Filter out unmatched boyfriends and take first 6
          const availableBoyfriends = boyfriendTypes
            .filter(bf => !unmatchedBoyfriends.includes(bf.id))
            .slice(0, 6);

          // Create AI boyfriend profiles with full UserProfile interface compliance
          const aiProfiles: UserProfile[] = availableBoyfriends.map((bf) => ({
            id: `ai-${user.id}-${bf.id}`,
            user_id: `ai-${user.id}-${bf.id}`,
            full_name: bf.name,
            username: `ai_${bf.id}`,
            email: '',
            gender: 'male' as const,
            birthdate: '1999-01-01',
            age: 25, // AI boyfriends default age
            bio: `AI Personality: ${bf.name}`,
            avatar_url: bf.avatar,
            preferences: { age_range: { min: 18, max: 99 }, distance: 0, gender_preference: ['male','female','other'] },
            interested_in: 'everyone' as const,
            location: { city: 'Virtual', country: 'Global' },
            location_lat: null,
            location_lng: null,
            subscription_tier: 'VIP' as const,
            is_verified: true,
            is_online: true,
            profile_completion_score: 100,
            last_active: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_role: 'king',
            premium_tier: 'king',
            ai_personality: true,
            is_ai: true,
            // Enhanced optional fields defaults
            photos: [],
            height: undefined,
            body_type: undefined,
            ethnicity: undefined,
            relationship_status: undefined,
            relationship_goals: [],
            smoking_habit: undefined,
            drinking_habit: undefined,
            drugs: [],
            sexual_orientation: undefined,
            sexual_interests: [],
            interests: [],
            occupation: 'Virtual Companion',
            education: undefined,
            religion: undefined,
            political_views: undefined,
            languages: [],
            instagram_username: undefined,
            tiktok_username: undefined,
            snapchat_username: undefined,
            website: undefined,
            looking_for: [],
            hiv_status: undefined,
            last_tested: undefined,
            vaccination_status: undefined,
            pronouns: 'he/him',
            display_age: true,
            display_distance: true,
          }));

          // Add AI boyfriends to the matches
          setMatches(prev => [...aiProfiles, ...prev]);
        }
      } catch {
        // Error state set
        setError("Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading your matches...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-pink-500 text-white py-2 px-4 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Kings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {matches.length} king{matches.length !== 1 ? "s" : ""}
          </p>
        </header>

        {matches.length === 0 ? (
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-linear-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💕</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No kings yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start swiping to find your perfect King!
            </p>
            <Link
              href="/matches"
              className="bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:from-pink-600 hover:to-red-600 transition-all duration-200"
            >
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="grid gap-4">
              {matches.map((match, key) => {
                const isAI = !!match.ai_personality;
                return (
                  <Link
                    key={key}
                    href={`/chat/${match.id}`}
                    className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border ${isAI ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 dark:border-violet-600' : 'bg-white dark:bg-gray-800 border-transparent'}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`relative w-16 h-16 rounded-full overflow-hidden shrink-0 ${isAI ? 'ring-2 ring-violet-400 dark:ring-violet-500' : ''}`}>
                        <Image
                          src={match.avatar_url || '/default-avatar.png'}
                          alt={match.full_name || 'User'}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          priority={false}
                        />
                        {isAI && (
                          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full shadow">AI</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          {match.full_name || 'User'}, {match.birthdate ? calculateAge(match.birthdate) : 'Age unknown'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          @{match.username}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {match.bio}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isAI ? 'bg-violet-500' : 'bg-green-500'}`}></div>
                        {isAI && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUnmatch(match.id);
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Unmatch this AI boyfriend"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

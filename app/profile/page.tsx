"use client";

import { getCurrentUserProfile } from "@/lib/actions/profile";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { calculateAge } from "@/lib/helpers";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  birthdate: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say' | null;
  interested_in: 'men' | 'women' | 'everyone' | null;
  location: Record<string, unknown>;
  location_lat: number | null;
  location_lng: number | null;
  distance?: number;
  preferences: Record<string, unknown>;
  subscription_tier: 'FREE' | 'PREMIUM' | 'VIP';
  is_verified: boolean;
  is_online: boolean;
  profile_completion_score: number;
  last_active: string;
  created_at: string;
  updated_at: string;
  // Auth-related fields
  email?: string;
  user_role?: 'seeker' | 'provider' | 'admin' | 'king';
  premium_tier?: 'free' | 'premium' | 'king' | 'king_plus';
  // Enhanced profile fields (now in DB schema)
  photos?: ProfilePhoto[];
  height?: number;
  body_type?: string;
  ethnicity?: string;
  relationship_status?: string;
  relationship_goals?: string[];
  smoking_habit?: string;
  drinking_habit?: string;
  drugs?: string[];
  sexual_orientation?: string;
  sexual_interests?: string[];
  interests?: string[];
  occupation?: string;
  education?: string;
  religion?: string;
  political_views?: string;
  languages?: string[];
  instagram_username?: string;
  tiktok_username?: string;
  snapchat_username?: string;
  website?: string;
  looking_for?: string[];
  hiv_status?: string;
  last_tested?: string;
  vaccination_status?: string;
  pronouns?: string;
  display_age?: boolean;
  display_distance?: boolean;
  // AI personality indicator
  ai_personality?: boolean;
  is_ai?: boolean;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
  uploadedAt: string;
}

export interface UserPreferences {
  age_range: {
    min: number;
    max: number;
  };
  distance: number;
  gender_preference: ("male" | "female" | "other")[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiBoyfriend, setAIBoyfriend] = useState<AIBoyfriend | null>(null);

  interface AIBoyfriend {
    id: string;
    name: string;
    avatar_url: string | null;
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    formality: number;
    verbosity: number;
    humor: number;
    emotiveness: number;
    playfulness: number;
    flirtiness: number;
    relationship_stage: string;
    romantic_intensity: number;
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getCurrentUserProfile();
        console.log(profileData);
        if (profileData) {
          setProfile(profileData);
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Error loading profile: ", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Load active AI boyfriend personality
  useEffect(() => {
    async function loadAIBoyfriend() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: boyfriend } = await supabase
          .from('ai_boyfriends')
          .select('id, name, avatar_url, openness, conscientiousness, extraversion, agreeableness, neuroticism, formality, verbosity, humor, emotiveness, playfulness, flirtiness, relationship_stage, romantic_intensity')
          .eq('user_id', user.id)
          .eq('active', true)
          .single();
        if (boyfriend) {
          setAIBoyfriend(boyfriend as AIBoyfriend);
        }
      } catch (e) {
        console.warn('No active AI boyfriend found or failed to load.', e);
      }
    }
    loadAIBoyfriend();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-linear-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Unable to load your profile. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:from-pink-600 hover:to-red-600 transition-all duration-200"
          >
            Retry
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
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Show off that sexy self! 💅
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden">
                      <Image
                        src={profile.avatar_url || "/default-avatar.png"}
                        alt={profile.full_name || 'Profile'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        priority
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {profile.full_name || 'User'}, {profile.birthdate ? calculateAge(profile.birthdate) : 'Age unknown'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      @{profile.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Member since{" "}
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      About This Hottie 💋
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {profile.bio || "No tea spilled yet! What's your story, queen?"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      The Deets 📱
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Gender
                        </label>
                        <p className="text-gray-900 dark:text-white capitalize">
                          {profile.gender}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Age
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {profile.birthdate ? calculateAge(profile.birthdate) : '?'} years young
                        </p>
                      </div>
                      {profile.height && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Height
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {Math.floor(profile.height / 12)}&apos;{profile.height % 12}&quot;
                          </p>
                        </div>
                      )}
                      {profile.body_type && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Body Type
                          </label>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {profile.body_type}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      What I&apos;m Looking For 👀
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Age Range
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {(profile.preferences as any)?.age_range?.min || 18} -{" "}
                          {(profile.preferences as any)?.age_range?.max || 99}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Distance
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          Up to {(profile.preferences as any)?.distance || 50} miles away
                        </p>
                      </div>
                    </div>
                  </div>

                  {profile.looking_for && profile.looking_for.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Seeking 🏳️‍🌈
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.looking_for.map((item, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        My Interests & Vibes 🎭
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.occupation && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        What I Do 💼
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {profile.occupation}
                      </p>
                    </div>
                  )}

                  {(profile.instagram_username || profile.snapchat_username || profile.website) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Find Me Online 📲
                      </h3>
                      <div className="space-y-2">
                        {profile.instagram_username && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Instagram: @{profile.instagram_username}
                          </p>
                        )}
                        {profile.snapchat_username && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Snapchat: {profile.snapchat_username}
                          </p>
                        )}
                        {profile.website && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Website: {profile.website}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Profile Stats 💎
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="text-gray-900 dark:text-white font-medium">
                      Profile Complete
                    </span>
                    <span className="text-pink-600 dark:text-pink-400 font-bold">
                      {profile.profile_completion_score || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">
                      Verification Status
                    </span>
                    <span className={`font-medium ${profile.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {profile.is_verified ? 'Verified ✅' : 'Unverified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">
                      Online Status
                    </span>
                    <span className={`font-medium ${profile.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                      {profile.is_online ? 'Online 🟢' : 'Offline ⚫'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions ⚡
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/profile/edit"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        Edit My Profile
                      </span>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Deets 👤
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">
                      Username
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      @{profile.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">
                      Member Since
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {profile.user_role && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                      <span className="text-gray-900 dark:text-white">
                        Role
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium capitalize">
                        {profile.user_role} {profile.user_role === 'king' ? '👑' : profile.user_role === 'provider' ? '💼' : '🔍'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {aiBoyfriend && (
                <div className="bg-violet-50 dark:bg-violet-900/30 rounded-2xl shadow-lg p-6 border border-violet-300 dark:border-violet-600">
                  <h3 className="text-lg font-semibold text-violet-700 dark:text-violet-300 mb-4 flex items-center justify-between">
                    <span>My AI Boyfriend Personality 👑🤖</span>
                    <Link href="/boyfriend/edit-personality" className="text-xs font-medium px-3 py-1 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors">Edit</Link>
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-violet-400">
                      <Image
                        src={aiBoyfriend.avatar_url || '/boyfriends/artist.jpg'}
                        alt={aiBoyfriend.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-violet-700 dark:text-violet-300">Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{aiBoyfriend.name}</p>
                      <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 capitalize">Stage: {aiBoyfriend.relationship_stage}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Openness', value: aiBoyfriend.openness },
                      { label: 'Conscientiousness', value: aiBoyfriend.conscientiousness },
                      { label: 'Extraversion', value: aiBoyfriend.extraversion },
                      { label: 'Agreeableness', value: aiBoyfriend.agreeableness },
                      { label: 'Neuroticism', value: aiBoyfriend.neuroticism },
                      { label: 'Humor', value: aiBoyfriend.humor },
                      { label: 'Playfulness', value: aiBoyfriend.playfulness },
                      { label: 'Flirtiness', value: aiBoyfriend.flirtiness },
                      { label: 'Romantic Intensity', value: aiBoyfriend.romantic_intensity },
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-violet-700 dark:text-violet-300">{metric.label}</span>
                          <span className="text-gray-700 dark:text-gray-300">{metric.value}</span>
                        </div>
                        <div className="h-2 rounded bg-violet-200 dark:bg-violet-800 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-violet-500 to-pink-500"
                            style={{ width: `${metric.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * CENTRALIZED PROFILE MODAL COMPONENT
 * Per Next.js Intercepting Routes: https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes
 * Per Radix UI Dialog: https://www.radix-ui.com/primitives/docs/components/dialog
 */

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import type { Profile } from '@/lib/types/profile';
import { MapPin, Calendar, Sparkles } from 'lucide-react';

interface ProfileModalProps {
  profileId: string;
  isOpen?: boolean;
}

export default function ProfileModal({ profileId, isOpen = true }: ProfileModalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please sign in to view profiles');
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (fetchError) {
          setError('Profile not found');
        } else {
          setProfile(data);
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  const handleClose = () => {
    router.back();
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : profile ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {profile.full_name || profile.username || 'User'}
                {profile.is_verified && (
                  <Sparkles className="w-5 h-5 text-pink-500" aria-label="Verified" />
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                <Image
                  src={profile.avatar_url || '/default-avatar.png'}
                  alt={profile.full_name || 'User avatar'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {profile.birthdate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{calculateAge(profile.birthdate)} years old</span>
                  </div>
                )}
                {profile.location_lat && profile.location_lng && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Nearby</span>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex items-center gap-1">
                    <span className="capitalize">{profile.gender}</span>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile.subscription_tier !== 'FREE' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-full text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  {profile.subscription_tier}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => router.push(`/profile/${profileId}`)}
                  className="flex-1 bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all"
                >
                  View Full Profile
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

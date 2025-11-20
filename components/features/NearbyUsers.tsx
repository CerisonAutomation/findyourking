'use client';

/**
 * NEARBY USERS - LOCATION-BASED DISCOVERY
 * Show users sorted by distance
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { MapPin, Navigation } from 'lucide-react';
import { calculateDistance, formatDistance } from './Geolocation';
import Link from 'next/link';

interface NearbyUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  tribes: string[];
  distance: number;
  is_online: boolean;
}

interface NearbyUsersProps {
  currentUserId: string;
  currentLat: number;
  currentLng: number;
  maxDistance?: number;
  limit?: number;
}

export default function NearbyUsers({
  currentUserId,
  currentLat,
  currentLng,
  maxDistance = 25,
  limit = 50,
}: NearbyUsersProps) {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNearbyUsers();
  }, [currentLat, currentLng, maxDistance]);

  const loadNearbyUsers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Get all users with location (in production, use PostGIS for efficiency)
      const { data: profiles } = await supabase
        .from('profiles')
        .select(
          `
          id,
          user_id,
          full_name,
          avatar_url,
          birthdate,
          location_lat,
          location_lng,
          is_online,
          user_tribes (
            tribes (
              name
            )
          )
        `
        )
        .neq('user_id', currentUserId)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .limit(limit);

      if (!profiles) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Calculate distances and filter
      const usersWithDistance = profiles
        .map((profile) => {
          const distance = calculateDistance(
            currentLat,
            currentLng,
            profile.location_lat!,
            profile.location_lng!
          );

          const age = profile.birthdate
            ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear()
            : null;

          const tribes =
            profile.user_tribes?.map((ut: any) => ut.tribes.name).filter(Boolean) || [];

          return {
            id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            age,
            tribes,
            distance,
            is_online: profile.is_online || false,
          };
        })
        .filter((user) => user.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);

      setUsers(usersWithDistance);
    } catch (error) {
      console.error('Failed to load nearby users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="mt-1 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No one nearby
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try increasing your distance filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {users.length} {users.length === 1 ? 'person' : 'people'} nearby
        </h2>
        <button
          onClick={loadNearbyUsers}
          className="text-sm text-pink-500 hover:text-pink-600 font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.id}`}
            className="group relative"
          >
            {/* Avatar */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
              <Image
                src={user.avatar_url || '/default-avatar.png'}
                alt={user.full_name || 'User'}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Online indicator */}
              {user.is_online && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}

              {/* Distance badge */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(user.distance)}
              </div>
            </div>

            {/* Info */}
            <div className="mt-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {user.full_name || 'Anonymous'}
                {user.age && `, ${user.age}`}
              </h3>

              {/* Tribes */}
              {user.tribes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.tribes.slice(0, 2).map((tribe) => (
                    <span
                      key={tribe}
                      className="text-xs px-2 py-0.5 bg-pink-500/10 text-pink-500 rounded-full"
                    >
                      {tribe}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

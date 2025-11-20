'use client';

/**
 * GEOLOCATION - CRITICAL DATING APP FEATURE
 * Per MDN: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
 * Features: Distance calculation, nearby users, location privacy
 */

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface GeolocationProps {
  userId: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km away`;
  } else {
    return `${Math.round(km)}km away`;
  }
}

export default function Geolocation({ userId, onLocationUpdate }: GeolocationProps) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
    lastUpdated: null,
  });
  const [isVisible, setIsVisible] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);

  const supabase = createClient();

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy,
          error: null,
          isLoading: false,
          lastUpdated: new Date(),
        });

        // Update database
        if (isVisible) {
          updateLocationInDatabase(latitude, longitude);
        }

        onLocationUpdate?.(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        setLocation((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [isVisible, onLocationUpdate]);

  // Watch location (continuous tracking)
  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy,
          error: null,
          isLoading: false,
          lastUpdated: new Date(),
        });

        // Update database every 5 minutes or when accuracy improves significantly
        if (
          isVisible &&
          (!location.lastUpdated ||
            Date.now() - location.lastUpdated.getTime() > 300000 ||
            (accuracy && location.accuracy && accuracy < location.accuracy / 2))
        ) {
          updateLocationInDatabase(latitude, longitude);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    setWatchId(id);
  }, [isVisible, location.lastUpdated, location.accuracy]);

  // Stop watching location
  const stopWatchingLocation = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Update location in database
  const updateLocationInDatabase = async (lat: number, lng: number) => {
    try {
      await supabase
        .from('profiles')
        .update({
          location_lat: lat,
          location_lng: lng,
          location_updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Toggle location visibility
  const toggleVisibility = async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    if (!newVisibility) {
      // Hide location from database
      await supabase
        .from('profiles')
        .update({
          location_lat: null,
          location_lng: null,
        })
        .eq('user_id', userId);
      stopWatchingLocation();
    } else if (location.latitude && location.longitude) {
      // Re-enable location
      updateLocationInDatabase(location.latitude, location.longitude);
      startWatchingLocation();
    }
  };

  // Initial location fetch
  useEffect(() => {
    getCurrentLocation();
    startWatchingLocation();

    return () => {
      stopWatchingLocation();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Location Status */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isVisible ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
            <MapPin className={`w-5 h-5 ${isVisible ? 'text-green-500' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Location</h3>
            {location.error ? (
              <p className="text-xs text-red-500">{location.error}</p>
            ) : location.latitude && location.longitude ? (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isVisible ? 'Visible to others' : 'Hidden'}
                {location.accuracy && ` • ±${Math.round(location.accuracy)}m accuracy`}
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400">Not available</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {location.isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          
          <button
            onClick={toggleVisibility}
            className={`p-2 rounded-full transition-colors ${
              isVisible
                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
            }`}
            title={isVisible ? 'Hide location' : 'Show location'}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={getCurrentLocation}
            disabled={location.isLoading}
            className="p-2 bg-pink-500/10 text-pink-500 rounded-full hover:bg-pink-500/20 transition-colors disabled:opacity-50"
            title="Refresh location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Location Info */}
      {location.latitude && location.longitude && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
            <span className="font-mono">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          </div>
          {location.lastUpdated && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
              <span>{location.lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Permission Prompt */}
      {location.error && location.error.includes('denied') && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl">
          <p className="text-sm text-yellow-700 dark:text-yellow-500">
            Please enable location permissions in your browser settings to use distance-based features.
          </p>
        </div>
      )}
    </div>
  );
}

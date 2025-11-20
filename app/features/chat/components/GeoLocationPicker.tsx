'use client';

/**
 * GEOLOCATION PICKER - LOCATION SHARING
 * Per Supabase PostGIS: https://supabase.com/docs/guides/database/extensions/postgis
 * Features: Current location, map preview, address lookup
 */

import { useState, useEffect } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeoLocationPickerProps {
  onSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  onClose: () => void;
}

export function GeoLocationPicker({ onSelect, onClose }: GeoLocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });

      // Reverse geocode to get address (using Nominatim - free OpenStreetMap service)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        setAddress(data.display_name || 'Unknown location');
      } catch {
        setAddress('Location detected');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSend = () => {
    if (location) {
      onSelect({ ...location, address });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            Share Location
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-pink-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Getting your location...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={getCurrentLocation} variant="outline">
                <Navigation className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {location && !loading && !error && (
            <div>
              {/* Static Map Preview */}
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff5588(${location.longitude},${location.latitude})/${location.longitude},${location.latitude},14,0/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                  alt="Map preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to OpenStreetMap static image
                    (e.target as HTMLImageElement).src = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`;
                  }}
                />
              </div>

              {/* Address */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address:</p>
                <p className="text-sm font-medium">{address || 'Getting address...'}</p>
              </div>

              {/* Coordinates */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!location}
            className="bg-linear-to-r from-pink-500 to-purple-600"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Send Location
          </Button>
        </div>
      </div>
    </div>
  );
}

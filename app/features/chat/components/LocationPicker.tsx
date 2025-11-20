'use client';

/**
 * LOCATION PICKER - ZENITH LEGENDARY TIER
 * Per Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
 * Features: Current location, map preview, address lookup
 */

import { useState, useEffect } from 'react';
import { MapPin, Loader2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LocationAttachment } from '../types';

interface LocationPickerProps {
  onSelect: (location: LocationAttachment) => void;
  children?: React.ReactNode;
}

export function LocationPicker({ onSelect, children }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationAttachment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      const locationData: LocationAttachment = {
        latitude,
        longitude,
        address: data.display_name || 'Unknown location',
        place_name: data.address?.road || data.address?.city || 'Unknown',
        static_map_url: `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      };

      setLocation(locationData);
    } catch (error) {
      console.error('Failed to get location:', error);
      alert('Failed to get your location. Please check permissions.');
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const locationData: LocationAttachment = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          place_name: result.name || searchQuery,
          static_map_url: `https://maps.googleapis.com/maps/api/staticmap?center=${result.lat},${result.lon}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${result.lat},${result.lon}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        };

        setLocation(locationData);
      } else {
        alert('Location not found. Try a different search.');
      }
    } catch (error) {
      console.error('Failed to search location:', error);
      alert('Failed to search location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (location) {
      onSelect(location);
      setOpen(false);
      setLocation(null);
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" aria-label="Share location">
            <MapPin className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Location</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
          />
          <Button onClick={searchLocation} disabled={loading || !searchQuery.trim()}>
            Search
          </Button>
        </div>

        {/* Current Location Button */}
        <Button
          onClick={getCurrentLocation}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </>
          )}
        </Button>

        {/* Map Preview */}
        {location && (
          <div className="mt-4 space-y-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {location.static_map_url ? (
                <img
                  src={location.static_map_url}
                  alt="Location map"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">
                {location.place_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {location.address}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>

            <Button onClick={handleSubmit} className="w-full gap-2">
              <Check className="w-4 h-4" />
              Send Location
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

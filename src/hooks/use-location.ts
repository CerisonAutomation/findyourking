'use client';

import { useState, useEffect } from 'react';

interface Location {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(l => ({ ...l, error: 'Geolocation is not supported by your browser.' }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, error: null });
    };

    const onError = (error: GeolocationPositionError) => {
      setLocation(l => ({ ...l, error: error.message }));
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);

  }, []);

  return location;
}

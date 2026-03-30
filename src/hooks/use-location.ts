'use client';

import { useEffect, useState } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

/** Requests the browser geolocation API once and caches the result. */
export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported', loading: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, error: null, loading: false }),
      (err) => setState((s) => ({ ...s, error: err.message, loading: false })),
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  return state;
}

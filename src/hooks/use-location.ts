import { useState, useEffect } from 'react';

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
}

const INITIAL: GeoState = { latitude: null, longitude: null, error: null, isLoading: false };

/**
 * Requests browser geolocation once on mount.
 * Returns null coords if permission denied or unavailable.
 */
export function useLocation(): GeoState {
  const [state, setState] = useState<GeoState>(INITIAL);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true }));

    const id = navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({
          latitude: coords.latitude,
          longitude: coords.longitude,
          error: null,
          isLoading: false,
        });
      },
      (err) => {
        setState({ latitude: null, longitude: null, error: err.message, isLoading: false });
      },
      { timeout: 8_000, maximumAge: 60_000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}

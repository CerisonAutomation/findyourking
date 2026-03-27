"use client";

import {useEffect, useState} from "react";

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    loading: boolean;
}

interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

/**
 * Custom hook for getting the user's geolocation.
 * Handles permissions, errors, and provides loading states.
 *
 * @param options - Geolocation API options
 * @returns Geolocation state with coordinates and loading/error states
 *
 * @example
 * ```tsx
 * const { latitude, longitude, error, loading } = useGeolocation({
 *   enableHighAccuracy: true,
 * });
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <Map lat={latitude} lng={longitude} />;
 * ```
 */
export function useGeolocation(options: GeolocationOptions = {}): GeolocationState {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: "Geolocation is not supported by your browser",
                loading: false,
            }));
            return;
        }

        const onSuccess = (position: GeolocationPosition) => {
            setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                loading: false,
            });
        };

        const onError = (error: GeolocationPositionError) => {
            let errorMessage = "An unknown error occurred";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Location permission denied";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information unavailable";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Location request timed out";
                    break;
            }
            setState((prev) => ({
                ...prev,
                error: errorMessage,
                loading: false,
            }));
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: options.enableHighAccuracy ?? false,
            timeout: options.timeout ?? 10000,
            maximumAge: options.maximumAge ?? 0,
        });
    }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

    return state;
}
// ✅ CORRECT — H3-js Proximity Engine for Location-Based Matching
import {cellToLatLng, gridDisk, latLngToCell} from 'h3-js';

export interface Location {
    lat: number;
    lng: number;
}

export interface UserLocation extends Location {
    userId: string;
    timestamp: Date;
}

export interface ProximityResult {
    userId: string;
    distance: number; // in meters
    location: Location;
}

// Convert GPS to H3 hex cell (resolution 8 = ~461m edge length)
export function locationToHex(lat: number, lng: number, resolution = 8): string {
    return latLngToCell(lat, lng, resolution);
}

// Get all hex cells within N km radius
export function getHexRadius(lat: number, lng: number, km: number, resolution = 8): string[] {
    const center = latLngToCell(lat, lng, resolution);
    // Each step ≈ 461m at res 8. km / 0.461 = ring size
    const rings = Math.ceil(km / 0.461);
    return gridDisk(center, rings);
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

// Find nearby users within radius
export function findNearbyUsers(
    myLocation: Location,
    userLocations: UserLocation[],
    radiusKm: number = 10
): ProximityResult[] {
    const results: ProximityResult[] = [];

    for (const userLoc of userLocations) {
        const distance = calculateDistance(
            myLocation.lat,
            myLocation.lng,
            userLoc.lat,
            userLoc.lng
        );

        if (distance <= radiusKm * 1000) { // Convert km to meters
            results.push({
                userId: userLoc.userId,
                distance,
                location: {
                    lat: userLoc.lat,
                    lng: userLoc.lng
                }
            });
        }
    }

    // Sort by distance (closest first)
    return results.sort((a, b) => a.distance - b.distance);
}

// Group users by H3 hex for efficient clustering
export function clusterUsersByHex(
    userLocations: UserLocation[],
    resolution = 8
): Map<string, string[]> {
    const hexMap = new Map<string, string[]>();

    for (const userLoc of userLocations) {
        const hex = locationToHex(userLoc.lat, userLoc.lng, resolution);
        if (!hexMap.has(hex)) {
            hexMap.set(hex, []);
        }
        hexMap.get(hex)!.push(userLoc.userId);
    }

    return hexMap;
}

// Find users in same or adjacent hex cells (faster proximity check)
export function findNearbyUsersByHex(
    myHex: string,
    userHexMap: Map<string, string[]>,
    maxRings = 2 // ~2km radius at res 8
): string[] {
    const nearbyHexes = gridDisk(myHex, maxRings);
    const nearbyUsers: string[] = [];

    for (const hex of nearbyHexes) {
        const users = userHexMap.get(hex);
        if (users) {
            nearbyUsers.push(...users);
        }
    }

    return [...new Set(nearbyUsers)]; // Remove duplicates
}

// Convert hex to center coordinates
export function hexToLocation(hex: string): Location {
    const [lat, lng] = cellToLatLng(hex);
    return {lat, lng};
}

// Check if location is within bounds
export function isLocationInBounds(
    location: Location,
    bounds: { north: number; south: number; east: number; west: number }
): boolean {
    return (
        location.lat >= bounds.south &&
        location.lat <= bounds.north &&
        location.lng >= bounds.west &&
        location.lng <= bounds.east
    );
}

/**
 * Haversine great-circle distance between two lat/lon points.
 * @returns distance in miles
 */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3_958.8; // Earth radius miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Parse a profile location field into a lat/lon pair, or null.
 */
export function parseProfileLocation(
  location: string | { latitude: number; longitude: number } | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!location) return null;
  if (typeof location === 'object') return location;
  try {
    const parsed = JSON.parse(location) as { latitude?: number; longitude?: number };
    if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
  } catch {
    // not JSON — ignore
  }
  return null;
}

const R_MILES = 3_958.8; // Earth radius in miles

/**
 * Haversine formula — returns distance in miles between two lat/lon points.
 */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_MILES * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Parses a stored location string of the form "lat,lon" or a JSON object.
 * Returns null if the format is unrecognised.
 */
export function parseProfileLocation(
  location: string | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!location) return null;
  try {
    const parsed = JSON.parse(location) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'latitude' in parsed &&
      'longitude' in parsed
    ) {
      return parsed as { latitude: number; longitude: number };
    }
  } catch {
    // Try "lat,lon" format
    const parts = location.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon)) return { latitude: lat, longitude: lon };
    }
  }
  return null;
}

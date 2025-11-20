import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Geolocation Edge Function
 * Uses Vercel's geolocation helper to determine user's location
 * Per Vercel docs: https://vercel.com/docs/functions/edge-functions/vercel-functions-package#geolocation
 */

export async function GET(request: NextRequest) {
  try {
    const geo = geolocation(request);

    // Return detailed geolocation data
    return NextResponse.json({
      success: true,
      location: {
        city: geo.city || 'Unknown',
        region: geo.region || 'Unknown',
        country: geo.country || 'Unknown',
        countryRegion: geo.countryRegion || 'Unknown',
        latitude: geo.latitude || null,
        longitude: geo.longitude || null,
        flag: geo.flag || '🌍',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'Unknown',
      },
    });
  } catch (error) {
    console.error('Geolocation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to determine location',
        location: {
          city: 'Unknown',
          region: 'Unknown',
          country: 'Unknown',
          countryRegion: 'Unknown',
          latitude: null,
          longitude: null,
          flag: '🌍',
        },
      },
      { status: 200 } // Still return 200 with fallback data
    );
  }
}

/**
 * Usage example:
 * 
 * fetch('/api/edge/geolocation')
 *   .then(res => res.json())
 *   .then(data => {
 *     console.log('User location:', data.location);
 *     // Use for distance calculations, timezone detection, etc.
 *   });
 */

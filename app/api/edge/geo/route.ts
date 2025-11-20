/**
 * Edge Function: Geolocation & Distance Calculation
 * Per Vercel Edge Runtime: https://vercel.com/docs/functions/edge-functions
 * Per Next.js Edge Runtime: https://nextjs.org/docs/app/api-reference/edge
 */

import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/edge';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface DistanceRequest {
  targetLat: number;
  targetLng: number;
  maxDistance?: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    // Get user's geolocation from Vercel Edge
    const geo = geolocation(request);
    
    return NextResponse.json({
      success: true,
      location: {
        city: geo.city,
        country: geo.country,
        region: geo.region,
        latitude: geo.latitude,
        longitude: geo.longitude,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get geolocation'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DistanceRequest = await request.json();
    const geo = geolocation(request);
    
    if (!geo.latitude || !geo.longitude) {
      return NextResponse.json({
        success: false,
        error: 'Geolocation not available'
      }, { status: 400 });
    }
    
    const distance = calculateDistance(
      parseFloat(geo.latitude),
      parseFloat(geo.longitude),
      body.targetLat,
      body.targetLng
    );
    
    const withinRange = body.maxDistance ? distance <= body.maxDistance : true;
    
    return NextResponse.json({
      success: true,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      unit: 'km',
      withinRange,
      userLocation: {
        lat: geo.latitude,
        lng: geo.longitude,
        city: geo.city,
        country: geo.country,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate distance'
    }, { status: 500 });
  }
}

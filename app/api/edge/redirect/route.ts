/**
 * Edge Function: Smart Redirects & URL Shortener
 * Per Next.js Redirects: https://nextjs.org/docs/app/api-reference/next-config-js/redirects
 */

import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/edge';

export const runtime = 'edge';

// In production, use KV/Redis for redirect mappings
const redirectMap = new Map<string, {
  destination: string;
  permanent: boolean;
  geoRestricted?: string[];
  expiresAt?: number;
  clicks?: number;
}>();

// Initialize example redirects
redirectMap.set('promo-2024', {
  destination: '/pricing?promo=winter2024',
  permanent: false,
  expiresAt: new Date('2024-12-31').getTime(),
});

redirectMap.set('signup', {
  destination: '/auth/sign-up',
  permanent: false,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams, pathname } = new URL(request.url);
    const shortCode = searchParams.get('code') || pathname.split('/').pop();
    
    if (!shortCode) {
      return NextResponse.json({
        success: false,
        error: 'Short code required'
      }, { status: 400 });
    }
    
    const redirect = redirectMap.get(shortCode);
    
    if (!redirect) {
      return NextResponse.json({
        success: false,
        error: 'Redirect not found'
      }, { status: 404 });
    }
    
    if (redirect.expiresAt && Date.now() > redirect.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Redirect expired'
      }, { status: 410 });
    }
    
    if (redirect.geoRestricted) {
      const geo = geolocation(request);
      if (!redirect.geoRestricted.includes(geo.country || '')) {
        return NextResponse.json({
          success: false,
          error: 'Not available in your region'
        }, { status: 403 });
      }
    }
    
    if (redirect.clicks !== undefined) {
      redirect.clicks++;
    }
    
    return NextResponse.redirect(
      new URL(redirect.destination, request.url),
      { status: redirect.permanent ? 308 : 307 }
    );
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Redirect failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortCode, destination, permanent = false, geoRestricted, expiresAt } = body;
    
    if (!shortCode || !destination) {
      return NextResponse.json({
        success: false,
        error: 'shortCode and destination required'
      }, { status: 400 });
    }
    
    try {
      new URL(destination, request.url);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid destination URL'
      }, { status: 400 });
    }
    
    redirectMap.set(shortCode, {
      destination,
      permanent,
      geoRestricted,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      clicks: 0,
    });
    
    const shortUrl = `${new URL(request.url).origin}/api/edge/redirect?code=${shortCode}`;
    
    return NextResponse.json({
      success: true,
      shortCode,
      shortUrl,
      destination
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create redirect'
    }, { status: 500 });
  }
}

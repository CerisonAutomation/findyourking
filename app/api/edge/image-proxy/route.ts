/**
 * Edge Function: Image Proxy & Optimization
 * Per Next.js Image Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/images
 * Proxies and optimizes images at the edge
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Allowed domains for image proxying (security)
const ALLOWED_DOMAINS = [
  'images.unsplash.com',
  'supabase.co',
  'cloudinary.com',
  'googleusercontent.com',
];

function isAllowedDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : 75;
    
    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'url parameter required'
      }, { status: 400 });
    }
    
    // Security: Only allow whitelisted domains
    if (!isAllowedDomain(imageUrl)) {
      return NextResponse.json({
        success: false,
        error: 'Domain not allowed'
      }, { status: 403 });
    }
    
    // Validate quality
    if (quality < 1 || quality > 100) {
      return NextResponse.json({
        success: false,
        error: 'Quality must be between 1 and 100'
      }, { status: 400 });
    }
    
    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'FindYourKing-ImageProxy/1.0',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch image'
      }, { status: response.status });
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'URL is not an image'
      }, { status: 400 });
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=31536000, immutable',
        'X-Image-Proxy': 'edge',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Image proxy failed'
    }, { status: 500 });
  }
}

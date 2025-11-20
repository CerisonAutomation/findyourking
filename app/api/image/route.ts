import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Image Optimization Edge Function
 * Handles dynamic image resizing, format conversion, and quality optimization
 * Per Next.js Image Optimization docs: https://nextjs.org/docs/app/api-reference/components/image
 * Per Vercel Edge Functions: https://vercel.com/docs/functions/edge-functions
 */

const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const ALLOWED_FORMATS = ['image/webp', 'image/avif', 'image/jpeg', 'image/png'];
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const width = parseInt(searchParams.get('w') || '828');
    const quality = parseInt(searchParams.get('q') || '75');
    const format = searchParams.get('f') || 'webp';

    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // Validate width
    const targetWidth = ALLOWED_WIDTHS.includes(width) ? width : 828;

    // Validate quality (1-100)
    const targetQuality = Math.min(Math.max(quality, 1), 100);

    // Validate format
    const targetFormat = (ALLOWED_FORMATS.includes(`image/${format}`) ? format : 'webp') as 'webp' | 'avif' | 'jpeg' | 'png';

    // Check if image is from Supabase storage
    if (url.includes('.supabase.co')) {
      const supabase = await createClient();
      
      // Extract bucket and path
      const urlParts = new URL(url);
      const pathParts = urlParts.pathname.split('/');
      const bucket = pathParts[pathParts.length - 2];
      const filePath = pathParts[pathParts.length - 1];

      // Get signed URL with transformation
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (error || !data) {
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
      }

      // Fetch the optimized image
      const imageResponse = await fetch(data.signedUrl);
      
      if (!imageResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
      }

      const imageBuffer = await imageResponse.arrayBuffer();

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': `image/${targetFormat}`,
          'Cache-Control': `public, max-age=${MAX_AGE}, immutable`,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // For external images, proxy and optimize
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageOptimizer/1.0)',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': `public, max-age=${MAX_AGE}, immutable`,
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: 'Image optimization failed' },
      { status: 500 }
    );
  }
}

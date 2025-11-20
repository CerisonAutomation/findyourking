import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * On-Demand Revalidation Edge Function
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation
 * Allows triggering cache revalidation via API
 */

export async function POST(request: NextRequest) {
  try {
    // Verify secret token for security
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATION_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: type and value' },
        { status: 400 }
      );
    }

    if (type === 'path') {
      // Revalidate by path
      revalidatePath(value, 'page');
      return NextResponse.json({
        success: true,
        message: `Path ${value} revalidated`,
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'tag') {
      // Revalidate by tag  
      revalidateTag(value, 'page');
      return NextResponse.json({
        success: true,
        message: `Tag ${value} revalidated`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "path" or "tag"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}

/**
 * Usage example:
 * 
 * curl -X POST http://localhost:3000/api/edge/revalidate \
 *   -H "Authorization: Bearer YOUR_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"type": "path", "value": "/matches"}'
 * 
 * curl -X POST http://localhost:3000/api/edge/revalidate \
 *   -H "Authorization: Bearer YOUR_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"type": "tag", "value": "user-profile"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Analytics Event Tracking Edge Function
 * Lightweight edge analytics for tracking user behavior
 * Per Vercel Edge Functions best practices
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEvent = await request.json();
    const { event, properties = {}, timestamp = new Date().toISOString() } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event name required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get user if authenticated (optional)
    const { data: { user } } = await supabase.auth.getUser();

    // Extract metadata from request
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for') || '';

    // Store event in database
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event,
        user_id: user?.id || null,
        properties,
        user_agent: userAgent,
        referer,
        ip_address: ip,
        created_at: timestamp,
      });

    if (error) {
      console.error('Analytics error:', error);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Always return success to not block user actions
    return NextResponse.json({ success: true }, { status: 202 });
  }
}

/**
 * Usage example:
 * 
 * // Track page view
 * fetch('/api/edge/analytics', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     event: 'page_view',
 *     properties: {
 *       path: window.location.pathname,
 *       referrer: document.referrer,
 *     },
 *   }),
 * });
 * 
 * // Track user action
 * fetch('/api/edge/analytics', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     event: 'button_click',
 *     properties: {
 *       button_id: 'signup',
 *       location: 'hero',
 *     },
 *   }),
 * });
 */

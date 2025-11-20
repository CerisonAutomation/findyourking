/**
 * Edge Function: Feature Flags (Simplified without Edge Config)
 * Per Next.js Edge Runtime: https://nextjs.org/docs/app/api-reference/edge
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface FeatureFlag {
  enabled: boolean;
  rollout?: number;
  userIds?: string[];
  geoTargeting?: string[];
  description?: string;
}

interface FeatureFlagsConfig {
  [key: string]: FeatureFlag;
}

// Default feature flags (in production, use Edge Config or KV)
const DEFAULT_FLAGS: FeatureFlagsConfig = {
  'ai_boyfriend': {
    enabled: true,
    description: 'AI Boyfriend feature',
    rollout: 100
  },
  'video_calls': {
    enabled: true,
    description: 'Video calling',
    rollout: 100
  },
  'premium_matches': {
    enabled: true,
    description: 'Premium match algorithm',
    rollout: 50
  },
  'dark_mode': {
    enabled: true,
    description: 'Dark mode theme',
    rollout: 100
  }
};

function isInRollout(userId: string, rollout: number): boolean {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 100) < rollout;
}

function evaluateFlag(flag: FeatureFlag, userId: string, country: string): boolean {
  if (!flag.enabled) return false;
  if (flag.userIds && flag.userIds.length > 0) {
    return flag.userIds.includes(userId);
  }
  if (flag.geoTargeting && flag.geoTargeting.length > 0) {
    if (!flag.geoTargeting.includes(country)) return false;
  }
  if (flag.rollout !== undefined) {
    return isInRollout(userId, flag.rollout);
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const featureKey = searchParams.get('feature');
    const country = request.headers.get('x-vercel-ip-country') || 'US';
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId required'
      }, { status: 400 });
    }
    
    const flags = DEFAULT_FLAGS;
    
    if (featureKey) {
      const flag = flags[featureKey];
      if (!flag) {
        return NextResponse.json({
          success: false,
          error: 'Feature not found'
        }, { status: 404 });
      }
      
      const enabled = evaluateFlag(flag, userId, country);
      
      return NextResponse.json({
        success: true,
        feature: featureKey,
        enabled,
        description: flag.description
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
      });
    }
    
    const evaluatedFlags: Record<string, boolean> = {};
    for (const [key, flag] of Object.entries(flags)) {
      evaluatedFlags[key] = evaluateFlag(flag, userId, country);
    }
    
    return NextResponse.json({
      success: true,
      features: evaluatedFlags
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get feature flags'
    }, { status: 500 });
  }
}

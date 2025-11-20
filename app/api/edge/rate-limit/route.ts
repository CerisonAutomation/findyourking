/**
 * Edge Function: Advanced Rate Limiting
 * Per Vercel Edge Docs: https://vercel.com/docs/functions/edge-functions/vercel-edge-package
 * Uses sliding window with multiple tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ipAddress } from '@vercel/edge';

export const runtime = 'edge';

// In-memory store for edge runtime (use KV/Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  tier?: 'free' | 'premium' | 'enterprise';
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  free: { requests: 10, windowMs: 60000 }, // 10 req/min
  premium: { requests: 100, windowMs: 60000 }, // 100 req/min
  enterprise: { requests: 1000, windowMs: 60000 }, // 1000 req/min
};

function checkRateLimit(identifier: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;
  const record = rateLimitStore.get(key);
  
  // Clean up expired records
  if (record && now > record.resetAt) {
    rateLimitStore.delete(key);
  }
  
  const currentRecord = rateLimitStore.get(key);
  
  if (!currentRecord) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetAt: now + config.windowMs
    };
  }
  
  if (currentRecord.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentRecord.resetAt
    };
  }
  
  currentRecord.count++;
  return {
    allowed: true,
    remaining: config.requests - currentRecord.count,
    resetAt: currentRecord.resetAt
  };
}

export async function GET(request: NextRequest) {
  try {
    const ip = ipAddress(request) || 'unknown';
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get('tier') as 'free' | 'premium' | 'enterprise') || 'free';
    const userId = searchParams.get('userId');
    
    const identifier = userId || ip;
    const config = TIER_LIMITS[tier];
    
    const result = checkRateLimit(identifier, config);
    
    const headers = {
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    };
    
    if (!result.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      }, {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString()
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      allowed: true,
      remaining: result.remaining,
      resetAt: result.resetAt
    }, { headers });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Rate limit check failed'
    }, { status: 500 });
  }
}

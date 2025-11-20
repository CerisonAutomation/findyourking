/**
 * Edge Function: Health Check & Monitoring
 * Per Vercel Edge: https://vercel.com/docs/functions/edge-functions
 * Provides health status at edge for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/edge';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  region: string;
  uptime: number;
  version: string;
  checks: {
    edge: boolean;
    geolocation: boolean;
    headers: boolean;
  };
}

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const now = Date.now();
  const uptime = Math.floor((now - startTime) / 1000);
  
  const geo = geolocation(request);
  
  // Perform health checks
  const checks = {
    edge: true, // If this is running, edge is working
    geolocation: !!(geo.country && geo.city),
    headers: request.headers.has('user-agent'),
  };
  
  const allHealthy = Object.values(checks).every(Boolean);
  const status: HealthStatus['status'] = allHealthy ? 'healthy' : 
    Object.values(checks).filter(Boolean).length >= 2 ? 'degraded' : 'unhealthy';
  
  const health: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    region: geo.region || 'unknown',
    uptime,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    checks,
  };
  
  return NextResponse.json(health, {
    status: status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Status': status,
    }
  });
}

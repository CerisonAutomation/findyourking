/**
 * Edge Function: Bot & Security Detection
 * Per Vercel Edge: https://vercel.com/docs/functions/edge-functions/vercel-edge-package#headers
 * Detects bots, scrapers, and malicious traffic at the edge
 */

import { NextRequest, NextResponse } from 'next/server';
import { ipAddress, geolocation } from '@vercel/edge';

export const runtime = 'edge';

// Known bot patterns (extend as needed)
const BOT_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /headless/i,
];

// Suspicious header combinations
const SUSPICIOUS_PATTERNS = {
  missingUserAgent: (req: NextRequest) => !req.headers.get('user-agent'),
  missingAccept: (req: NextRequest) => !req.headers.get('accept'),
  suspiciousReferer: (req: NextRequest) => {
    const referer = req.headers.get('referer');
    return referer && (referer.includes('viagra') || referer.includes('casino'));
  },
};

interface SecurityAnalysis {
  isBot: boolean;
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number; // 0-100
  action: 'allow' | 'challenge' | 'block';
}

function analyzeRequest(request: NextRequest): SecurityAnalysis {
  const reasons: string[] = [];
  let riskScore = 0;
  
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check for known bots
  const isBot = BOT_USER_AGENTS.some(pattern => pattern.test(userAgent));
  if (isBot) {
    reasons.push('Known bot user agent');
    riskScore += 30;
  }
  
  // Check suspicious patterns
  if (SUSPICIOUS_PATTERNS.missingUserAgent(request)) {
    reasons.push('Missing user agent');
    riskScore += 40;
  }
  
  if (SUSPICIOUS_PATTERNS.missingAccept(request)) {
    reasons.push('Missing Accept header');
    riskScore += 20;
  }
  
  if (SUSPICIOUS_PATTERNS.suspiciousReferer(request)) {
    reasons.push('Suspicious referer');
    riskScore += 50;
  }
  
  // Check for unusual header combinations
  const hasSecFetchSite = request.headers.has('sec-fetch-site');
  const hasSecFetchMode = request.headers.has('sec-fetch-mode');
  const hasSecFetchDest = request.headers.has('sec-fetch-dest');
  
  const hasBrowserHeaders = hasSecFetchSite && hasSecFetchMode && hasSecFetchDest;
  if (!hasBrowserHeaders && !isBot) {
    reasons.push('Missing browser security headers');
    riskScore += 25;
  }
  
  // Determine action based on risk score
  let action: 'allow' | 'challenge' | 'block' = 'allow';
  if (riskScore >= 70) {
    action = 'block';
  } else if (riskScore >= 40) {
    action = 'challenge';
  }
  
  return {
    isBot,
    isSuspicious: riskScore > 0,
    reasons,
    riskScore,
    action
  };
}

export async function GET(request: NextRequest) {
  try {
    const ip = ipAddress(request) || 'unknown';
    const geo = geolocation(request);
    const analysis = analyzeRequest(request);
    
    return NextResponse.json({
      success: true,
      ip,
      location: {
        country: geo.country,
        city: geo.city,
        region: geo.region,
      },
      userAgent: request.headers.get('user-agent'),
      security: analysis,
      timestamp: new Date().toISOString(),
    }, {
      status: analysis.action === 'block' ? 403 : 200,
      headers: {
        'X-Security-Score': analysis.riskScore.toString(),
        'X-Security-Action': analysis.action,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Security check failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, behavior } = body;
    
    // Analyze client-side fingerprint and behavior
    let riskScore = 0;
    const reasons: string[] = [];
    
    // Check for automation tools
    if (behavior?.webdriver) {
      reasons.push('WebDriver detected');
      riskScore += 50;
    }
    
    if (behavior?.phantom || behavior?.selenium) {
      reasons.push('Automation framework detected');
      riskScore += 60;
    }
    
    // Check for missing browser features
    if (!behavior?.plugins || behavior.plugins.length === 0) {
      reasons.push('No browser plugins');
      riskScore += 20;
    }
    
    return NextResponse.json({
      success: true,
      riskScore,
      reasons,
      action: riskScore >= 70 ? 'block' : riskScore >= 40 ? 'challenge' : 'allow'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fingerprint analysis failed'
    }, { status: 500 });
  }
}

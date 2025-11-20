/**
 * Edge Function: A/B Testing
 * Per Next.js Edge Runtime: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface ABTestConfig {
  enabled: boolean;
  variants: {
    [key: string]: {
      weight: number;
      features: Record<string, any>;
    };
  };
}

const DEFAULT_EXPERIMENTS: Record<string, ABTestConfig> = {
  'pricing_page': {
    enabled: true,
    variants: {
      'control': {
        weight: 50,
        features: {
          layout: 'classic',
          showAnnualDiscount: false
        }
      },
      'variant_a': {
        weight: 50,
        features: {
          layout: 'modern',
          showAnnualDiscount: true
        }
      }
    }
  },
  'onboarding_flow': {
    enabled: true,
    variants: {
      'control': {
        weight: 70,
        features: {
          steps: 3,
          skipProfile: false
        }
      },
      'variant_b': {
        weight: 30,
        features: {
          steps: 5,
          skipProfile: true
        }
      }
    }
  }
};

function hashUserId(userId: string, experiment: string): number {
  let hash = 0;
  const str = `${userId}:${experiment}`;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash);
}

function assignVariant(userId: string, experiment: string, config: ABTestConfig): string {
  const hash = hashUserId(userId, experiment);
  const total = Object.values(config.variants).reduce((sum, v) => sum + v.weight, 0);
  const normalized = (hash % total) / total;
  
  let cumulative = 0;
  for (const [variant, { weight }] of Object.entries(config.variants)) {
    cumulative += weight / total;
    if (normalized < cumulative) {
      return variant;
    }
  }
  
  return Object.keys(config.variants)[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const experiment = searchParams.get('experiment') || 'default';
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId required'
      }, { status: 400 });
    }
    
    const config = DEFAULT_EXPERIMENTS[experiment];
    
    if (!config || !config.enabled) {
      return NextResponse.json({
        success: true,
        variant: 'control',
        features: {}
      });
    }
    
    const variant = assignVariant(userId, experiment, config);
    const features = config.variants[variant]?.features || {};
    
    return NextResponse.json({
      success: true,
      experiment,
      variant,
      features
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get A/B test variant'
    }, { status: 500 });
  }
}

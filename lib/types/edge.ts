/**
 * Edge Function Types
 * Per Next.js Edge Runtime: https://nextjs.org/docs/app/api-reference/edge
 * Per Vercel Edge: https://vercel.com/docs/functions/edge-functions
 */

// Geolocation Types
export interface GeolocationData {
  city?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
}

export interface DistanceCalculation {
  distance: number;
  unit: 'km' | 'mi';
  withinRange: boolean;
  userLocation: {
    lat: string;
    lng: string;
    city?: string;
    country?: string;
  };
}

// Rate Limiting Types
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitTier {
  requests: number;
  windowMs: number;
  tier: 'free' | 'premium' | 'enterprise';
}

// Security Types
export interface SecurityAnalysis {
  isBot: boolean;
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
  action: 'allow' | 'challenge' | 'block';
}

export interface BehaviorFingerprint {
  webdriver?: boolean;
  phantom?: boolean;
  selenium?: boolean;
  plugins?: string[];
  languages?: string[];
  timezone?: string;
}

// Feature Flags Types
export interface FeatureFlag {
  enabled: boolean;
  rollout?: number;
  userIds?: string[];
  geoTargeting?: string[];
  description?: string;
}

export interface FeatureFlagsResponse {
  features: Record<string, boolean>;
}

// A/B Testing Types
export interface ABTestVariant {
  weight: number;
  features: Record<string, any>;
}

export interface ABTestConfig {
  enabled: boolean;
  variants: Record<string, ABTestVariant>;
}

export interface ABTestResult {
  experiment: string;
  variant: string;
  features: Record<string, any>;
}

// Health Check Types
export interface HealthStatus {
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

// Redirect Types
export interface RedirectConfig {
  destination: string;
  permanent: boolean;
  geoRestricted?: string[];
  expiresAt?: number;
  clicks?: number;
}

export interface ShortLinkResponse {
  shortCode: string;
  shortUrl: string;
  destination: string;
}

// Image Proxy Types
export interface ImageProxyParams {
  url: string;
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

// Response Types
export interface EdgeSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp?: string;
}

export interface EdgeErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type EdgeResponse<T = any> = EdgeSuccessResponse<T> | EdgeErrorResponse;

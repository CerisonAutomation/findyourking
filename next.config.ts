import type { NextConfig } from "next";

/**
 * Next.js configuration with environment-aware security headers and optimization
 * Per Next.js docs: https://nextjs.org/docs/app/api-reference/next-config-js
 * Security headers per OWASP: https://owasp.org/www-project-secure-headers/
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "imljzgcuelzzzncfzlnc.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment-aware security headers
  async headers() {
    // Base CSP directives that work for both HTTP and HTTPS
    const cspDirectives = [
      "default-src 'self'",
      // Use nonce-based CSP in production, unsafe-inline in dev for HMR
      isDevelopment
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.stream.io https://getstream.io https://vercel.live"
        : "script-src 'self' 'unsafe-eval' https://cdn.stream.io https://getstream.io https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      // Enhanced font-src to support next/font and common CDNs
      "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com https://r2cdn.perplexity.ai",
      // Enhanced connect-src with proper CSP syntax (no wildcards in IP ranges)
      "connect-src 'self' https://*.supabase.co https://*.stream-io-api.com https://getstream.io wss://*.supabase.co wss://*.stream-io-api.com https://vercel.live" +
        (isDevelopment ? " ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*" : ""),
      "media-src 'self' https: blob:",
      "object-src 'none'",
      "frame-src 'self' https://vercel.live",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "worker-src 'self' blob:",
    ];

    // Only add upgrade-insecure-requests in production
    if (isProduction) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()'
          },
          // HSTS - Only in production to avoid localhost HTTPS issues
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }] : [])
        ]
      }
    ];
  },

  // Enable React strict mode for development
  reactStrictMode: true,

  // Reduce production bundle size
  compiler: {
    removeConsole: isProduction ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Production optimization
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
};

export default nextConfig;

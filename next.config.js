/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ─── Turbopack / Bundler ────────────────────────────────────────────────────
  serverExternalPackages: ['express', 'import-in-the-middle', 'require-in-the-middle'],

  // ─── Compiler ───────────────────────────────────────────────────────────────
  compiler: {
    // Remove console.* in production (keep console.error)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // ─── Partial Prerendering (Next.js 16: ppr merged into cacheComponents) ─────
  cacheComponents: true,

  // ─── Experimental ───────────────────────────────────────────────────────────
  experimental: {
    // Inline CSS into SSR HTML to eliminate render-blocking requests
    inlineCss: true,
  },

  // ─── Images ─────────────────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },

  // ─── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://images.unsplash.com https://lh3.googleusercontent.com https://picsum.photos",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://firestore.googleapis.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ─── TypeScript ──────────────────────────────────────────────────────────────
  typescript: {
    // TODO: remove once all type errors are resolved
    ignoreBuildErrors: true,
  },

  // ─── ESLint ──────────────────────────────────────────────────────────────────
  eslint: {
    // Prevent ESLint from blocking production builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

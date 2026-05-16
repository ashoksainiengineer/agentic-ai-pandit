/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // ═══════════════════════════════════════════════════════════════════════════════
  // IMAGE OPTIMIZATION (PERF1)
  // ═══════════════════════════════════════════════════════════════════════════════
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/webp', 'image/avif'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.jsdelivr.net data:;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/npm/simple-icons/**',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPERIMENTAL FEATURES
  // ═══════════════════════════════════════════════════════════════════════════════
  experimental: {
    // cpus limit removed for faster builds (PERF7)
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      'date-fns',
      'react-markdown',
      'recharts',
      '@tanstack/react-virtual',
    ],
  },

  webpack: (config) => {
    // Resolve strict ESM `.js` imports to `.ts` files on disk
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // PRODUCTION SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════════
  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEADERS - PERFORMANCE & SECURITY
  // ═══════════════════════════════════════════════════════════════════════════════
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts for 1 year
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images for 30 days
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Health check endpoints - no cache for accurate status
        source: '/api/health',
        headers: [
          {
            key: 'Cache-control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        // Ping endpoint - minimal cache for warmup
        source: '/api/ping',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'X-Ping-Endpoint',
            value: 'true',
          },
        ],
      },
    ];
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // REWRITES - API ROUTING
  // ═══════════════════════════════════════════════════════════════════════════════
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;

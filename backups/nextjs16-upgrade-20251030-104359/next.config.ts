import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        // Content Security Policy (CSP)
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // HTTP Strict Transport Security (HSTS)
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // Enable React strict mode for better security
  reactStrictMode: true,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },

  // Bundle optimization configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting for better caching
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Separate heavy UI libraries
        'radix-ui': {
          test: /[\\/]node_modules[\\/](@radix-ui|@radix-theme)/,
          name: 'radix-ui',
          chunks: 'all',
          priority: 20,
        },
        // Separate Supabase and tRPC
        'supabase': {
          test: /[\\/]node_modules[\\/](@supabase|@trpc)/,
          name: 'supabase-trpc',
          chunks: 'all',
          priority: 15,
        },
        // Separate UI libraries
        'ui-libs': {
          test: /[\\/]node_modules[\\/](lucide-react|clsx|tailwind-merge|class-variance-authority)/,
          name: 'ui-libs',
          chunks: 'all',
          priority: 10,
        },
      };
    }

    return config;
  },
};

export default nextConfig;

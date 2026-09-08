import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // /api/og draws social cards on the site's own photographs, read from disk
  // (see src/app/api/og/route.tsx); the tracer cannot see a path built at
  // runtime, so the folder is named here or the deployed function has no photos.
  outputFileTracingIncludes: {
    "/api/og": ["./public/images/albania/**/*"],
  },
  onDemandEntries: {
    // Keep pages in memory longer in dev to reduce manifest churn/races.
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 10,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        // Polling is more stable on Windows and network/virtualized filesystems.
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/.git/**', '**/node_modules/**', '**/.next/**'],
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);

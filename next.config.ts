import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Sanity serves the original bytes unless asked otherwise, so the loader in
    // src/lib/images/loader.ts appends the CDN's own resize/format parameters
    // and lets next/image build a real srcset from `sizes`.
    loaderFile: "./src/lib/images/loader.ts",
    formats: ["image/avif", "image/webp"],
    // Next's default is eight candidates up to 3840px, and every `sizes` given
    // in vw units emits all of them — 1.5 KB of `srcset` per image, which on a
    // listing page was 422 KB of the HTML document. Six candidates cover the
    // real layouts; the widest is a full-bleed hero on a retina laptop.
    deviceSizes: [640, 750, 828, 1080, 1920, 2560],
  },
  // /api/og draws social cards on the site's own photographs, read from disk
  // (see src/app/api/og/route.tsx); the tracer cannot see a path built at
  // runtime, so the folder is named here or the deployed function has no photos.
  outputFileTracingIncludes: {
    "/api/og": ["./public/images/albania/**/*"],
  },
  // IndexNow verifies ownership by reading a plain-text file on the host. The
  // source is deliberately narrow — `/indexnow-*.txt` cannot shadow
  // `robots.txt` or any `sitemap-*.xml`, which a `/:file.txt` catch-all would.
  async rewrites() {
    return [
      {
        source: "/indexnow-:key.txt",
        destination: "/api/indexnow-key",
      },
    ];
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

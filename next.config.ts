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
  // Baseline security headers (audit 2026-09-20: only HSTS was present).
  // `frame-ancestors` rather than X-Frame-Options: Sanity Studio's Presentation
  // tool previews the site inside an iframe, and X-Frame-Options has no way to
  // name a second allowed parent. No script-src policy here on purpose: GTM,
  // Clarity and the map load third-party code, and a wrong allowlist breaks
  // them silently in production.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Vercel sets `max-age` alone; `includeSubDomains` closes the door
          // on a plain-http subdomain ever being served. `preload` is left
          // off: it is a submission to the browsers' list, not a header, and
          // cannot be undone quickly.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://*.sanity.studio" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=()" },
        ],
      },
    ];
  },
  // The project's production alias served the whole site as a second copy:
  // 485 requests a day on 2026-09-19, crawlers included. Only this exact
  // host moves; per-deployment preview URLs keep working.
  async redirects() {
    return [
      {
        // /api/ stays put: Vercel Cron calls the production URL and does not
        // follow redirects.
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "your-house-albania.vercel.app" }],
        destination: "https://www.domlivo.com/:path",
        permanent: true,
      },
      // The four demo listings of 4 May 2026 (three in Vlorë, one in Sarandë)
      // were deleted on 30.09.2026 after collecting clicks under every locale's
      // slug. Each old address goes to its city's listing page instead of a
      // 404, so the clicks and whatever Google credited them with stay with
      // the site. Drop these once Search Console stops showing the old URLs.
      {
        source: "/:locale(en|uk|ru|sq|it|pl|de)/property/:slug(prodaetsya-bolshaya-kvartira-1-1-vo-vlere|wohnung-1-1-stadtzentrum-vlora-74m2|apartment-1-1-city-center-vlore-74m2|appartamento-1-1-centro-citta-valona-74m2|mieszkanie-1-1-centrum-miasta-vlora-74m2|kvartira-1-1-tsentr-vlera-74m2|apartament-1-1-city-center-vlore-74m2|kvartyra-1-1-tsentr-vlora-74m2|prodazha-doma-vo-vlere|haus-stadtzentrum-vlora-109m2|house-city-center-vlore-109m2|casa-centro-citta-valona-109m2|dom-centrum-miasta-vlora-109m2|dom-tsentr-vlera-109m2|shtepi-city-center-vlore-109m2|budynok-tsentr-vlora-109m2|prodazha-uyutnoy-kvartiry-1-1-u-gory|wohnung-1-1-stadtzentrum-vlora-49m2|apartment-1-1-city-center-vlore-49m2|appartamento-1-1-centro-citta-valona-49m2|mieszkanie-1-1-centrum-miasta-vlora-49m2|kvartira-1-1-tsentr-vlera-49m2|apartament-1-1-city-center-vlore-49m2|kvartyra-1-1-tsentr-vlora-49m2)",
        destination: "/:locale/albania/vlore",
        permanent: true,
      },
      {
        source: "/:locale(en|uk|ru|sq|it|pl|de)/property/:slug(prodazha-novostroya-investicionnyy-obekt-v-sarande|wohnung-2-1-stadtzentrum-saranda-117m2|apartment-2-1-city-center-sarande-117m2|appartamento-2-1-centro-citta-saranda-117m2|mieszkanie-2-1-centrum-miasta-saranda-117m2|kvartira-2-1-tsentr-saranda-117m2|apartament-2-1-city-center-sarande-117m2|kvartyra-2-1-tsentr-saranda-117m2)",
        destination: "/:locale/albania/sarande",
        permanent: true,
      },
    ];
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

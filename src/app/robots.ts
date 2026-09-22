import type { MetadataRoute } from "next";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

/**
 * Link-preview fetchers. They draw the card from `og:image`, which is
 * `/api/og`, so they are the only agents allowed under `/api/`.
 */
const PREVIEW_BOTS = [
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
  "WhatsApp",
];

/**
 * Crawlers that cost Fluid CPU and ISR writes and bring nothing back: no
 * search listing, no citation. On 2026-09-19 GoogleOther (Google's research
 * crawler, not Search), KeenableBot and Amazonbot alone made 9.2K of the
 * site's 28.4K requests in a day, with the Hobby team 2.7x over its CPU.
 */
const BLOCKED_BOTS = [
  "GoogleOther",
  "GoogleOther-Image",
  "GoogleOther-Video",
  "KeenableBot",
  "Amazonbot",
  "Bytespider",
  "PetalBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "SemrushBot",
  "barkrowler",
];

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  const base = getSiteBaseUrl();
  return {
    rules: [
      // `/api/og` renders a 1200x630 card at ~0.6s of CPU each, and crawlers
      // were fetching it 3.2K times a day as if it were page content.
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: PREVIEW_BOTS, allow: "/" },
      // Kept, since the site's own Ahrefs data depends on it, but slowed: it
      // was a quarter of all traffic.
      { userAgent: "AhrefsBot", allow: "/", disallow: "/api/", crawlDelay: 30 },
      { userAgent: BLOCKED_BOTS, disallow: "/" },
    ],
    // The priority file first: it is the crawler's starting point (see
    // lib/seo/prioritySitemap), and the index lists it first too.
    sitemap: [
      `${base}/sitemap-priority.xml`,
      `${base}/sitemap.xml`,
      `${base}/sitemap-static.xml`,
      `${base}/sitemap-cities.xml`,
      `${base}/sitemap-types.xml`,
      `${base}/sitemap-non-geo-listings.xml`,
      `${base}/sitemap-properties.xml`,
      `${base}/sitemap-blog.xml`,
      `${base}/sitemap-landings.xml`,
      `${base}/sitemap-districts.xml`,
      `${base}/sitemap-knowledge.xml`,
    ],
  };
}

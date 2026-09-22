import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { catalogPath } from "@/lib/routes/catalog";
import { isPublicDealRouteSegment } from "@/lib/catalog/publicDealTypes";
import {
  fetchAllAgentSlugsForSitemap,
  fetchAllLandingPathsForSitemap,
} from "@/lib/sanity/client";
import { buildUrlsetXml, type SitemapUrl } from "@/lib/seo/sitemapXml";
import { buildStaticCodePageEntries } from "@/lib/seo/staticCodePages";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

/**
 * True for an `investment/{deal}` path whose page sets `noindex` because the
 * deal type is not publicly exposed. Uses the same predicate the page does, so
 * opening a deal type to the public puts its URL back in the sitemap with no
 * further change here.
 */
function isNoindexInvestmentPath(path: string): boolean {
  const segment = path.startsWith("investment/") ? path.slice("investment/".length) : null;
  // `investment/sale` is noindexed as a duplicate of the `/sale` hub (see its page).
  return segment !== null && (segment === "sale" || !isPublicDealRouteSegment(segment));
}

function joinLocalePath(base: string, locale: string, path: string): string {
  const clean = base.replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean).map((s) => encodeURIComponent(s));
  return `${clean}/${locale}/${segments.join("/")}`;
}

export async function GET() {
  if (!isIndexingEnabled()) {
    return new NextResponse(buildUrlsetXml([]), {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  const base = getSiteBaseUrl();
  const [agents, landings] = await Promise.all([
    fetchAllAgentSlugsForSitemap(),
    fetchAllLandingPathsForSitemap(),
  ]);

  const seen = new Set<string>();
  const urls: SitemapUrl[] = [];

  const push = (loc: string, lastmod: Date | undefined) => {
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push({ loc, lastmod });
  };

  for (const locale of routing.locales) {
    // The home page has no document of its own to date it. It used to carry
    // the time of the request, i.e. "changed" on every regeneration; no
    // `lastmod` is the honest value.
    push(`${base}/${locale}`, undefined);

    for (const { slug, lastModified } of agents) {
      const path = catalogPath(locale, undefined, undefined, slug);
      push(`${base}${path}`, lastModified);
    }

    for (const { path, lastModified } of landings) {
      // City listing shorthand URLs live in sitemap-cities.xml / sitemap-types; city editorial uses `{country}/{city}/info`.
      if (path.startsWith("cities/")) continue;
      // Guides belong to sitemap-landings.xml, which is the only one of the two
      // that reads `landingPage.locales`. Emitting them here as well listed all
      // 123 guide URLs in two sitemaps at once, and — because this loop pairs
      // every landing with every locale — put the nine Polish-only guides under
      // all six, so 45 of the URLs Google was handed returned 404.
      if (path.startsWith("guides/")) continue;
      // `investment/rent` and `investment/short-term-rent` render `noindex`:
      // their deal types are hidden from the public UI and stay reachable only
      // by direct URL (see `buildDealTypeLandingMetadata`). Listing a page in
      // the sitemap and then telling the crawler not to index it is a
      // contradiction the crawler reports back as an error, so the sitemap
      // follows the same policy the page does.
      if (isNoindexInvestmentPath(path)) continue;
      push(joinLocalePath(base, locale, path), lastModified);
    }
  }

  // Pages that live in code only (/about): one entry per locale, each carrying
  // the whole hreflang set, since no CMS query can discover them.
  for (const entry of buildStaticCodePageEntries(base, routing.locales)) {
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    urls.push(entry);
  }

  const xml = buildUrlsetXml(urls);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

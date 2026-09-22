import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSeoPageDecisions } from "@/lib/sanity/queries/seoPages";
import { fetchPrioritySitemapSources } from "@/lib/sanity/queries/prioritySitemap";
import { nonGeoListingSitemapSegmentAfterLocale, type SitemapSimpleEntry } from "@/lib/sanity/queries/sitemap";
import { isIndexedSeoStatus, seoPagePath } from "@/lib/seo/pages";
import { latestDate, parseDateOrUndefined } from "@/lib/seo/contentLastmod";
import { buildPrioritySitemapUrls } from "@/lib/seo/prioritySitemap";
import { buildUrlsetXml } from "@/lib/seo/sitemapXml";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

/**
 * The pages a crawler should reach first — see `lib/seo/prioritySitemap`.
 * Both fetches are tag-cached (`sanityCache`), so a publish in Studio purges
 * them and the hourly regeneration costs nothing between publishes.
 */
export async function GET() {
  if (!isIndexingEnabled()) {
    return new NextResponse(buildUrlsetXml([]), {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  const base = getSiteBaseUrl();
  const [decisions, sources] = await Promise.all([fetchSeoPageDecisions(), fetchPrioritySitemapSources()]);

  const registryPages: SitemapSimpleEntry[] = [];
  for (const row of decisions ?? []) {
    if (!isIndexedSeoStatus(row.decision.status)) continue;
    registryPages.push({
      segmentAfterLocale: seoPagePath(row.decision.key, "en").replace(/^\/en\//, ""),
      lastModified: parseDateOrUndefined(row.lastModified),
      locales: row.decision.indexableLocales,
    });
  }
  // Every decision row is a page with listings; the newest of them is the
  // newest sale listing on the site, which is when the national hub changed.
  const saleHubLastmod = latestDate(...(decisions ?? []).map((row) => parseDateOrUndefined(row.lastModified)));

  const urls = buildPrioritySitemapUrls({
    base,
    locales: routing.locales,
    registryPages,
    saleHubSegment: nonGeoListingSitemapSegmentAfterLocale("sale"),
    saleHubLastmod,
    cityInfo: sources?.cityInfo ?? [],
    blogPosts: sources?.blogPosts ?? [],
    guides: sources?.guides ?? [],
  });
  return new NextResponse(buildUrlsetXml(urls), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

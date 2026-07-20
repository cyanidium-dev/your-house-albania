import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSitemapDistrictEntries } from "@/lib/sanity/client";
import { districtInfoPath, districtsHubPath } from "@/lib/routes/catalog";
import { buildUrlsetXml } from "@/lib/seo/sitemapXml";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

export async function GET() {
  if (!isIndexingEnabled()) {
    return new NextResponse(buildUrlsetXml([]), {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  const base = getSiteBaseUrl();
  const rows = await fetchSitemapDistrictEntries();

  // Hub `…/districts` pages: one per city with published districts, lastmod = newest district.
  const hubs = new Map<string, { countrySlug: string; citySlug: string; lastModified: Date }>();
  for (const row of rows) {
    const key = `${row.countrySlug}|${row.citySlug}`;
    const prev = hubs.get(key);
    if (!prev || row.lastModified > prev.lastModified) {
      hubs.set(key, {
        countrySlug: row.countrySlug,
        citySlug: row.citySlug,
        lastModified: row.lastModified,
      });
    }
  }

  const urls: Array<{ loc: string; lastmod?: Date }> = [];
  for (const locale of routing.locales) {
    for (const hub of hubs.values()) {
      urls.push({
        loc: `${base}${districtsHubPath(locale, hub.citySlug, hub.countrySlug)}`,
        lastmod: hub.lastModified,
      });
    }
    for (const row of rows) {
      urls.push({
        loc: `${base}${districtInfoPath(locale, row.citySlug, row.slug, row.countrySlug)}`,
        lastmod: row.lastModified,
      });
    }
  }
  const xml = buildUrlsetXml(urls);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

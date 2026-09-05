import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSitemapGuideEntries } from "@/lib/sanity/client";
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
  const rows = await fetchSitemapGuideEntries();
  const urls: Array<{ loc: string; lastmod?: Date }> = [];
  for (const row of rows) {
    // A locale-scoped landing (landingPage.locales) is listed only where it exists.
    const scope = row.locales.length
      ? routing.locales.filter((l) => row.locales.includes(l))
      : routing.locales;
    for (const locale of scope) {
      urls.push({
        loc: `${base}/${locale}/guides/${encodeURIComponent(row.slug)}`,
        lastmod: row.lastModified,
      });
    }
  }
  const xml = buildUrlsetXml(urls);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

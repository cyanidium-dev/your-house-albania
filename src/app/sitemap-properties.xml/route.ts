import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSitemapPropertyEntries } from "@/lib/sanity/client";
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
  const rows = await fetchSitemapPropertyEntries();
  const urls: Array<{ loc: string; lastmod?: Date }> = [];
  for (const locale of routing.locales) {
    for (const row of rows) {
      urls.push({
        loc: `${base}/${locale}/property/${encodeURIComponent(row.slug)}`,
        lastmod: row.lastModified,
      });
    }
  }
  const xml = buildUrlsetXml(urls);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

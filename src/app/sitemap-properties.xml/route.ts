import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSitemapPropertyEntries } from "@/lib/sanity/client";
import { buildUrlsetXml } from "@/lib/seo/sitemapXml";
import { buildPropertySitemapXml } from "@/lib/seo/propertySitemap";
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
  // Photos ride along as <image:image> entries — see lib/seo/propertySitemap.
  const xml = buildPropertySitemapXml({ base, locales: routing.locales, rows });
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

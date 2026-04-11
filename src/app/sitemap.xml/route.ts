import { NextResponse } from "next/server";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { buildSitemapIndexXml } from "@/lib/seo/sitemapXml";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

export async function GET() {
  if (!isIndexingEnabled()) {
    const empty = buildSitemapIndexXml([]);
    return new NextResponse(empty, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  const base = getSiteBaseUrl();
  const paths = [
    "/sitemap-static.xml",
    "/sitemap-cities.xml",
    "/sitemap-types.xml",
    "/sitemap-non-geo-listings.xml",
    "/sitemap-properties.xml",
    "/sitemap-blog.xml",
  ];
  const xml = buildSitemapIndexXml(paths.map((p) => `${base}${p}`));
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

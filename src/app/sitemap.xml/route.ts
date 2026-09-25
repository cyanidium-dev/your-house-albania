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
  // The priority file comes first on purpose: it is the crawler's starting
  // point (see lib/seo/prioritySitemap). Keep it first here and in robots.ts.
  const paths = [
    "/sitemap-priority.xml",
    "/sitemap-static.xml",
    "/sitemap-cities.xml",
    "/sitemap-types.xml",
    "/sitemap-non-geo-listings.xml",
    "/sitemap-properties.xml",
    // The trimmed arm of the locale experiment, in its own file so Search
    // Console reports each arm's indexed share (lib/seo/propertyLocaleExperiment).
    "/sitemap-properties-trimmed.xml",
    "/sitemap-blog.xml",
    "/sitemap-landings.xml",
    "/sitemap-districts.xml",
    "/sitemap-knowledge.xml",
  ];
  const xml = buildSitemapIndexXml(paths.map((p) => `${base}${p}`));
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

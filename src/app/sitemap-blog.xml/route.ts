import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSitemapBlogEntries } from "@/lib/sanity/client";
import { fetchSitemapBlogAuthors } from "@/lib/sanity/queries/blog";
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
  const rows = await fetchSitemapBlogEntries();
  // Active authors with at least one published post. An author page with no
  // articles is a thin page and should not be advertised.
  const authors = await fetchSitemapBlogAuthors();
  const urls: Array<{ loc: string; lastmod?: Date }> = [];
  for (const locale of routing.locales) {
    for (const row of rows) {
      urls.push({
        loc: `${base}/${locale}/blog/${encodeURIComponent(row.slug)}`,
        lastmod: row.lastModified,
      });
    }
    for (const author of authors) {
      urls.push({
        loc: `${base}/${locale}/blog/author/${encodeURIComponent(author.slug)}`,
        lastmod: author.updatedAt ? new Date(author.updatedAt) : undefined,
      });
    }
  }
  const xml = buildUrlsetXml(urls);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

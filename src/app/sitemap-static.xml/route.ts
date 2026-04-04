import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { catalogPath } from "@/lib/routes/catalog";
import {
  fetchAllAgentSlugsForSitemap,
  fetchAllLandingPathsForSitemap,
} from "@/lib/sanity/client";
import { buildUrlsetXml } from "@/lib/seo/sitemapXml";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

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
  const urls: Array<{ loc: string; lastmod: Date }> = [];
  const staticNow = new Date();

  const push = (loc: string, lastmod: Date) => {
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push({ loc, lastmod });
  };

  for (const locale of routing.locales) {
    push(`${base}/${locale}`, staticNow);
    push(`${base}/${locale}/properties`, staticNow);

    for (const { slug, lastModified } of agents) {
      const path = catalogPath(locale, undefined, undefined, slug);
      push(`${base}${path}`, lastModified);
    }

    for (const { path, lastModified } of landings) {
      // City detail URLs are emitted by sitemap-cities.xml; keep only cities index here.
      if (path.startsWith("cities/")) continue;
      push(joinLocalePath(base, locale, path), lastModified);
    }
  }

  const xml = buildUrlsetXml(urls);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

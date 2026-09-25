import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { fetchSitemapPropertyEntries } from "@/lib/sanity/client";
import { buildUrlsetXml } from "@/lib/seo/sitemapXml";
import { buildPropertySitemapXml } from "@/lib/seo/propertySitemap";
import { TRIMMED_LOCALES, propertyExperimentArm } from "@/lib/seo/propertyLocaleExperiment";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

/**
 * Listings of the experiment's *trimmed* arm, in the locales they are still
 * indexed in. Empty once the experiment is over (`TRIMMED_LOCALES` = []),
 * when every listing is in the full arm again. See
 * lib/seo/propertyLocaleExperiment.
 */
export async function GET() {
  if (!isIndexingEnabled()) {
    return new NextResponse(buildUrlsetXml([]), {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  const base = getSiteBaseUrl();
  const rows = (await fetchSitemapPropertyEntries()).filter((row) => propertyExperimentArm(row.slug) === "trimmed");
  const locales = routing.locales.filter((locale) => !TRIMMED_LOCALES.includes(locale));
  const xml = buildPropertySitemapXml({ base, locales, rows });
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

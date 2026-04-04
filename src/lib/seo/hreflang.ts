import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

/**
 * Path after locale, e.g. `/properties`, `/property/foo`, `/blog/bar`, or `""` for homepage.
 * Returns `undefined` when indexing is disabled (no hreflang signals).
 */
export function buildHreflangAlternates(
  path: string
): Pick<NonNullable<Metadata["alternates"]>, "languages"> | undefined {
  if (!isIndexingEnabled()) return undefined;
  const base = getSiteBaseUrl();
  const cleanPath =
    path === "" || path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;

  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${base}/${locale}${cleanPath}`;
  }
  languages["x-default"] = `${base}/en${cleanPath}`;
  return { languages };
}


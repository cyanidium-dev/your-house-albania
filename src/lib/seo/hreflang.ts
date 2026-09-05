import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { getSiteBaseUrl } from "@/lib/siteUrl";

/**
 * Path after locale, e.g. `/properties`, `/property/foo`, `/blog/bar`, or `""` for homepage.
 * Returns `undefined` when indexing is disabled (no hreflang signals).
 */
export function buildHreflangAlternates(
  path: string,
  locales?: readonly string[],
): Pick<NonNullable<Metadata["alternates"]>, "languages"> | undefined {
  if (!isIndexingEnabled()) return undefined;
  const base = getSiteBaseUrl();
  const cleanPath =
    path === "" || path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;

  // A locale-scoped landing (landingPage.locales) declares alternates only for
  // the locales it exists in; x-default follows en when en is among them,
  // otherwise the first listed locale.
  const wanted = locales?.length
    ? routing.locales.filter((l) => locales.includes(l))
    : [...routing.locales];
  if (!wanted.length) return undefined;

  const languages: Record<string, string> = {};
  for (const locale of wanted) {
    languages[locale] = `${base}/${locale}${cleanPath}`;
  }
  const xDefault = wanted.includes("en") ? "en" : wanted[0];
  languages["x-default"] = `${base}/${xDefault}${cleanPath}`;
  return { languages };
}


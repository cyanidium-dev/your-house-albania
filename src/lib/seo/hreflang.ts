import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { isLocalePathIndexable } from "@/lib/seo/localeIndexing";
import { getSiteBaseUrl } from "@/lib/siteUrl";

/**
 * Path after locale, e.g. `/properties`, `/property/foo`, `/blog/bar`, or `""` for homepage.
 * Returns `undefined` when indexing is disabled (no hreflang signals).
 */
export function buildHreflangAlternates(
  path: string,
  locales?: readonly string[],
): Pick<NonNullable<Metadata["alternates"]>, "languages"> | undefined {
  const cleanPath =
    path === "" || path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;
  return buildHreflangAlternatesPerLocale(() => cleanPath, locales);
}

/**
 * Same as `buildHreflangAlternates` for pages whose path differs by locale —
 * a property lives at `/en/property/apartment-…` and `/ru/property/kvartira-…`.
 * `pathFor` returns the path after the locale, starting with `/`.
 */
export function buildHreflangAlternatesPerLocale(
  pathFor: (locale: string) => string,
  locales?: readonly string[],
): Pick<NonNullable<Metadata["alternates"]>, "languages"> | undefined {
  if (!isIndexingEnabled()) return undefined;
  const base = getSiteBaseUrl();

  // A locale-scoped landing (landingPage.locales) declares alternates only for
  // the locales it exists in; x-default follows en when en is among them,
  // otherwise the first listed locale.
  // A partly translated locale drops out where its content is not written yet.
  const wanted = (
    locales?.length
      ? routing.locales.filter((l) => locales.includes(l))
      : [...routing.locales]
  ).filter((l) => isLocalePathIndexable(l, pathFor(l)));
  if (!wanted.length) return undefined;

  const languages: Record<string, string> = {};
  for (const locale of wanted) {
    languages[locale] = `${base}/${locale}${pathFor(locale)}`;
  }
  const xDefault = wanted.includes("en") ? "en" : wanted[0];
  languages["x-default"] = `${base}/${xDefault}${pathFor(xDefault)}`;
  return { languages };
}

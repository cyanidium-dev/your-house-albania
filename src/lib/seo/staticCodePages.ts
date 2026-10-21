import { GERMAN_HUB_LAST_MODIFIED, GERMAN_HUB_LOCALE, GERMAN_HUB_PATH } from "@/lib/germanHub/config";
import { REFERENCE_PRICES_CHECKED_ON, REFERENCE_PRICES_LOCALE, REFERENCE_PRICES_PATH } from "@/lib/referencePrices/data";

/**
 * Indexable pages that exist only in code — no CMS document behind them, so
 * neither the landing query nor the registry can discover them for a sitemap.
 *
 * `sitemap-static.xml` emits each of these once per locale, with the full set
 * of hreflang alternates. Keep `lastModified` honest: it is the date the page's
 * copy last changed, not the date of the build.
 */
export type StaticCodePage = {
  /** Path after the locale, no leading slash. */
  path: string;
  lastModified: string;
  /**
   * The locales the page exists in; every locale when omitted. A page of one
   * market (the German hub) is emitted once, with that locale as its only
   * alternate and as `x-default`, the same way `buildHreflangAlternates`
   * treats a locale-scoped landing.
   */
  locales?: readonly string[];
};

export const STATIC_CODE_PAGES: readonly StaticCodePage[] = [
  { path: "about", lastModified: "2026-09-20" },
  // Missing from every sitemap until the audit of 2026-10-18 (S-17).
  { path: "contacts", lastModified: "2026-10-18" },
  // The Domlivo Price Index methodology; its figures change hourly, its copy rarely.
  { path: "methodology", lastModified: "2026-10-19" },
  // Property prices by city: one table over the live index (AI prompt audit 2026-10-19).
  { path: "prices", lastModified: "2026-10-19" },
  // The German market hub (SEO hypothesis 3, 2026-10-19): German only, see lib/germanHub.
  { path: GERMAN_HUB_PATH, lastModified: GERMAN_HUB_LAST_MODIFIED, locales: [GERMAN_HUB_LOCALE] },
  // Albanian reference prices with a calculator (SEO hypothesis 5, lab E01): Albanian only.
  { path: REFERENCE_PRICES_PATH, lastModified: REFERENCE_PRICES_CHECKED_ON, locales: [REFERENCE_PRICES_LOCALE] },
];

export type StaticCodePageEntry = {
  loc: string;
  lastmod: Date;
  /** hreflang → absolute URL, `x-default` included. */
  alternates: Record<string, string>;
};

export function buildStaticCodePageEntries(
  baseUrl: string,
  locales: readonly string[],
  pages: readonly StaticCodePage[] = STATIC_CODE_PAGES,
): StaticCodePageEntry[] {
  const base = baseUrl.replace(/\/$/, "");
  const entries: StaticCodePageEntry[] = [];
  for (const page of pages) {
    const pageLocales = page.locales ? locales.filter((l) => page.locales!.includes(l)) : locales;
    const alternates: Record<string, string> = {};
    for (const locale of pageLocales) alternates[locale] = `${base}/${locale}/${page.path}`;
    // Same rule as `buildHreflangAlternates`: English when it exists.
    const xDefault = pageLocales.includes("en") ? "en" : pageLocales[0];
    if (xDefault) alternates["x-default"] = `${base}/${xDefault}/${page.path}`;
    for (const locale of pageLocales) {
      entries.push({
        loc: alternates[locale],
        lastmod: new Date(page.lastModified),
        alternates,
      });
    }
  }
  return entries;
}

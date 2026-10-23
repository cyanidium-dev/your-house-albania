import { CALCULATOR_PAGES_LAST_MODIFIED, CALCULATOR_PATHS } from "@/lib/calculatorPages/config";
import { GERMAN_HUB_LAST_MODIFIED, GERMAN_HUB_LOCALE, GERMAN_HUB_PATH } from "@/lib/germanHub/config";
import { REFERENCE_PRICES_CHECKED_ON, REFERENCE_PRICES_LOCALE, REFERENCE_PRICES_PATH } from "@/lib/referencePrices/data";
import { SHENGJIN_HUB_LAST_MODIFIED, SHENGJIN_HUB_PATH } from "@/lib/shengjinHub/config";
import { SEA_HOUSES_LAST_MODIFIED, SEA_HOUSES_LOCALE, SEA_HOUSES_PATH } from "@/lib/seaHouses/config";
import {
  FRENCH_GUIDE_PATHS,
  FRENCH_HUB_PATH,
  FRENCH_PILOT_LAST_MODIFIED,
  FRENCH_PILOT_LOCALE,
} from "@/lib/frenchPilot/config";

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
  // The two calculator pages (link magnets, 2026-10-21), see lib/calculatorPages.
  { path: CALCULATOR_PATHS.purchase, lastModified: CALCULATOR_PAGES_LAST_MODIFIED },
  { path: CALCULATOR_PATHS.rental, lastModified: CALCULATOR_PAGES_LAST_MODIFIED },
  // The Shëngjin hub (2026-10-22): every locale, French through its pilot whitelist, see lib/shengjinHub.
  { path: SHENGJIN_HUB_PATH, lastModified: SHENGJIN_HUB_LAST_MODIFIED },
  // The German market hub (SEO hypothesis 3, 2026-10-19): German only, see lib/germanHub.
  { path: GERMAN_HUB_PATH, lastModified: GERMAN_HUB_LAST_MODIFIED, locales: [GERMAN_HUB_LOCALE] },
  // Houses and villas by the sea for German buyers (long-tail plan F2, 2026-10-24): German only, see lib/seaHouses.
  { path: SEA_HOUSES_PATH, lastModified: SEA_HOUSES_LAST_MODIFIED, locales: [SEA_HOUSES_LOCALE] },
  // Albanian reference prices with a calculator (SEO hypothesis 5, lab E01): Albanian only.
  { path: REFERENCE_PRICES_PATH, lastModified: REFERENCE_PRICES_CHECKED_ON, locales: [REFERENCE_PRICES_LOCALE] },
  // The French pilot (2026-10-21): the hub and its two guides, French only, see lib/frenchPilot.
  { path: FRENCH_HUB_PATH, lastModified: FRENCH_PILOT_LAST_MODIFIED, locales: [FRENCH_PILOT_LOCALE] },
  ...Object.values(FRENCH_GUIDE_PATHS).map((guide) => ({
    path: `${FRENCH_HUB_PATH}/${guide}`,
    lastModified: FRENCH_PILOT_LAST_MODIFIED,
    locales: [FRENCH_PILOT_LOCALE],
  })),
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

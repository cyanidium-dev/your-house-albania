/**
 * Experiment 2026-09-25 → 2026-10-15: does Google index more listing pages
 * when a listing offers fewer language versions of itself?
 *
 * The site publishes every listing in seven locales: 375 listings became
 * 2,625 URLs on a domain with no external links, and on 2026-09-25 Search
 * Console held 1,264 of them at "discovered, currently not indexed" — never
 * fetched. Listing pages in uk, pl and sq had 14, 22 and 18 impressions in
 * three months; en, it, de and ru had 80, 52, 33 and 40. The hypothesis is
 * that the crawl budget, not the page, is the limit, and that a shorter
 * queue gets crawled.
 *
 * Every listing is assigned to an arm by a hash of its key slug, so the split
 * is stable across builds and imports and needs no field in the CMS:
 *
 *   full     — indexed in all seven locales, as before (control);
 *   trimmed  — `noindex, follow` in uk, pl and sq; those locale URLs leave
 *              hreflang, the sitemap and IndexNow. The pages still render.
 *
 * Each arm has its own sitemap file, so Search Console's page report gives
 * the indexed share of each arm without any other tooling
 * (`sitemap-properties.xml` = full, `sitemap-properties-trimmed.xml` =
 * trimmed). Decision record: docs/seo/decisions/008-property-locale-experiment.md.
 *
 * To end the experiment, set `TRIMMED_LOCALES` to `[]` (every listing back to
 * seven locales) or move the winning cut into `PROPERTY_URL_LOCALES`.
 */
export const PROPERTY_LOCALE_EXPERIMENT = {
  startedAt: "2026-09-25",
  reviewAt: "2026-10-15",
} as const;

export type PropertyExperimentArm = "full" | "trimmed";

/** Locales a listing in the trimmed arm is not indexed in. */
export const TRIMMED_LOCALES: readonly string[] = ["uk", "pl", "sq"];

/** FNV-1a, 32-bit: stable, dependency-free, good enough to halve a list. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** The arm a listing belongs to, from its key slug. */
export function propertyExperimentArm(key: string): PropertyExperimentArm {
  if (TRIMMED_LOCALES.length === 0) return "full";
  return fnv1a(key.trim().toLowerCase()) % 2 === 1 ? "trimmed" : "full";
}

/** Whether `/{locale}/property/…` of this listing may be indexed. */
export function isPropertyLocaleIndexable(key: string, locale: string): boolean {
  if (propertyExperimentArm(key) === "full") return true;
  return !TRIMMED_LOCALES.includes(locale);
}

/** `locales` minus the ones this listing is not indexed in. */
export function indexablePropertyLocales(key: string, locales: readonly string[]): string[] {
  return locales.filter((locale) => isPropertyLocaleIndexable(key, locale));
}

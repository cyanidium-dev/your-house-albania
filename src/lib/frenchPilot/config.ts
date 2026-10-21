/**
 * The French pilot (2026-10-21): `fr` as a partial locale, with a small set
 * of pages written for French buyers instead of the whole site translated.
 *
 * Why French and why this small: reports/domlivo-locales-2026-10-21.md.
 * Keyword Planner puts French at the level of German and Polish
 * ("immobilier albanie", "appartement albanie", "acheter maison albanie",
 * "immobilier albanie bord de mer" 100–1K a month each), while the Google
 * core updates of 2026 hit sites that scaled machine-translated pages over
 * many languages. So the pilot indexes only the pages below; every other
 * `/fr` URL renders (interface in French, CMS text in English where the
 * repository has no translation) but is `noindex, follow` and stays out of
 * hreflang, the sitemaps and IndexNow (`PARTIAL_LOCALE_PATHS`).
 *
 * Sanity text for these pages is translated in the repository
 * (`src/data/contentTranslations/fr.json`), because the dataset is at its
 * attribute cap. Review date: 2026-11-18. Expand or roll back by the
 * criterion in the report; rolling back is removing `fr` from
 * `routing.locales` and this folder.
 */
export const FRENCH_PILOT_LOCALE = "fr";

/** Path after the locale of the French market hub. */
export const FRENCH_HUB_PATH = "immobilier-albanie";

/** The two French guides, under the hub: path segment after `/fr/immobilier-albanie/`. */
export const FRENCH_GUIDE_PATHS = {
  buying: "acheter-depuis-la-france",
  seaside: "prix-bord-de-mer",
} as const;

export type FrenchGuideKey = keyof typeof FRENCH_GUIDE_PATHS;

/** The date the hub's and the guides' copy last changed (sitemap `lastmod`). */
export const FRENCH_PILOT_LAST_MODIFIED = "2026-10-21";

export function frenchHubPath(): string {
  return `/${FRENCH_PILOT_LOCALE}/${FRENCH_HUB_PATH}`;
}

export function frenchGuidePath(key: FrenchGuideKey): string {
  return `${frenchHubPath()}/${FRENCH_GUIDE_PATHS[key]}`;
}

/** Durrës, the one city the pilot indexes: most of the stock and most of the leads. */
export const FRENCH_PILOT_CITY = "durres";

/** Its five districts with the most listings (2026-10-21: 203, 178, 107, 93, 47). */
export const FRENCH_PILOT_DISTRICTS: readonly string[] = [
  "plazh",
  "golem-durres",
  "city-center-durres",
  "shkembi-durres",
  "mali-i-robit",
];

/**
 * The 30 listings with a French page, by their French address (derived from
 * the English one, see `lib/property/propertyUrl.ts`). Flats and studios in
 * the five districts, priced 50–110 % of their district's median €/m², with
 * at least five photos and a description of 250+ characters; listings that
 * already drew leads and those within 500 m of the sea first. Each one's
 * title and description are in `src/data/contentTranslations/fr.json`.
 */
export const FRENCH_PILOT_LISTINGS: readonly string[] = [
  "appartement-2-1-plazh-durres-105m2",
  "appartement-1-1-plazh-durres-105m2",
  "appartement-3-1-plazh-durres-117m2",
  "appartement-2-1-plazh-durres-95m2-2",
  "appartement-2-1-plazh-durres-100m2",
  "studio-plazh-durres-41m2",
  "appartement-1-1-plazh-durres-64m2",
  "appartement-1-1-plazh-durres-67m2-2",
  "studio-golem-durres-38m2-4",
  "appartement-2-1-golem-durres-91m2",
  "appartement-3-1-golem-durres-128m2",
  "appartement-2-1-golem-durres-93m2-2",
  "appartement-2-1-golem-durres-88m2-2",
  "appartement-1-1-golem-durres-80m2",
  "appartement-2-1-golem-durres-76m2",
  "appartement-2-1-shkembi-durres-115m2",
  "appartement-2-1-shkembi-durres-115m2-2",
  "appartement-1-1-shkembi-durres-69m2",
  "appartement-2-1-shkembi-durres-103m2",
  "appartement-1-1-shkembi-durres-61m2",
  "appartement-3-1-shkembi-durres-150m2",
  "appartement-2-1-city-center-durres-145m2",
  "appartement-2-1-city-center-durres-156m2",
  "appartement-3-1-city-center-durres-134m2",
  "appartement-1-1-city-center-durres-73m2",
  "appartement-2-1-city-center-durres-114m2",
  "appartement-2-1-mali-i-robit-durres-95m2",
  "appartement-1-1-mali-i-robit-durres-72m2",
  "appartement-1-1-mali-i-robit-durres-52m2-2",
  "appartement-1-1-mali-i-robit-durres-51m2",
];

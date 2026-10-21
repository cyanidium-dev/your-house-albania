/**
 * The German market hub, `/de/albanien-immobilien`: one page for the whole
 * "Immobilien in Albanien kaufen" intent (SEO hypothesis 3, 2026-10-19).
 *
 * Germany is the one market where demand is confirmed by impressions and
 * leads (reports/domlivo-seo-hypotheses-2026-10-19.md), but the five German
 * articles of 2026-10-19 spread that intent over five URLs. The hub answers
 * it on one: prices by city from the Price Index, flats by the sea, the
 * articles, a FAQ and the lead form. German only: it renders 404 in every
 * other locale and declares no hreflang beyond `de`.
 *
 * Lives in code, like the partner landings, because the Sanity dataset sits
 * at its attribute cap (see docs/HANDOVER.md). Copy: `messages/de.json`
 * `GermanHub`.
 */
export const GERMAN_HUB_LOCALE = "de";

/** Path after the locale. */
export const GERMAN_HUB_PATH = "albanien-immobilien";

/** The date the page's copy last changed (sitemap `lastmod`). */
export const GERMAN_HUB_LAST_MODIFIED = "2026-10-20";

export function germanHubPath(): string {
  return `/${GERMAN_HUB_LOCALE}/${GERMAN_HUB_PATH}`;
}

/**
 * The cities the hero lead names, in this order: the four markets the German
 * articles compare. Every other city with listings still gets a table row.
 */
export const GERMAN_HUB_LEAD_CITIES: readonly string[] = ["durres", "tirana", "vlore", "sarande"];

/** Flats by the sea: this many cards, at most this many per city while there is choice. */
export const GERMAN_HUB_SEA_LISTINGS = 12;
export const GERMAN_HUB_SEA_PER_CITY = 4;

/** A listing counts as "by the sea" within this stated walking distance, or on the first line. */
export const GERMAN_HUB_SEA_MAX_METERS = 1000;

/**
 * Flats, as the Price Index counts them: the cards are ranked against the
 * city median of flats and studios, so a 400 m² penthouse with terraces
 * (cheap per m², not a flat) is not compared with it.
 */
export const GERMAN_HUB_FLAT_TYPES: readonly string[] = ["apartment", "studio"];

/**
 * The five German articles of 2026-10-19 (track B of the Q4 plan), in reading
 * order: the buying guide first, then prices, taxes, the country comparison
 * and retiring. Sanity `blogPost` slugs; titles are read from the CMS.
 */
export const GERMAN_HUB_GUIDE_SLUGS: readonly string[] = [
  "buying-property-albania-from-germany-2026",
  "albania-seaside-property-prices-by-town-2026",
  "albania-property-taxes-german-owners",
  "albania-montenegro-croatia-property-comparison",
  "retiring-to-albania-from-germany",
];

/** Older German articles the FAQ answers link to. */
export const GERMAN_HUB_FAQ_LINKS = {
  foreigners: "can-foreigners-buy-real-estate-albania",
  notary: "notary-fees-albania-2026",
} as const;

/** The German lead landing "Immobilien in Albanien am Meer kaufen" (Sanity, de only). */
export const GERMAN_HUB_SEA_LANDING_PATH = "/de/immobilien-albanien-am-meer";

/**
 * `/de/haus-am-meer-albanien-kaufen`: houses and villas by the sea for German
 * buyers (2026-10-24).
 *
 * Why: Search Console's largest cluster without a click is German and about
 * houses, not flats: "albanien haus am meer kaufen" 21, "albanien häuser am
 * meer kaufen" 17, "haus am meer kaufen albanien" 14, "haus kaufen albanien am
 * meer" 14, "haus in albanien am meer kaufen" 13, "haus kaufen albanien direkt
 * am meer" 12 and ten more variants, 174 impressions in the 28 days to
 * 2026-10-19 at positions 25-45 (long-tail plan F2; Ahrefs "haus in albanien
 * am meer kaufen" 200/month). They landed on `/de/sale/house`, the national
 * list of every house, and left. This page answers the query: the houses
 * within 1 km of the sea, what they cost by district, the costs on top of
 * the price and the questions German buyers ask. On 2026-10-24 that was 29
 * of 53 houses and villas, all on the Durrës coast; the page says so.
 *
 * German only, in code like the German hub (the Sanity dataset is at its
 * attribute cap). Copy: `messages/de.json` `SeaHouses`. `/de/sale/house` is
 * an E03 test page until 2026-11-18: this page links to it, nothing links
 * from it.
 */
export const SEA_HOUSES_LOCALE = "de";

/** Path after the locale. */
export const SEA_HOUSES_PATH = "haus-am-meer-albanien-kaufen";

/** The date the page's copy last changed (sitemap `lastmod`). */
export const SEA_HOUSES_LAST_MODIFIED = "2026-10-24";

export function seaHousesPath(): string {
  return `/${SEA_HOUSES_LOCALE}/${SEA_HOUSES_PATH}`;
}

/** Houses as the catalogue types them. */
export const SEA_HOUSES_TYPES: readonly string[] = ["house", "villa"];

/** A house counts as "by the sea" within this stated walking distance, or on the first line. */
export const SEA_HOUSES_MAX_METERS = 1000;

/** Cards on the page: this many, cheapest first. */
export const SEA_HOUSES_CARDS = 12;

/** A district row in the table needs this many houses by the sea. */
export const SEA_HOUSES_MIN_ROW = 2;

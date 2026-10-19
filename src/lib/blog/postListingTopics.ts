/**
 * Which listings each blog post is about.
 *
 * Blog posts carried no link to any listing, property or `/sale` page — 25
 * posts, a third of the site's search impressions, and none of that weight
 * reached the pages that sell (crawl of 2026-09-15). `blogPost` has no city or
 * district field to derive the topic from, so the mapping is written out here,
 * one reviewed line per post, and `InventoryLinksSection` turns it into links to
 * the canonical listing URLs.
 *
 * - A topic names a city, optionally narrowed to a district or a property type.
 * - Links render in the order written; the first city supplies the property
 *   cards and its price index (`/{country}/{city}/info`) comes first
 *   (`lib/inventoryLinks/places.ts` turns the topics into the plan).
 * - A post that maps to `[]` is about Albania as a whole: it links to the
 *   national `/sale` listing and the national price index (`/methodology`).
 * - A post missing from the map falls back to the cities its slug names
 *   (`inferTopicsFromSlug`), so a new article is not left without links.
 */

export type BlogListingTopic = {
  city: string;
  district?: string;
  type?: string;
};

export const BLOG_POST_LISTING_TOPICS: Readonly<Record<string, readonly BlogListingTopic[]>> = {
  // Tirana
  "best-districts-tirana": [{ city: "tirana" }],
  "tirana-apartment-prices-2026": [{ city: "tirana" }],
  "tirana-buy-without-agent": [{ city: "tirana" }],
  "tirana-investment-area-2026": [{ city: "tirana" }],
  "tirana-popular-apartments-villas": [{ city: "tirana" }],

  // Durrës
  "buying-apartment-durres-complete-guide": [{ city: "durres", type: "apartment" }, { city: "durres" }],
  "durres-beach-vs-center": [
    { city: "durres", district: "plazh" },
    { city: "durres", district: "city-center-durres" },
  ],
  "durres-choose-area-2026": [
    { city: "durres", district: "golem-durres" },
    { city: "durres", district: "plazh" },
    { city: "durres", district: "shkembi-durres" },
    { city: "durres", district: "city-center-durres" },
  ],
  "durres-documents-checklist": [{ city: "durres" }],
  "durres-rental-investment-2026": [{ city: "durres", type: "studio" }, { city: "durres" }],
  "durres-marina-eagle-hills-2026": [{ city: "durres", district: "plazh" }, { city: "durres" }],
  "golem-sewage-buying-2026": [{ city: "durres", district: "golem-durres" }, { city: "durres", district: "mali-i-robit" }],
  "durres-old-apartment-earthquake-check": [
    { city: "durres", district: "shkembi-durres" },
    { city: "durres", district: "plazh" },
    { city: "durres", district: "city-center-durres" },
  ],
  "tirana-durres-train-property-prices": [{ city: "durres" }, { city: "tirana" }],
  "durres-reference-prices-2026": [{ city: "durres", district: "city-center-durres" }, { city: "durres" }],
  "durres-asking-price-index-2026-09": [{ city: "durres", type: "apartment" }, { city: "durres" }],
  "durres-asking-price-index-2026-10": [{ city: "durres", type: "apartment" }, { city: "durres" }],
  "utilities-in-albania-monthly-costs": [{ city: "durres" }],
  "retiring-to-albania-property-costs": [{ city: "durres", type: "apartment" }, { city: "vlore" }],
  "retiring-to-albania-from-germany": [{ city: "durres", type: "apartment" }, { city: "vlore" }],
  "albania-rental-yield-for-investors": [{ city: "durres" }, { city: "sarande" }],
  "moving-to-albania-with-family": [{ city: "tirana" }, { city: "durres" }, { city: "vlore" }],

  // The coast south of Vlorë
  "living-albanian-riviera": [{ city: "vlore" }, { city: "sarande" }],
  "property-investment-potential-vlore-sarande": [{ city: "vlore" }, { city: "sarande" }],
  "short-term-rental-albanian-riviera": [{ city: "sarande" }, { city: "vlore" }],
  "saranda-apartment-prices-districts-2026": [{ city: "sarande" }],

  // Several cities
  "how-to-choose-tirana-durres-vlore": [{ city: "tirana" }, { city: "durres" }, { city: "vlore" }],
  "albania-investment-by-budget-and-goal": [{ city: "durres" }, { city: "sarande" }, { city: "vlore" }],
  "undervalued-areas-albania-2026": [{ city: "durres" }, { city: "vlore" }, { city: "sarande" }],
  "albania-bulgaria-montenegro-seaside-flat": [{ city: "durres" }, { city: "vlore" }, { city: "sarande" }],
  "albania-seaside-property-prices-by-town-2026": [{ city: "durres" }, { city: "vlore" }, { city: "sarande" }],
  "albania-protests-property-market-impact": [{ city: "tirana" }, { city: "durres" }, { city: "vlore" }],
  "price-per-square-metre-albania-cities-2026": [
    { city: "tirana" },
    { city: "durres" },
    { city: "vlore" },
    { city: "sarande" },
  ],

  // Albania as a whole → `/sale` and the national price index
  "albania-montenegro-croatia-property-comparison": [],
  "albania-property-for-polish-buyers-2026": [],
  "albania-property-market-h1-2026": [],
  "albania-property-taxes-german-owners": [],
  "albania-protests-2026-what-is-happening": [],
  "albania-property-types-investment-risk": [],
  "albania-reference-prices-2026-by-city": [],
  "buying-property-albania-from-germany-2026": [],
  "buying-property-albania": [],
  "can-foreigners-buy-real-estate-albania": [],
  "eu-accession-albania-property-prices": [],
  "investment-albania": [],
  "legal-guide-buyers": [],
  "legalized-property-albania-how-to-check": [],
  "market-outlook-2026": [],
  "notary-fees-albania-2026": [],
  "where-not-to-buy-albania-2026": [],
};

export function listingTopicsForBlogPost(slug: string): readonly BlogListingTopic[] {
  return BLOG_POST_LISTING_TOPICS[slug.trim().toLowerCase()] ?? [];
}

/** Whether the post has a reviewed line in the map (`[]` included). */
export function hasMappedListingTopics(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(BLOG_POST_LISTING_TOPICS, slug.trim().toLowerCase());
}

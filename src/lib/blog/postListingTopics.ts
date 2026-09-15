/**
 * Which listings each blog post is about.
 *
 * Blog posts carried no link to any listing, property or `/sale` page — 25
 * posts, a third of the site's search impressions, and none of that weight
 * reached the pages that sell (crawl of 2026-09-15). `blogPost` has no city or
 * district field to derive the topic from, so the mapping is written out here,
 * one reviewed line per post, and `BlogListingsBlock` turns it into links to
 * the canonical listing URLs.
 *
 * - A topic names a city, optionally narrowed to a district or a property type.
 * - Links render in the order written; the topic with the most listings
 *   supplies the property cards.
 * - A post that is missing, or maps to `[]`, links to the national `/sale`
 *   listing — the right target for posts about Albania as a whole.
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

  // The coast south of Vlorë
  "living-albanian-riviera": [{ city: "vlore" }, { city: "sarande" }],
  "property-investment-potential-vlore-sarande": [{ city: "vlore" }, { city: "sarande" }],
  "short-term-rental-albanian-riviera": [{ city: "sarande" }, { city: "vlore" }],

  // Several cities
  "how-to-choose-tirana-durres-vlore": [{ city: "tirana" }, { city: "durres" }, { city: "vlore" }],
  "albania-investment-by-budget-and-goal": [{ city: "durres" }, { city: "sarande" }, { city: "vlore" }],
  "undervalued-areas-albania-2026": [{ city: "durres" }, { city: "vlore" }, { city: "sarande" }],

  // Albania as a whole → `/sale`
  "albania-property-types-investment-risk": [],
  "buying-property-albania": [],
  "can-foreigners-buy-real-estate-albania": [],
  "eu-accession-albania-property-prices": [],
  "investment-albania": [],
  "legal-guide-buyers": [],
  "market-outlook-2026": [],
  "where-not-to-buy-albania-2026": [],
};

export function listingTopicsForBlogPost(slug: string): readonly BlogListingTopic[] {
  return BLOG_POST_LISTING_TOPICS[slug.trim().toLowerCase()] ?? [];
}

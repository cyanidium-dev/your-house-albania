/**
 * What the blocks under a listing's card grid say — prices, slices, districts,
 * questions — worked out from data the page already has. No I/O, no copy:
 * `ListingDepthSections` fetches, this decides, messages word it.
 *
 * Two rules run through all of it:
 * - no number without data: a median over fewer than `MIN_STAT_LISTINGS`
 *   homes, or a slice with fewer, is left out rather than printed;
 * - a link only to a page the SEO registry indexes in this locale (ADR 004);
 *   a slice that is not indexable still shows its count, as text.
 */
import { LISTING_FACETS, LISTING_FACET_SLUGS, type ListingFacetSlug } from "@/lib/catalog/listingFacets";
import { isSeoPageIndexableIn, selectSeoLinks, type SeoPageDecision, type SeoPageKey } from "@/lib/seo/pages";

/** A median of two flats is an anecdote, not a price. Same floor as the /info price table. */
export const MIN_STAT_LISTINGS = 3;

export type PlacePriceIndexRow = {
  districtSlug: string | null;
  count: number;
  flatCount: number;
  flatPriceFrom: number | null;
  medianFlatPrice: number | null;
  medianFlatPricePerSqm: number | null;
};

export type PlacePriceFacts = {
  count: number;
  flatCount: number;
  flatPriceFrom: number | null;
  medianFlatPrice: number | null;
  medianFlatPricePerSqm: number | null;
};

/**
 * The city's row of the price index, or one district's. `null` when the place
 * has too few listings for any figure to mean something.
 */
export function placePriceFacts(
  rows: readonly PlacePriceIndexRow[],
  districtSlug?: string | null,
): PlacePriceFacts | null {
  const wanted = districtSlug ? districtSlug.toLowerCase() : null;
  const row = rows.find((r) => (r.districtSlug ? r.districtSlug.toLowerCase() : null) === wanted);
  if (!row || row.count < MIN_STAT_LISTINGS) return null;
  const enoughFlats = row.flatCount >= MIN_STAT_LISTINGS;
  return {
    count: row.count,
    flatCount: row.flatCount,
    flatPriceFrom: row.flatCount > 0 ? row.flatPriceFrom : null,
    medianFlatPrice: enoughFlats ? row.medianFlatPrice : null,
    medianFlatPricePerSqm: enoughFlats ? row.medianFlatPricePerSqm : null,
  };
}

export type DecisionRow = { decision: SeoPageDecision; count: number };

export type PlaceSliceCount = {
  facet: ListingFacetSlug;
  count: number;
  /** Link it only when the registry indexes that facet page in this locale. */
  linkable: boolean;
};

/** Slices a buyer compares a place by: bedrooms, the sea, new builds. Budgets are a filter, not a fact. */
const PRICE_BLOCK_KINDS = new Set(["rooms", "sea", "stage"]);

/**
 * Listing counts of a place's facet slices, in facet order, from the registry's
 * own inventory — the same numbers the facet chips and the sitemap use.
 */
export function placeSliceCounts(input: {
  rows: readonly DecisionRow[];
  place: { country: string; city: string; district?: string };
  locale: string;
}): PlaceSliceCount[] {
  const { place, locale } = input;
  const out: PlaceSliceCount[] = [];
  for (const { decision, count } of input.rows) {
    const key = decision.key;
    if (key.family !== "facet") continue;
    if (key.country !== place.country || key.city !== place.city) continue;
    if ((key.district ?? undefined) !== (place.district ?? undefined)) continue;
    if (!PRICE_BLOCK_KINDS.has(LISTING_FACETS[key.facet].kind)) continue;
    if (count < MIN_STAT_LISTINGS) continue;
    out.push({ facet: key.facet, count, linkable: isSeoPageIndexableIn(decision, locale) });
  }
  return out.sort((a, b) => LISTING_FACET_SLUGS.indexOf(a.facet) - LISTING_FACET_SLUGS.indexOf(b.facet));
}

export type DistrictLinkTarget = { district: string; count: number };

/**
 * The districts a listing page links to: on a city page its indexable
 * districts, on a district page the indexable siblings. Largest first, as
 * `selectSeoLinks` orders them.
 */
export function districtLinkTargets(input: {
  rows: readonly DecisionRow[];
  place: { country: string; city: string; district?: string };
  locale: string;
}): DistrictLinkTarget[] {
  const { place, locale } = input;
  const from: SeoPageKey = { family: "city", country: place.country, city: place.city };
  return selectSeoLinks({ from, locale, candidates: input.rows }).flatMap((link) => {
    if (link.group !== "districts" || link.key.family !== "district") return [];
    if (place.district && link.key.district === place.district) return [];
    return [{ district: link.key.district, count: link.count }];
  });
}

/**
 * Which of a place's CMS questions a listing page shows.
 *
 * A district has a handful and shows them all. A city's list is long and lives
 * on its `/info` page, which also carries the FAQPage markup; the listing shows
 * a short run of it and links to the rest. The run starts after the first
 * question: city FAQs open with "how much does a flat cost", answered on
 * `/info` by pointing at that page's tables, and answered here by the live
 * price block right above.
 */
export function pickListingFaq<T>(items: readonly T[], scope: "city" | "district"): { shown: T[]; hasMore: boolean } {
  if (scope === "district") {
    const shown = items.slice(0, LISTING_FAQ_MAX.district);
    return { shown, hasMore: items.length > shown.length };
  }
  const run = items.length > LISTING_FAQ_MAX.city ? items.slice(1) : items.slice();
  const shown = run.slice(0, LISTING_FAQ_MAX.city);
  return { shown, hasMore: items.length > shown.length };
}

export const LISTING_FAQ_MAX = { city: 5, district: 7 } as const;
/** Fewer questions than this in the visitor's language and the block is not worth a heading. */
export const LISTING_FAQ_MIN = 2;

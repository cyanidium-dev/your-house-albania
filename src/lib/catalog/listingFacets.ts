/**
 * Facet listings: a city or district listing narrowed to the slice people
 * search for — "apartament 1+1 ne shitje durres", "квартиры в Дурресе до
 * 100 000 €", "new builds Durres".
 *
 * A facet is a path segment after the place (`/albania/durres/1-1`,
 * `/albania/durres/golem-durres/1-1`) and never combines with a deal or type
 * segment. Slugs are the same in every locale so hreflang pairs line up; the
 * title and H1 carry each market's own wording (1+1, bilocale, dwupokojowe).
 *
 * Every facet is expressed twice and the two must agree:
 * - `query`: catalogue query params, used by the listing and by load-more;
 * - `matches`: the same predicate over a raw property row, used by the sitemap
 *   so it lists exactly the facet pages the route will index.
 * The test in `__tests__/listingFacets.test.ts` holds them together.
 */

export const LISTING_FACET_SLUGS = ["1-1", "2-1", "3-1", "under-80k", "under-100k", "new-builds"] as const;
export type ListingFacetSlug = (typeof LISTING_FACET_SLUGS)[number];

export type ListingFacetKind = "rooms" | "budget" | "stage";

/** Minimal property shape the sitemap reads to count facet pages. */
export type FacetPropertyRow = {
  typeSlug?: string | null;
  bedrooms?: number | null;
  price?: number | null;
  priceUnit?: string | null;
  constructionStage?: string | null;
};

type FacetDefinition = {
  kind: ListingFacetKind;
  query: Record<string, string>;
  matches: (row: FacetPropertyRow) => boolean;
};

const APARTMENT_TYPES = ["apartment", "studio"];

const totalPriceAtMost = (max: number) => (row: FacetPropertyRow) =>
  typeof row.price === "number" && row.price > 0 && row.price <= max && row.priceUnit !== "per-sqm";

export const LISTING_FACETS: Record<ListingFacetSlug, FacetDefinition> = {
  "1-1": {
    kind: "rooms",
    query: { type: "apartment", bedsExact: "1" },
    matches: (r) => r.typeSlug === "apartment" && r.bedrooms === 1,
  },
  "2-1": {
    kind: "rooms",
    query: { type: "apartment", bedsExact: "2" },
    matches: (r) => r.typeSlug === "apartment" && r.bedrooms === 2,
  },
  "3-1": {
    kind: "rooms",
    query: { type: "apartment", beds: "3" },
    matches: (r) => r.typeSlug === "apartment" && typeof r.bedrooms === "number" && r.bedrooms >= 3,
  },
  "under-80k": {
    kind: "budget",
    query: { types: APARTMENT_TYPES.join(","), maxPrice: "80000" },
    matches: (r) => APARTMENT_TYPES.includes(r.typeSlug ?? "") && totalPriceAtMost(80000)(r),
  },
  "under-100k": {
    kind: "budget",
    query: { types: APARTMENT_TYPES.join(","), maxPrice: "100000" },
    matches: (r) => APARTMENT_TYPES.includes(r.typeSlug ?? "") && totalPriceAtMost(100000)(r),
  },
  "new-builds": {
    kind: "stage",
    query: { stage: "unfinished" },
    matches: (r) => r.constructionStage === "off-plan" || r.constructionStage === "under-construction",
  },
};

export function isListingFacetSlug(value: string | undefined | null): value is ListingFacetSlug {
  return typeof value === "string" && (LISTING_FACET_SLUGS as readonly string[]).includes(value.toLowerCase());
}

/** Merge a facet's query into listing search params; the facet wins over a stray query copy. */
export function withFacetQuery<T extends Record<string, string | string[] | undefined>>(
  search: T,
  facet: ListingFacetSlug | "" | undefined,
): T {
  if (!facet) return search;
  return { ...search, ...LISTING_FACETS[facet].query };
}

/** Catalogue filter object for a facet, for server-side counts and stats. */
export function facetCatalogFilters(facet: ListingFacetSlug): {
  type?: string;
  types?: string[];
  bedsExact?: number;
  beds?: number;
  maxPrice?: number;
  stage?: "unfinished";
} {
  const q = LISTING_FACETS[facet].query;
  return {
    ...(q.type ? { type: q.type } : {}),
    ...(q.types ? { types: q.types.split(",") } : {}),
    ...(q.bedsExact ? { bedsExact: Number(q.bedsExact) } : {}),
    ...(q.beds ? { beds: Number(q.beds) } : {}),
    ...(q.maxPrice ? { maxPrice: Number(q.maxPrice) } : {}),
    ...(q.stage === "unfinished" ? { stage: "unfinished" as const } : {}),
  };
}

/**
 * Types of the SEO page registry. See docs/seo/README.md for the model and
 * docs/seo/decisions/ for why it is built this way.
 */
import type { ListingFacetKind, ListingFacetSlug } from "@/lib/catalog/listingFacets";
import type { routing } from "@/i18n/routing";

export type SeoLocale = (typeof routing.locales)[number];

/** The kinds of listing page that may be indexable. Anything else never is. */
export type SeoPageFamily = "city" | "district" | "cityType" | "facet";

/** A listing page, identified by what it lists — not by its URL string. */
export type SeoPageKey =
  | { family: "city"; country: string; city: string }
  | { family: "district"; country: string; city: string; district: string }
  | { family: "cityType"; country: string; city: string; type: string }
  | { family: "facet"; country: string; city: string; district?: string; facet: ListingFacetSlug };

/**
 * Keyword Planner buckets. Without ad spend the account sees ranges only; the
 * registry never pretends they are numbers.
 */
export type DemandBucket = "10-100" | "100-1K" | "1K-10K";

/**
 * What Google currently ranks for the cluster's primary keyword. A cluster
 * whose SERP is rentals or articles cannot justify a sale listing page.
 */
export type SerpIntent = "listings" | "mixed" | "rentals" | "editorial";

export type EvidenceSource =
  | "kp-atlas-2026-09-16"
  | "kp-albania-2026-09-17"
  | "kp-foreign4-2026-09-17"
  | "gsc-2026-09-17"
  | "serp-2026-09-17";

/** One search intent with evidence of demand, targeting exactly one page. */
export type KeywordCluster = {
  id: string;
  target: SeoPageKey;
  primaryKeyword: string;
  secondaryKeywords: readonly string[];
  /** ISO 3166 alpha-2 (Kosovo = XK) of the markets where the demand was confirmed. */
  markets: readonly string[];
  /**
   * Languages that search for this intent. On a city cluster this is also the
   * set of locales every listing page of that city may be indexed in.
   */
  locales: readonly SeoLocale[];
  /** Best confirmed bucket across the markets. */
  bucket: DemandBucket;
  serp: SerpIntent;
  sources: readonly EvidenceSource[];
  notes?: string;
};

export type DemandScore = 0 | 1 | 2 | 3;

export type DemandMatch = {
  score: DemandScore;
  /** True when the score comes from the parent city, not from this page. */
  inferred: boolean;
  clusterIds: readonly string[];
  /** Locales with demand for the page's place (from the city cluster). */
  locales: readonly SeoLocale[];
};

/**
 * `experiment`: indexed like `index`, but on probation — the page has no
 * keyword evidence (or its data is incomplete) and stays indexed only if its
 * review shows impressions and query alignment (ADR 007).
 */
export type SeoPageStatus = "index" | "experiment" | "noindex" | "skip";

/** A page indexed on a hypothesis instead of keyword evidence. */
export type SeoExperiment = {
  id: string;
  target: SeoPageKey;
  /** Why the page may deserve the index without Keyword Planner evidence. */
  hypothesis: string;
  /** What the review must see to promote the page to a keyword cluster. */
  successCriteria: string;
  /** ISO dates (YYYY-MM-DD). */
  startedAt: string;
  reviewAt: string;
};

export type SeoPageTier = 1 | 2 | 3 | null;

export type SeoPageInventory = {
  /** Public sale listings the page shows. */
  count: number;
  /** Listings on the parent page (city for a type, place for a facet). */
  parentCount?: number | null;
};

export type SeoPageDecision = {
  key: SeoPageKey;
  status: SeoPageStatus;
  indexableLocales: readonly SeoLocale[];
  demand: DemandMatch;
  tier: SeoPageTier;
  /** Set when the page is (or would be) indexed as an experiment. */
  experiment: SeoExperiment | null;
  /** Human-readable reasons, so every noindex can be explained. */
  reasons: readonly string[];
};

export type SeoContentSection =
  | "hero"
  | "factsLine"
  | "facetNav"
  | "placeInfoLink"
  | "catalogIntro"
  | "listings"
  | "catalogBottomText";

export type SeoStructuredData = "BreadcrumbList" | "ItemList";

export type SeoCopySource =
  | "buildCityListingSeo"
  | "buildCityDistrictListingSeo"
  | "buildCityTypeListingSeo"
  | "buildFacetListingSeo";

export type SeoPageFamilyDefinition = {
  family: SeoPageFamily;
  urlPattern: string;
  /** Which page's inventory the share-of-parent rule compares against. */
  parent: "city" | "place" | null;
  copySource: SeoCopySource;
  /** CMS `catalogSeoPage` scope that may override copy and force noindex. */
  editorialScope: "city" | "district" | "place";
  contentSections: readonly SeoContentSection[];
  structuredData: readonly SeoStructuredData[];
};

export type SeoLinkGroup = "districts" | ListingFacetKind;

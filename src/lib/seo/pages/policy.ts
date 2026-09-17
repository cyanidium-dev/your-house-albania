/**
 * Every number the SEO page registry uses. Nothing else in the codebase may
 * compare an inventory count or a demand score against a constant — ask
 * `evaluateSeoPage()` instead. Rationale for each value: ADR 002.
 *
 * No Sanity or Next imports: sitemap fetchers and tests share this module.
 */
import type { DemandBucket, DemandScore, SeoPageFamily } from "./types";

type FamilyPolicy = {
  /** Public sale listings required to index the page. */
  minInventory: number;
  /** Demand score required (2 = a confirmed cluster for this exact page). */
  minDemandScore: DemandScore;
  /**
   * Districts only: a district without its own cluster may still be indexed on
   * the city's demand when its stock is at least this large.
   */
  inferredDemandMinInventory?: number;
  /**
   * The page duplicates its parent when it holds more than this share of the
   * parent's listings (a type that is most of the city, a facet that is almost
   * all of its place).
   */
  maxShareOfParent?: number;
};

export const SEO_PAGE_POLICY = {
  city: { minInventory: 5, minDemandScore: 2 },
  district: { minInventory: 10, minDemandScore: 2, inferredDemandMinInventory: 30 },
  cityType: { minInventory: 16, minDemandScore: 2, maxShareOfParent: 0.6 },
  facet: { minInventory: 10, minDemandScore: 2, maxShareOfParent: 0.9 },
} as const satisfies Record<SeoPageFamily, FamilyPolicy>;

export type SeoFamilyPolicy = FamilyPolicy;

/** A cluster targeting exactly the page scores by its bucket. */
export const DEMAND_SCORE_BY_BUCKET: Record<DemandBucket, DemandScore> = {
  "10-100": 2,
  "100-1K": 3,
  "1K-10K": 3,
};

/** No cluster for the page, but its city has one. */
export const INFERRED_DEMAND_SCORE: DemandScore = 1;

/** Tier 1 = demand score 3 and inventory at least this multiple of the family minimum. */
export const TIER_ONE_INVENTORY_MULTIPLE = 2;

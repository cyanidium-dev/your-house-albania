/**
 * How much evidence there is that people search for a page (ADR 002).
 */
import { routing } from "@/i18n/routing";
import { KEYWORD_CLUSTERS } from "./data/keywordEvidence";
import { DEMAND_SCORE_BY_BUCKET, INFERRED_DEMAND_SCORE } from "./policy";
import { citySeoPageKey, sameSeoPageKey } from "./registry";
import type { DemandMatch, DemandScore, KeywordCluster, SeoLocale, SeoPageKey } from "./types";

/** Clusters whose SERP is rentals or articles cannot justify a sale listing page. */
export function isListingIntentCluster(cluster: KeywordCluster): boolean {
  return cluster.serp === "listings" || cluster.serp === "mixed";
}

export function findDemand(key: SeoPageKey, clusters: readonly KeywordCluster[] = KEYWORD_CLUSTERS): DemandMatch {
  const usable = clusters.filter(isListingIntentCluster);
  const exact = usable.filter((c) => sameSeoPageKey(c.target, key));
  const cityKey = citySeoPageKey(key);
  const cityClusters = usable.filter((c) => sameSeoPageKey(c.target, cityKey));
  const placeLocales = new Set<string>(cityClusters.flatMap((c) => c.locales));
  const locales = routing.locales.filter((l): l is SeoLocale => placeLocales.has(l));

  if (exact.length > 0) {
    const score = exact.reduce<DemandScore>(
      (best, c) => (DEMAND_SCORE_BY_BUCKET[c.bucket] > best ? DEMAND_SCORE_BY_BUCKET[c.bucket] : best),
      0,
    );
    return { score, inferred: false, clusterIds: exact.map((c) => c.id), locales };
  }
  if (key.family !== "city" && cityClusters.length > 0) {
    return { score: INFERRED_DEMAND_SCORE, inferred: true, clusterIds: cityClusters.map((c) => c.id), locales };
  }
  return { score: 0, inferred: false, clusterIds: [], locales };
}

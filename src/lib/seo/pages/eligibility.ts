/**
 * The only function that decides whether a listing page is indexable.
 * Pure: callers pass inventory in. Rules and their rationale: ADR 002.
 */
import { isListingFacetSlug } from "@/lib/catalog/listingFacets";
import { findDemand } from "./demand";
import { SEO_PAGE_POLICY, TIER_ONE_INVENTORY_MULTIPLE, type SeoFamilyPolicy } from "./policy";
import type { KeywordCluster, SeoLocale, SeoPageDecision, SeoPageInventory, SeoPageKey, SeoPageTier } from "./types";

export type EvaluateSeoPageInput = {
  key: SeoPageKey;
  inventory: SeoPageInventory;
  /** CMS `catalogSeoPage.seo.noIndex` for the page's editorial scope. */
  editorialNoindex?: boolean;
  /** Tests only; production uses the shipped evidence. */
  clusters?: readonly KeywordCluster[];
};

function hasValidSlugs(key: SeoPageKey): boolean {
  const filled = (s: string | undefined) => typeof s === "string" && s.trim().length > 0;
  if (!filled(key.country) || !filled(key.city)) return false;
  switch (key.family) {
    case "city":
      return true;
    case "district":
      return filled(key.district);
    case "cityType":
      return filled(key.type);
    case "facet":
      return isListingFacetSlug(key.facet) && (key.district === undefined || filled(key.district));
  }
}

export function evaluateSeoPage(input: EvaluateSeoPageInput): SeoPageDecision {
  const { key, inventory } = input;
  const policy: SeoFamilyPolicy = SEO_PAGE_POLICY[key.family];
  const demand = findDemand(key, input.clusters);
  const reasons: string[] = [];
  const skip = (reason: string): SeoPageDecision => ({
    key,
    status: "skip",
    indexableLocales: [],
    demand,
    tier: null,
    reasons: [reason],
  });

  if (!hasValidSlugs(key)) return skip("not a valid registry page");
  const count = inventory.count;
  if (!Number.isFinite(count) || count <= 0) return skip("no public listings");

  let demandOk = demand.score >= policy.minDemandScore;
  if (!demandOk && policy.inferredDemandMinInventory !== undefined && demand.inferred) {
    if (count >= policy.inferredDemandMinInventory) {
      demandOk = true;
      reasons.push(`city demand with ${count} listings (≥ ${policy.inferredDemandMinInventory})`);
    }
  }
  if (!demandOk) {
    reasons.push(
      demand.score === 0
        ? "no keyword evidence for this page or its city"
        : `demand score ${demand.score} < ${policy.minDemandScore} (only the city has keyword evidence)`,
    );
  }

  const inventoryOk = count >= policy.minInventory;
  if (!inventoryOk) reasons.push(`inventory ${count} < min ${policy.minInventory}`);

  let distinctOk = true;
  const parentCount = inventory.parentCount;
  if (policy.maxShareOfParent !== undefined && typeof parentCount === "number" && parentCount > 0) {
    const share = count / parentCount;
    if (share > policy.maxShareOfParent) {
      distinctOk = false;
      reasons.push(
        `${Math.round(share * 100)}% of the parent page's listings (> ${Math.round(policy.maxShareOfParent * 100)}%): duplicate intent`,
      );
    }
  }

  const editorialOk = !input.editorialNoindex;
  if (!editorialOk) reasons.push("noindex set in the CMS");

  const qualifies = demandOk && inventoryOk && distinctOk && editorialOk;
  const indexableLocales: readonly SeoLocale[] = qualifies ? demand.locales : [];
  if (qualifies && indexableLocales.length === 0) reasons.push("no locale with demand for this place");
  const status = qualifies && indexableLocales.length > 0 ? "index" : "noindex";

  let tier: SeoPageTier = null;
  if (status === "index") {
    tier = demand.score === 3 && count >= TIER_ONE_INVENTORY_MULTIPLE * policy.minInventory ? 1 : 2;
    reasons.push(`demand score ${demand.score} (${demand.clusterIds.join(", ")}), ${count} listings`);
  } else if (demandOk && !inventoryOk && distinctOk && editorialOk && demand.score >= policy.minDemandScore) {
    tier = 3;
  }

  return { key, status, indexableLocales, demand, tier, reasons };
}

export function isSeoPageIndexableIn(decision: SeoPageDecision, locale: string): boolean {
  return decision.status === "index" && (decision.indexableLocales as readonly string[]).includes(locale);
}

/**
 * Which registry pages a listing page links to (ADR 004).
 *
 * A link is only ever built to a page that is indexable in the visitor's
 * locale: links to noindexed slices spend crawl budget and anchor text on pages
 * we ask Google to drop. Pure — callers pass the decisions in.
 */
import { LISTING_FACETS, LISTING_FACET_SLUGS } from "@/lib/catalog/listingFacets";
import { isSeoPageIndexableIn } from "./eligibility";
import { sameSeoPageKey } from "./registry";
import type { SeoLinkGroup, SeoPageDecision, SeoPageKey } from "./types";

export type SeoLinkCandidate = {
  decision: SeoPageDecision;
  count: number;
};

export type SeoLink = {
  group: SeoLinkGroup;
  key: SeoPageKey;
  count: number;
  /** The page the visitor is on: shown, never linked. */
  current: boolean;
};

export const SEO_LINK_GROUP_ORDER: readonly SeoLinkGroup[] = ["districts", "sea", "rooms", "budget", "stage"];

/** City of a facet page, or the district it narrows. */
function placeOf(key: SeoPageKey): { city: string; district?: string } {
  if (key.family === "district") return { city: key.city, district: key.district };
  if (key.family === "facet") return { city: key.city, district: key.district };
  return { city: key.city };
}

function groupFor(from: SeoPageKey, target: SeoPageKey): SeoLinkGroup | null {
  if (target.country !== from.country || target.city !== from.city) return null;
  const place = placeOf(from);
  switch (target.family) {
    case "district":
      // District chips belong to the city and its city-wide slices.
      return place.district === undefined && from.family !== "cityType" ? "districts" : null;
    case "facet":
      return target.district === place.district && from.family !== "cityType" ? LISTING_FACETS[target.facet].kind : null;
    default:
      return null;
  }
}

/**
 * Links from `from` to its districts (on a city page) and to the facets of the
 * same place, in group order. The current page is kept as a
 * `current` entry when it would appear in the list, whatever its status.
 */
export function selectSeoLinks(input: {
  from: SeoPageKey;
  locale: string;
  candidates: readonly SeoLinkCandidate[];
}): SeoLink[] {
  const out: SeoLink[] = [];
  for (const { decision, count } of input.candidates) {
    const group = groupFor(input.from, decision.key);
    if (!group) continue;
    const current = sameSeoPageKey(decision.key, input.from);
    if (!current && !isSeoPageIndexableIn(decision, input.locale)) continue;
    if (count <= 0) continue;
    out.push({ group, key: decision.key, count, current });
  }
  // Districts largest first; facets in their defined order (1+1 before 2+1,
  // under 80k before under 100k), which reads better than by count.
  const facetRank = (link: SeoLink) => (link.key.family === "facet" ? LISTING_FACET_SLUGS.indexOf(link.key.facet) : 0);
  return out.sort(
    (a, b) =>
      SEO_LINK_GROUP_ORDER.indexOf(a.group) - SEO_LINK_GROUP_ORDER.indexOf(b.group) ||
      facetRank(a) - facetRank(b) ||
      b.count - a.count,
  );
}

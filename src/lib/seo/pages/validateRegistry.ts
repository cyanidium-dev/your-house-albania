/**
 * Guardrails over the keyword evidence. Run by the test suite, so a registry
 * that would create duplicate or unsupported pages fails CI instead of
 * reaching the index.
 */
import { routing } from "@/i18n/routing";
import { isListingFacetSlug } from "@/lib/catalog/listingFacets";
import { KEYWORD_CLUSTERS } from "./data/keywordEvidence";
import { isListingIntentCluster } from "./demand";
import { citySeoPageKey, sameSeoPageKey, seoPageId } from "./registry";
import type { KeywordCluster } from "./types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normKeyword = (k: string): string => k.trim().toLowerCase().replace(/\s+/g, " ");

export function validateSeoRegistry(clusters: readonly KeywordCluster[] = KEYWORD_CLUSTERS): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const keywordOwner = new Map<string, string>();
  const listingTarget = new Map<string, string>();

  for (const c of clusters) {
    if (ids.has(c.id)) errors.push(`duplicate cluster id "${c.id}"`);
    ids.add(c.id);

    const t = c.target;
    const slugs = [t.country, t.city, ...(t.family === "district" ? [t.district] : []), ...(t.family === "cityType" ? [t.type] : []), ...(t.family === "facet" && t.district ? [t.district] : [])];
    for (const s of slugs) if (!SLUG.test(s)) errors.push(`${c.id}: "${s}" is not a lowercase slug`);
    if (t.family === "facet" && !isListingFacetSlug(t.facet)) errors.push(`${c.id}: unknown facet "${t.facet}"`);

    if (c.sources.length === 0) errors.push(`${c.id}: no evidence source`);
    if (c.locales.length === 0) errors.push(`${c.id}: no locale`);
    for (const l of c.locales) {
      if (!(routing.locales as readonly string[]).includes(l)) errors.push(`${c.id}: unknown locale "${l}"`);
    }
    if (c.markets.length === 0) errors.push(`${c.id}: no market`);

    for (const k of [c.primaryKeyword, ...c.secondaryKeywords]) {
      const nk = normKeyword(k);
      const owner = keywordOwner.get(nk);
      if (owner && owner !== c.id) errors.push(`keyword "${nk}" is in both ${owner} and ${c.id}`);
      else if (owner === c.id) errors.push(`${c.id}: keyword "${nk}" listed twice`);
      keywordOwner.set(nk, c.id);
    }

    // One sale-intent cluster per page: a second one is a variation, not a page.
    if (isListingIntentCluster(c)) {
      const id = seoPageId(t);
      const other = listingTarget.get(id);
      if (other) errors.push(`${other} and ${c.id} both target ${id}: merge them`);
      listingTarget.set(id, c.id);
    }

    // A slice without its city's demand has no locales to be indexed in.
    if (t.family !== "city") {
      const city = citySeoPageKey(t);
      const hasCity = clusters.some((o) => isListingIntentCluster(o) && sameSeoPageKey(o.target, city));
      if (!hasCity) errors.push(`${c.id}: no listing cluster for its city ${seoPageId(city)}`);
    }
  }
  return errors;
}

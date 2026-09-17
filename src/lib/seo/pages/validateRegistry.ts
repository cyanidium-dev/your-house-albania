/**
 * Guardrails over the keyword evidence. Run by the test suite, so a registry
 * that would create duplicate or unsupported pages fails CI instead of
 * reaching the index.
 */
import { routing } from "@/i18n/routing";
import { isListingFacetSlug } from "@/lib/catalog/listingFacets";
import { SEO_EXPERIMENTS } from "./data/experiments";
import { KEYWORD_CLUSTERS } from "./data/keywordEvidence";
import { isListingIntentCluster } from "./demand";
import { citySeoPageKey, sameSeoPageKey, seoPageId } from "./registry";
import type { KeywordCluster, SeoExperiment } from "./types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normKeyword = (k: string): string => k.trim().toLowerCase().replace(/\s+/g, " ");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Experiments older than this are overdue: review them, do not let them run on. */
export const MAX_EXPERIMENT_DAYS = 120;

export function validateSeoRegistry(
  clusters: readonly KeywordCluster[] = KEYWORD_CLUSTERS,
  experiments: readonly SeoExperiment[] = SEO_EXPERIMENTS,
): string[] {
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

  const experimentIds = new Set<string>();
  const experimentTargets = new Set<string>();
  for (const e of experiments) {
    if (experimentIds.has(e.id)) errors.push(`duplicate experiment id "${e.id}"`);
    experimentIds.add(e.id);
    const target = seoPageId(e.target);
    if (experimentTargets.has(target)) errors.push(`two experiments target ${target}`);
    experimentTargets.add(target);
    if (e.target.family === "facet" && !isListingFacetSlug(e.target.facet)) errors.push(`${e.id}: unknown facet "${e.target.facet}"`);
    if (!e.hypothesis.trim()) errors.push(`${e.id}: no hypothesis`);
    if (!e.successCriteria.trim()) errors.push(`${e.id}: no success criteria`);
    if (!ISO_DATE.test(e.startedAt) || !ISO_DATE.test(e.reviewAt)) {
      errors.push(`${e.id}: dates must be YYYY-MM-DD`);
      continue;
    }
    const days = (Date.parse(e.reviewAt) - Date.parse(e.startedAt)) / 86_400_000;
    if (!(days > 0)) errors.push(`${e.id}: reviewAt must be after startedAt`);
    else if (days > MAX_EXPERIMENT_DAYS) errors.push(`${e.id}: runs ${days} days (> ${MAX_EXPERIMENT_DAYS})`);
    const city = citySeoPageKey(e.target);
    if (!clusters.some((o) => isListingIntentCluster(o) && sameSeoPageKey(o.target, city))) {
      errors.push(`${e.id}: no listing cluster for its city ${seoPageId(city)}, so no locale to index it in`);
    }
  }
  return errors;
}

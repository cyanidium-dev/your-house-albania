/**
 * Pages indexed on probation (ADR 007).
 *
 * Keyword Planner without ad spend returns no data for most long-tail
 * phrases, so "no data" is not proof of no demand. An experiment lets a page
 * with a clear commercial intent and real stock be indexed for a fixed period;
 * every other rule (inventory minimum, overlap with the parent, CMS noindex,
 * locales) still applies.
 *
 * At `reviewAt`, check the page in Search Console (docs/seo/measurement.md §
 * Experiments). Promote it — add a KEYWORD_CLUSTERS entry with the GSC queries
 * as evidence and delete the experiment — or delete the experiment and let the
 * page fall back to noindex. Never extend an experiment silently.
 */
import type { SeoExperiment } from "../types";

export const SEO_EXPERIMENTS: readonly SeoExperiment[] = [
  {
    id: "durres-under-100k",
    target: { family: "facet", country: "albania", city: "durres", facet: "under-100k" },
    hypothesis:
      "A price ceiling is a distinct commercial intent that Keyword Planner cannot size without spend; 106 listings, 28% of the public stock.",
    successCriteria:
      "Impressions from budget queries land on this URL (not on the city page) in at least two locales, and the page is indexed, not 'crawled – not indexed'.",
    startedAt: "2026-09-17",
    reviewAt: "2026-11-12",
  },
  {
    id: "durres-new-builds",
    target: { family: "facet", country: "albania", city: "durres", facet: "new-builds" },
    hypothesis:
      "Off-plan and under-construction flats are a distinct purchase (payment plans, developer risk); 45 listings. KP returned no data for 'new build durres' / 'apartamente ne ndertim durres'.",
    successCriteria:
      "Impressions from new-build / off-plan / 'ne ndertim' queries on this URL, and indexed.",
    startedAt: "2026-09-17",
    reviewAt: "2026-11-12",
  },
  {
    id: "durres-near-the-sea-data",
    target: { family: "facet", country: "albania", city: "durres", facet: "near-the-sea" },
    hypothesis:
      "Has keyword evidence (durres-near-sea), but sea distance is known for only 32% of listings, so the page shows a subset of what is actually near the sea.",
    successCriteria:
      "Indexed, impressions from beach / sea queries on this URL, and sea-distance coverage raised above 60% before the review.",
    startedAt: "2026-09-17",
    reviewAt: "2026-11-12",
  },
];

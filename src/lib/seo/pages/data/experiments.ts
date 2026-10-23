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
import type { ListingFacetSlug } from "@/lib/catalog/listingFacets";
import type { SeoExperiment } from "../types";


/**
 * Durrës district x facet pages (long-tail plan 2026-10-21, family F1). The
 * district pages inherit city demand only, so these stayed noindex; queries
 * like "1+1 golem", "apartamente plazh durres buze detit" are too small for
 * Keyword Planner to size. Each has 15+ live listings and is a real slice of
 * its district (no budget-under-80k twins of under-100k, no facet holding
 * almost the whole district). Listing count at launch in the hypothesis.
 */
function durresDistrictFacet(district: string, facet: ListingFacetSlug, listings: number): SeoExperiment {
  return {
    id: `durres-${district}-${facet}`,
    target: { family: "facet", country: "albania", city: "durres", district, facet },
    hypothesis: `District long tail: ${listings} listings in ${district} match ${facet}; searchers name the district ("${facet} ${district}") and land on the city page today.`,
    successCriteria:
      "Indexed (not 'crawled - not indexed') and impressions from district queries on this URL within the period. Stop rule: if under 30% of this batch is indexed after three weeks, roll the batch back.",
    startedAt: "2026-10-21",
    reviewAt: "2026-11-25",
  };
}

const DURRES_DISTRICT_FACETS: readonly SeoExperiment[] = [
  durresDistrictFacet("plazh", "near-the-sea", 138),
  durresDistrictFacet("golem-durres", "near-the-sea", 99),
  durresDistrictFacet("golem-durres", "1-1", 86),
  durresDistrictFacet("plazh", "1-1", 78),
  durresDistrictFacet("shkembi-durres", "near-the-sea", 60),
  durresDistrictFacet("golem-durres", "under-100k", 58),
  durresDistrictFacet("plazh", "under-100k", 53),
  durresDistrictFacet("plazh", "2-1", 44),
  durresDistrictFacet("shkembi-durres", "under-100k", 43),
  durresDistrictFacet("city-center-durres", "2-1", 43),
  durresDistrictFacet("golem-durres", "new-builds", 42),
  durresDistrictFacet("shkembi-durres", "1-1", 41),
  durresDistrictFacet("golem-durres", "2-1", 35),
  durresDistrictFacet("city-center-durres", "near-the-sea", 32),
  durresDistrictFacet("mali-i-robit", "near-the-sea", 30),
  durresDistrictFacet("mali-i-robit", "1-1", 28),
  durresDistrictFacet("mali-i-robit", "under-100k", 27),
  durresDistrictFacet("shkembi-durres", "2-1", 19),
];

/**
 * Shëngjin facet pages (2026-10-22). The stock went from 20 to 123 listings
 * (102 flats) when a local developer's catalogue was imported on 21-22.10,
 * which made Shëngjin the second seaside market of the site; the city has a
 * cluster (sq, en from Keyword Planner, five more locales from Search
 * Console), but no facet does, and the phrases ("apartamente ne shitje
 * shengjin buze detit", "1+1 shengjin") are too small for Keyword Planner.
 * Each slice is a distinct purchase: by the sea, a price ceiling, a layout.
 * Listing count at launch in the hypothesis; `under-80k` is left out as a
 * twin of `under-100k`, `new-builds` has four listings.
 *
 * `sea-view` added 2026-10-24 (45 of 123 listings carry the amenity, only 14
 * of them on the first line, 28 within `near-the-sea`): Google suggests
 * "apartamente ne shitje shengjin me pamje nga deti" and "sea view apartments
 * for sale shengjin albania" after the town, Ahrefs volumes due 2026-10-26.
 */
function shengjinFacet(facet: ListingFacetSlug, listings: number): SeoExperiment {
  return {
    id: `shengjin-${facet}`,
    target: { family: "facet", country: "albania", city: "shengjin", facet },
    hypothesis: `Shëngjin long tail: ${listings} of 123 listings match ${facet}; the SERP for the town is holiday rentals and two aggregators with a handful of flats each, so a page with this many live listings has no competitor of its kind.`,
    successCriteria:
      "Indexed (not 'crawled - not indexed') and impressions from Shëngjin queries on this URL in at least two locales within the period. Stop rule: under 30% of the batch indexed after three weeks, roll the batch back.",
    startedAt: "2026-10-22",
    reviewAt: "2026-11-26",
  };
}

const SHENGJIN_FACETS: readonly SeoExperiment[] = [
  shengjinFacet("near-the-sea", 66),
  shengjinFacet("sea-view", 45),
  shengjinFacet("under-100k", 69),
  shengjinFacet("1-1", 78),
  shengjinFacet("2-1", 26),
];

export const SEO_EXPERIMENTS: readonly SeoExperiment[] = [
  ...DURRES_DISTRICT_FACETS,
  ...SHENGJIN_FACETS,
  {
    id: "shengjin-studios",
    target: { family: "cityType", country: "albania", city: "shengjin", type: "studio" },
    hypothesis:
      "Studios are 17 of 123 Shëngjin listings (€35,200-65,000, the cheapest way in), a distinct purchase from a 1+1; Google suggests \"garsoniere shengjin\", \"shitet garsoniere shengjin\", \"garsoniere ne shitje shengjin\" (2026-10-24), too small for Keyword Planner. One listing above the cityType minimum: the page drops to noindex on its own if two studios sell.",
    successCriteria:
      "Indexed and impressions from garsoniere / studio queries on this URL in sq within the period, Ahrefs volume for the phrase recorded on 2026-10-26.",
    startedAt: "2026-10-24",
    reviewAt: "2026-11-26",
  },
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

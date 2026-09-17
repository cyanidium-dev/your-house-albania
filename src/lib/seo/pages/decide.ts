/**
 * From raw CMS rows to a decision for every listing page that has inventory.
 * Pure: `fetchSeoPageDecisions` fetches the rows, this decides.
 */
import { isSolePublicDealQuery } from "@/lib/catalog/publicDealTypes";
import { evaluateSeoPage } from "./eligibility";
import { collectSeoPageCandidates, type SeoInventoryRow } from "./inventory";
import type { KeywordCluster, SeoExperiment, SeoPageDecision } from "./types";

export type SeoDecisionSourceRows = {
  cities?: Array<{ citySlug?: string; countrySlug?: string; noIndex?: boolean }>;
  districts?: Array<{ citySlug?: string; districtSlug?: string }>;
  catalogNoIndex?: Array<{ pageScope?: string; citySlug?: string; districtSlug?: string }>;
  properties?: Array<{
    citySlug?: string;
    districtSlug?: string;
    deal?: string;
    typeSlug?: string;
    bedrooms?: number | null;
    price?: number | null;
    priceUnit?: string | null;
    constructionStage?: string | null;
    seaDistanceMeters?: number | null;
    beachfront?: boolean | null;
    _updatedAt?: string;
  }>;
};

/** `lastModified` is an ISO string because the cache serialises the result. */
export type SeoPageDecisionRow = {
  decision: SeoPageDecision;
  count: number;
  lastModified: string;
};

const lower = (v: unknown): string => (typeof v === "string" ? v.trim().toLowerCase() : "");

/**
 * Only published cities and districts count; a listing in an unpublished
 * district still counts for its city. Editorial noindex: the city document's
 * `seo.noIndex` or an active `catalogSeoPage` with `seo.noIndex` for the city
 * (every page of the city) or the district (its listing and facets).
 */
export function decideSeoPages(
  source: SeoDecisionSourceRows,
  clusters?: readonly KeywordCluster[],
  experiments?: readonly SeoExperiment[],
): SeoPageDecisionRow[] {
  const countryByCity = new Map<string, string>();
  const noindexCities = new Set<string>();
  for (const c of source.cities ?? []) {
    const city = lower(c.citySlug);
    const country = lower(c.countrySlug);
    if (!city || !country) continue;
    countryByCity.set(city, country);
    if (c.noIndex) noindexCities.add(city);
  }
  const publishedDistricts = new Set((source.districts ?? []).map((d) => `${lower(d.citySlug)}|${lower(d.districtSlug)}`));
  const noindexDistricts = new Set<string>();
  for (const doc of source.catalogNoIndex ?? []) {
    const city = lower(doc.citySlug);
    if (!city) continue;
    if (doc.pageScope === "city") noindexCities.add(city);
    else if (lower(doc.districtSlug)) noindexDistricts.add(`${city}|${lower(doc.districtSlug)}`);
  }

  const rows: SeoInventoryRow[] = [];
  for (const p of source.properties ?? []) {
    const city = lower(p.citySlug);
    const country = countryByCity.get(city);
    // Registry pages are sale pages; a listing of another deal is on none of them.
    if (!country || !isSolePublicDealQuery(lower(p.deal))) continue;
    const district = lower(p.districtSlug);
    const updated = p._updatedAt ? new Date(p._updatedAt) : new Date(0);
    rows.push({
      country,
      city,
      district: district && publishedDistricts.has(`${city}|${district}`) ? district : null,
      typeSlug: lower(p.typeSlug) || null,
      bedrooms: p.bedrooms,
      price: p.price,
      priceUnit: p.priceUnit,
      constructionStage: p.constructionStage,
      seaDistanceMeters: p.seaDistanceMeters,
      beachfront: p.beachfront,
      lastModified: Number.isNaN(updated.getTime()) ? new Date(0) : updated,
    });
  }

  return collectSeoPageCandidates(rows).map(({ key, inventory, lastModified }) => {
    const district = key.family === "district" || key.family === "facet" ? key.district : undefined;
    const editorialNoindex =
      noindexCities.has(key.city) || (district !== undefined && noindexDistricts.has(`${key.city}|${district}`));
    return {
      decision: evaluateSeoPage({ key, inventory, editorialNoindex, clusters, experiments }),
      count: inventory.count,
      lastModified: lastModified.toISOString(),
    };
  });
}

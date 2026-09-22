/**
 * From raw CMS rows to a decision for every listing page that has inventory.
 * Pure: `fetchSeoPageDecisions` fetches the rows, this decides.
 */
import { isSolePublicDealQuery } from "@/lib/catalog/publicDealTypes";
import { bulkTouchTimestamps, contentLastmod, latestDate } from "@/lib/seo/contentLastmod";
import { evaluateSeoPage } from "./eligibility";
import { collectSeoPageCandidates, type SeoInventoryRow } from "./inventory";
import type { KeywordCluster, SeoExperiment, SeoPageDecision } from "./types";

export type SeoDecisionSourceRows = {
  cities?: Array<{ citySlug?: string; countrySlug?: string; noIndex?: boolean }>;
  districts?: Array<{ citySlug?: string; districtSlug?: string }>;
  catalogNoIndex?: Array<{ pageScope?: string; citySlug?: string; districtSlug?: string }>;
  /**
   * Every active `catalogSeoPage` with its dates: the editorial copy of a city
   * or district page is part of that page, so its edit moves the page's
   * `lastmod` the same way a listing does.
   */
  catalogSeoPages?: Array<{
    pageScope?: string;
    citySlug?: string;
    districtSlug?: string;
    _updatedAt?: string;
    _createdAt?: string;
  }>;
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
    _createdAt?: string;
  }>;
};

/**
 * `lastModified` is an ISO string because the cache serialises the result;
 * `null` when no date of the page's documents is trustworthy (see
 * `contentLastmod`). It is the newest individual edit among the page's
 * listings and its `catalogSeoPage` copy.
 */
export type SeoPageDecisionRow = {
  decision: SeoPageDecision;
  count: number;
  lastModified: string | null;
};

/** Stands for "unknown" inside the inventory pass, whose rows carry a `Date`. */
const UNKNOWN_DATE = new Date(0);

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

  // Editorial copy dates, keyed like the page: `city` or `city|district`.
  const copyBulk = bulkTouchTimestamps(source.catalogSeoPages ?? []);
  const copyDates = new Map<string, Date>();
  for (const doc of source.catalogSeoPages ?? []) {
    const city = lower(doc.citySlug);
    if (!city) continue;
    const district = lower(doc.districtSlug);
    const key = doc.pageScope === "district" && district ? `${city}|${district}` : doc.pageScope === "city" ? city : null;
    if (!key) continue;
    const date = contentLastmod(doc, copyBulk, doc._createdAt);
    const newest = latestDate(copyDates.get(key), date);
    if (newest) copyDates.set(key, newest);
  }

  const rows: SeoInventoryRow[] = [];
  const propertyBulk = bulkTouchTimestamps(source.properties ?? []);
  for (const p of source.properties ?? []) {
    const city = lower(p.citySlug);
    const country = countryByCity.get(city);
    // Registry pages are sale pages; a listing of another deal is on none of them.
    if (!country || !isSolePublicDealQuery(lower(p.deal))) continue;
    const district = lower(p.districtSlug);
    const updated = contentLastmod(p, propertyBulk, p._createdAt) ?? UNKNOWN_DATE;
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
      lastModified: updated,
    });
  }

  return collectSeoPageCandidates(rows).map(({ key, inventory, lastModified }) => {
    const district = key.family === "district" || key.family === "facet" ? key.district : undefined;
    const editorialNoindex =
      noindexCities.has(key.city) || (district !== undefined && noindexDistricts.has(`${key.city}|${district}`));
    // The copy document of the place the page lists: the district's for a
    // district page and its facets, the city's for everything else.
    const copyDate = copyDates.get(district !== undefined ? `${key.city}|${district}` : key.city);
    const newest = latestDate(lastModified.getTime() > 0 ? lastModified : undefined, copyDate);
    return {
      decision: evaluateSeoPage({ key, inventory, editorialNoindex, clusters, experiments }),
      count: inventory.count,
      lastModified: newest ? newest.toISOString() : null,
    };
  });
}

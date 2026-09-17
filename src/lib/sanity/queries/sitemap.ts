import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG } from '@/lib/routes/catalog';
import { buildListingPath } from '@/lib/routes/listingRoutes';
import { isPublicDealQuery } from '@/lib/catalog/publicDealTypes';
import { LISTING_DEAL_TYPE_NOINDEX_THRESHOLD } from '@/lib/seo/listingIndexPolicy';
import { isIndexedSeoStatus, seoPagePath, type SeoPageKey } from '@/lib/seo/pages';
import {
  resolveLandingPathForSitemap,
  type LandingPageSitemapRow,
} from '../landingSitemapPaths';
import { RESERVED_GUIDE_SLUGS } from './guides';
import { AGENT_SLUG_REGEX } from './agent';
import { getClient } from './_core';
import { fetchSeoPageDecisions } from './seoPages';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';

function parseSitemapDate(raw: string | undefined): Date {
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export type AgentSitemapEntry = { slug: string; lastModified: Date };

/**
 * Published agents with valid path slugs for `/properties/agent/[slug]`.
 * Draft documents excluded via default API; slugs validated with `AGENT_SLUG_REGEX`.
 */
export async function fetchAllAgentSlugsForSitemap(): Promise<AgentSitemapEntry[]> {
  const client = getClient();
  if (!client) return [];
  // `isPublished != false` rather than `== true`: the flag was added to the
  // agent schema after these documents existed, so every current agent has it
  // undefined and must stay visible. Only an explicit uncheck hides one — which
  // is what the test-agent record needs, since the sitemap used to list every
  // agent document with no way to exclude it.
  const query = `*[_type == "agent" && defined(slug.current) && isPublished != false]{
    "slug": slug.current,
    _updatedAt
  }`;
  try {
    const rows = await client.fetch<Array<{ slug?: string; _updatedAt?: string }>>(query);
    if (!Array.isArray(rows)) return [];
    const out: AgentSitemapEntry[] = [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug || !AGENT_SLUG_REGEX.test(slug)) continue;
      out.push({
        slug,
        lastModified: parseSitemapDate(row._updatedAt),
      });
    }
    return out;
  } catch (err) {
    console.warn('[Sanity] fetchAllAgentSlugsForSitemap failed:', err);
    return [];
  }
}

export type LandingPathSitemapEntry = { path: string; lastModified: Date };

/**
 * Indexable CMS landing routes (paths after `/{locale}/`), deduped by path.
 * Only documents that map to a real App Router path via `resolveLandingPathForSitemap` are included.
 */
export async function fetchAllLandingPathsForSitemap(): Promise<LandingPathSitemapEntry[]> {
  const client = getClient();
  if (!client) return [];
  const query = `*[
    _type == "landingPage" &&
    enabled != false &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ]{
    _id,
    "slug": slug.current,
    _updatedAt,
    pageType,
    seo,
    "linkedCitySlug": linkedCity->slug.current,
    "linkedCityCountrySlug": linkedCity->country->slug.current
  }`;
  try {
    const rows = await client.fetch<LandingPageSitemapRow[]>(query);
    if (!Array.isArray(rows)) return [];
    const best = new Map<string, Date>();
    for (const row of rows) {
      const path = resolveLandingPathForSitemap(row);
      if (!path) continue;
      const lm = parseSitemapDate(row._updatedAt);
      const prev = best.get(path);
      if (!prev || lm > prev) best.set(path, lm);
    }
    return Array.from(best.entries()).map(([path, lastModified]) => ({ path, lastModified }));
  } catch (err) {
    console.warn('[Sanity] fetchAllLandingPathsForSitemap failed:', err);
    return [];
  }
}

/**
 * `locales`: emit the URL only in these locales; absent = every locale.
 * Registry pages carry the locales their decision indexes them in.
 */
export type SitemapSimpleEntry = { segmentAfterLocale: string; lastModified: Date; locales?: readonly string[] };

/** Path after `/{locale}/` of a registry page. */
function registrySegmentAfterLocale(key: SeoPageKey): string {
  return seoPagePath(key, 'en').replace(/^\/en\//, '');
}

/**
 * Indexed registry pages of the given families, one entry per page with the
 * locales it is indexed in. Same decisions the listing route applies to robots,
 * so the sitemap lists a URL exactly when the page says `index`.
 */
async function fetchRegistrySitemapEntries(
  include: (family: SeoPageKey['family']) => boolean
): Promise<SitemapSimpleEntry[]> {
  const rows = await fetchSeoPageDecisions();
  if (!rows) return [];
  return rows
    .filter((row) => isIndexedSeoStatus(row.decision.status) && include(row.decision.key.family))
    .map((row) => ({
      segmentAfterLocale: registrySegmentAfterLocale(row.decision.key),
      lastModified: parseSitemapDate(row.lastModified),
      locales: row.decision.indexableLocales,
    }));
}

/** City listings (`/{country}/{city}`) the registry indexes. Editorial pages use `/{country}/{slug}/info`. */
export async function fetchSitemapCityEntries(): Promise<SitemapSimpleEntry[]> {
  return fetchRegistrySitemapEntries((family) => family === 'city');
}

/**
 * District, city + type and facet listings the registry indexes. Deal-only
 * city pages are not registry pages: the sole public deal's one redirects to
 * the city listing, and hidden deals are noindexed.
 */
export async function fetchSitemapTypeEntries(): Promise<SitemapSimpleEntry[]> {
  return fetchRegistrySitemapEntries((family) => family !== 'city');
}

/** Segments after `/{locale}/` for national deal routes; uses `buildListingPath` with dummy locale `en`. */
function nonGeoListingSitemapSegmentAfterLocale(
  dealQuery: 'sale' | 'rent' | 'short-term',
  propertyTypeSlug?: string
): string {
  const path = buildListingPath({
    scope: 'catalog',
    locale: 'en',
    dealQuery,
    propertyType: propertyTypeSlug?.trim() || undefined,
  });
  return path.replace(/^\/en\//, '');
}

const NON_GEO_SITEMAP_DEAL_QUERIES = ['sale', 'rent', 'short-term'] as const;

/**
 * National deal listing URLs: `/sale`, `/rent`, `/short-term-rent` and `/deal/type` when count exceeds threshold.
 * Editorial `investment/*` paths are omitted here (landings sitemap only).
 */
export async function fetchSitemapNonGeoListingEntries(): Promise<SitemapSimpleEntry[]> {
  const client = getClient();
  if (!client) return [];

  const query = `{
    "propertyRows": *[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && defined(status) && defined(type->slug.current)]{
      "deal": status,
      "typeSlug": type->slug.current,
      _updatedAt
    }
  }`;

  try {
    const result = await client.fetch<{
      propertyRows?: Array<{ deal?: string; typeSlug?: string; _updatedAt?: string }>;
    }>(query);

    const dealLastMod = new Map<string, Date>();
    const typeCount = new Map<string, { count: number; lastmod: Date }>();

    for (const row of result?.propertyRows ?? []) {
      const dealRaw = typeof row.deal === 'string' ? row.deal.trim().toLowerCase() : '';
      let dealQuery: 'sale' | 'rent' | 'short-term' | null = null;
      let mapSeg: string | null = null;
      if (dealRaw === 'sale') {
        dealQuery = 'sale';
        mapSeg = 'sale';
      } else if (dealRaw === 'rent') {
        dealQuery = 'rent';
        mapSeg = 'rent';
      } else if (dealRaw === 'short-term') {
        dealQuery = 'short-term';
        mapSeg = 'short-term-rent';
      }
      if (!dealQuery || !mapSeg) continue;

      const lm = parseSitemapDate(row._updatedAt);
      const prevD = dealLastMod.get(mapSeg);
      if (!prevD || lm > prevD) dealLastMod.set(mapSeg, lm);

      const typeSlug = typeof row.typeSlug === 'string' ? row.typeSlug.trim().toLowerCase() : '';
      if (typeSlug) {
        const key = `${dealQuery}|${typeSlug}`;
        const prev = typeCount.get(key);
        if (!prev) typeCount.set(key, { count: 1, lastmod: lm });
        else {
          typeCount.set(key, {
            count: prev.count + 1,
            lastmod: lm > prev.lastmod ? lm : prev.lastmod,
          });
        }
      }
    }

    const staticNow = new Date();
    const out: SitemapSimpleEntry[] = [];

    for (const dq of NON_GEO_SITEMAP_DEAL_QUERIES) {
      // Rentals hidden from the public UI → excluded from sitemaps too.
      if (!isPublicDealQuery(dq)) continue;
      const seg = dq === 'short-term' ? 'short-term-rent' : dq;
      const lm = dealLastMod.get(seg) ?? staticNow;
      out.push({
        segmentAfterLocale: nonGeoListingSitemapSegmentAfterLocale(dq),
        lastModified: lm,
      });
    }

    for (const [key, value] of typeCount.entries()) {
      if (value.count <= LISTING_DEAL_TYPE_NOINDEX_THRESHOLD) continue;
      const pipe = key.indexOf('|');
      if (pipe < 0) continue;
      const dq = key.slice(0, pipe) as 'sale' | 'rent' | 'short-term';
      if (!isPublicDealQuery(dq)) continue;
      const typeSlug = key.slice(pipe + 1);
      if (!typeSlug || !['sale', 'rent', 'short-term'].includes(dq)) continue;
      out.push({
        segmentAfterLocale: nonGeoListingSitemapSegmentAfterLocale(dq, typeSlug),
        lastModified: value.lastmod,
      });
    }

    const dedup = new Map<string, Date>();
    for (const row of out) {
      const prev = dedup.get(row.segmentAfterLocale);
      if (!prev || row.lastModified > prev) dedup.set(row.segmentAfterLocale, row.lastModified);
    }

    return Array.from(dedup.entries()).map(([segmentAfterLocale, lastModified]) => ({
      segmentAfterLocale,
      lastModified,
    }));
  } catch (err) {
    console.warn('[Sanity] fetchSitemapNonGeoListingEntries failed:', err);
    return [];
  }
}

/** `locales` is `landingPage.locales` (SEO-04): emit the URL only for these; empty = every locale. */
export type SitemapGuideEntry = { slug: string; lastModified: Date; locales: string[] };

/**
 * Enabled custom landings for `sitemap-landings.xml` → `/{locale}/guides/{slug}`.
 * Reserved slugs (dedicated routes that 301 away from `/guides/*`, incl.
 * `for-realtors`, which `sitemap-static.xml` emits) are excluded with the same
 * list the guides index uses — ТЗ-17 replaced the lone special case.
 */
export async function fetchSitemapGuideEntries(): Promise<SitemapGuideEntry[]> {
  const client = getClient();
  if (!client) return [];
  const query = `*[
    _type == "landingPage" &&
    pageType == "custom" &&
    enabled != false &&
    defined(slug.current) &&
    !(slug.current in $reserved) &&
    !(_id in path("drafts.**")) &&
    (!defined(seo.noIndex) || seo.noIndex != true)
  ]{
    "slug": slug.current,
    _updatedAt,
    locales
  }`;
  try {
    const rows = await client.fetch<Array<{ slug?: string; _updatedAt?: string; locales?: unknown }>>(query, {
      reserved: RESERVED_GUIDE_SLUGS,
    });
    if (!Array.isArray(rows)) return [];
    const best = new Map<string, { lastModified: Date; locales: string[] }>();
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim().toLowerCase() : '';
      if (!slug) continue;
      const lm = parseSitemapDate(row._updatedAt);
      const locales = Array.isArray(row.locales)
        ? row.locales.map((l) => (typeof l === 'string' ? l.trim().toLowerCase() : '')).filter(Boolean)
        : [];
      const prev = best.get(slug);
      if (!prev || lm > prev.lastModified) best.set(slug, { lastModified: lm, locales });
    }
    return Array.from(best.entries()).map(([slug, v]) => ({ slug, lastModified: v.lastModified, locales: v.locales }));
  } catch (err) {
    console.warn('[Sanity] fetchSitemapGuideEntries failed:', err);
    return [];
  }
}

export type SitemapDistrictEntry = {
  countrySlug: string;
  citySlug: string;
  slug: string;
  lastModified: Date;
};

/**
 * Published districts for `sitemap-districts.xml` → `/{locale}/{country}/{city}/districts/{slug}`.
 * Hub URLs (`…/districts`) are derived from these rows by the route.
 */
export async function fetchSitemapDistrictEntries(): Promise<SitemapDistrictEntry[]> {
  const client = getClient();
  if (!client) return [];
  const query = `*[
    _type == "district" &&
    isPublished != false &&
    city->isPublished != false &&
    defined(slug.current) &&
    defined(city->slug.current) &&
    (!defined(seo.noIndex) || seo.noIndex != true)
  ]{
    "slug": slug.current,
    "citySlug": city->slug.current,
    "countrySlug": city->country->slug.current,
    _updatedAt
  }`;
  try {
    const rows = await client.fetch<
      Array<{ slug?: string; citySlug?: string; countrySlug?: string; _updatedAt?: string }>
    >(query);
    if (!Array.isArray(rows)) return [];
    const best = new Map<string, SitemapDistrictEntry>();
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim().toLowerCase() : '';
      const citySlug = typeof row.citySlug === 'string' ? row.citySlug.trim().toLowerCase() : '';
      if (!slug || !citySlug) continue;
      const countrySlug =
        typeof row.countrySlug === 'string' && row.countrySlug.trim()
          ? row.countrySlug.trim().toLowerCase()
          : LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
      const key = `${countrySlug}|${citySlug}|${slug}`;
      const lm = parseSitemapDate(row._updatedAt);
      const prev = best.get(key);
      if (!prev || lm > prev.lastModified) {
        best.set(key, { countrySlug, citySlug, slug, lastModified: lm });
      }
    }
    return Array.from(best.values());
  } catch (err) {
    console.warn('[Sanity] fetchSitemapDistrictEntries failed:', err);
    return [];
  }
}

export type SitemapPropertyEntry = { slug: string; lastModified: Date };

export async function fetchSitemapPropertyEntries(): Promise<SitemapPropertyEntry[]> {
  const client = getClient();
  if (!client) return [];
  const query = `*[_type == "property" && defined(slug.current) && ${PUBLISHED_PROPERTY_FILTER} && (!defined(seo.noIndex) || seo.noIndex != true)]{
    "slug": slug.current,
    _updatedAt
  }`;
  try {
    const rows = await client.fetch<Array<{ slug?: string; _updatedAt?: string }>>(query);
    if (!Array.isArray(rows)) return [];
    const out: SitemapPropertyEntry[] = [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug) continue;
      out.push({
        slug,
        lastModified: parseSitemapDate(row._updatedAt),
      });
    }
    return out;
  } catch (err) {
    console.warn('[Sanity] fetchSitemapPropertyEntries failed:', err);
    return [];
  }
}

export type SitemapBlogEntry = { slug: string; lastModified: Date };

export async function fetchSitemapBlogEntries(): Promise<SitemapBlogEntry[]> {
  const client = getClient();
  if (!client) return [];
  const query = `*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() && defined(slug.current) && (!defined(seo.noIndex) || seo.noIndex != true)]{
    "slug": slug.current,
    _updatedAt
  }`;
  try {
    const rows = await client.fetch<Array<{ slug?: string; _updatedAt?: string }>>(query);
    if (!Array.isArray(rows)) return [];
    const out: SitemapBlogEntry[] = [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug) continue;
      out.push({
        slug,
        lastModified: parseSitemapDate(row._updatedAt),
      });
    }
    return out;
  } catch (err) {
    console.warn('[Sanity] fetchSitemapBlogEntries failed:', err);
    return [];
  }
}


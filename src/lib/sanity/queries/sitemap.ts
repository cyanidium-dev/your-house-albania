import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG } from '@/lib/routes/catalog';
import { buildListingPath } from '@/lib/routes/listingRoutes';
import { isPublicDealQuery } from '@/lib/catalog/publicDealTypes';
import { LISTING_DEAL_TYPE_NOINDEX_THRESHOLD } from '@/lib/seo/listingIndexPolicy';
import { isIndexedSeoStatus, seoPagePath, type SeoPageKey } from '@/lib/seo/pages';
import { agentBioText, isAgentPageIndexable } from '@/lib/seo/agentIndexPolicy';
import {
  resolveLandingPathForSitemap,
  type LandingPageSitemapRow,
} from '../landingSitemapPaths';
import { RESERVED_GUIDE_SLUGS } from './guides';
import { AGENT_SLUG_REGEX } from './agent';
import { getClient } from './_core';
import type { LocalizedSlug } from '@/lib/property/propertyUrl';
import { fetchSeoPageDecisions } from './seoPages';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import { canonicalPropertyImageUrl, propertyImageSeoName, withImageSeoName } from '@/lib/images/propertyImageUrl';
import { SITEMAP_IMAGES_PER_URL } from '@/lib/seo/propertySitemap';
import { bulkTouchTimestamps, contentLastmod, latestDate, parseDateOrUndefined } from '@/lib/seo/contentLastmod';
import { PROPERTY_URL_LOCALES } from '@/lib/property/propertyUrl';

/**
 * Every `lastModified` below is `undefined` when the document's dates say
 * nothing trustworthy (see `contentLastmod`); the sitemap then omits the
 * element. It used to fall back to the time of the request, which told the
 * crawler that every such page had just changed — on every regeneration.
 */
const parseSitemapDate = parseDateOrUndefined;

export type AgentSitemapEntry = { slug: string; lastModified?: Date };

/**
 * Published agents with valid path slugs for `/agent/[slug]` — only those whose
 * page is indexable, i.e. whose document carries a bio and a photograph
 * (`isAgentPageIndexable`, the same predicate the page's robots tag uses).
 * Every other agent page is `noindex, follow`, and a sitemap that lists a
 * noindex URL is a contradiction the crawler reports back as an error.
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
    _updatedAt,
    _createdAt,
    isPublished,
    bio,
    "photoUrl": photo.asset->url
  }`;
  try {
    const rows = await client.fetch<
      Array<{
        slug?: string;
        _updatedAt?: string;
        _createdAt?: string;
        isPublished?: boolean;
        bio?: unknown;
        photoUrl?: string;
      }>
    >(query);
    if (!Array.isArray(rows)) return [];
    const bulk = bulkTouchTimestamps(rows);
    const out: AgentSitemapEntry[] = [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug || !AGENT_SLUG_REGEX.test(slug)) continue;
      if (
        !isAgentPageIndexable({
          bio: agentBioText(row.bio),
          photo: { url: row.photoUrl },
          isPublished: row.isPublished,
        })
      ) {
        continue;
      }
      out.push({
        slug,
        lastModified: contentLastmod(row, bulk, row._createdAt),
      });
    }
    return out;
  } catch (err) {
    console.warn('[Sanity] fetchAllAgentSlugsForSitemap failed:', err);
    return [];
  }
}

export type LandingPathSitemapEntry = { path: string; lastModified?: Date };

/**
 * A landing's date: an individual save, else the editor's own
 * `contentUpdatedAt` (the "Updated" badge the page shows), else creation.
 */
export function landingLastmod(
  row: { _updatedAt?: string; _createdAt?: string; contentUpdatedAt?: string },
  bulk: ReadonlySet<string>,
): Date | undefined {
  return contentLastmod(row, bulk, row.contentUpdatedAt, row._createdAt);
}

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
    _createdAt,
    contentUpdatedAt,
    pageType,
    seo,
    "linkedCitySlug": linkedCity->slug.current,
    "linkedCityCountrySlug": linkedCity->country->slug.current
  }`;
  try {
    const rows = await client.fetch<LandingPageSitemapRow[]>(query);
    if (!Array.isArray(rows)) return [];
    const bulk = bulkTouchTimestamps(rows);
    const best = new Map<string, Date | undefined>();
    for (const row of rows) {
      const path = resolveLandingPathForSitemap(row);
      if (!path) continue;
      const lm = landingLastmod(row, bulk);
      if (!best.has(path)) best.set(path, lm);
      else best.set(path, latestDate(best.get(path), lm));
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
export type SitemapSimpleEntry = { segmentAfterLocale: string; lastModified?: Date; locales?: readonly string[] };

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

/**
 * Every listing page the registry indexes, as sitemap entries — the same
 * list `sitemap-cities.xml` and `sitemap-types.xml` split between them.
 */
export async function fetchSitemapRegistryEntries(): Promise<SitemapSimpleEntry[]> {
  return fetchRegistrySitemapEntries(() => true);
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
export function nonGeoListingSitemapSegmentAfterLocale(
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
      _updatedAt,
      _createdAt
    }
  }`;

  try {
    const result = await client.fetch<{
      propertyRows?: Array<{ deal?: string; typeSlug?: string; _updatedAt?: string; _createdAt?: string }>;
    }>(query);

    const propertyRows = result?.propertyRows ?? [];
    const bulk = bulkTouchTimestamps(propertyRows);
    const dealLastMod = new Map<string, Date | undefined>();
    const typeCount = new Map<string, { count: number; lastmod: Date | undefined }>();

    for (const row of propertyRows) {
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

      const lm = contentLastmod(row, bulk, row._createdAt);
      dealLastMod.set(mapSeg, latestDate(dealLastMod.get(mapSeg), lm));

      const typeSlug = typeof row.typeSlug === 'string' ? row.typeSlug.trim().toLowerCase() : '';
      if (typeSlug) {
        const key = `${dealQuery}|${typeSlug}`;
        const prev = typeCount.get(key);
        if (!prev) typeCount.set(key, { count: 1, lastmod: lm });
        else {
          typeCount.set(key, {
            count: prev.count + 1,
            lastmod: latestDate(prev.lastmod, lm),
          });
        }
      }
    }

    const out: SitemapSimpleEntry[] = [];

    for (const dq of NON_GEO_SITEMAP_DEAL_QUERIES) {
      // Rentals hidden from the public UI → excluded from sitemaps too.
      if (!isPublicDealQuery(dq)) continue;
      const seg = dq === 'short-term' ? 'short-term-rent' : dq;
      const lm = dealLastMod.get(seg);
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

    const dedup = new Map<string, Date | undefined>();
    for (const row of out) {
      dedup.set(
        row.segmentAfterLocale,
        dedup.has(row.segmentAfterLocale) ? latestDate(dedup.get(row.segmentAfterLocale), row.lastModified) : row.lastModified,
      );
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
export type SitemapGuideEntry = { slug: string; lastModified?: Date; locales: string[] };

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
    _createdAt,
    contentUpdatedAt,
    locales
  }`;
  try {
    const rows = await client.fetch<
      Array<{ slug?: string; _updatedAt?: string; _createdAt?: string; contentUpdatedAt?: string; locales?: unknown }>
    >(query, {
      reserved: RESERVED_GUIDE_SLUGS,
    });
    if (!Array.isArray(rows)) return [];
    const bulk = bulkTouchTimestamps(rows);
    const best = new Map<string, { lastModified?: Date; locales: string[] }>();
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim().toLowerCase() : '';
      if (!slug) continue;
      const lm = landingLastmod(row, bulk);
      const locales = Array.isArray(row.locales)
        ? row.locales.map((l) => (typeof l === 'string' ? l.trim().toLowerCase() : '')).filter(Boolean)
        : [];
      const prev = best.get(slug);
      if (!prev || (lm && (!prev.lastModified || lm > prev.lastModified))) best.set(slug, { lastModified: lm, locales });
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
  lastModified?: Date;
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
    _updatedAt,
    _createdAt
  }`;
  try {
    const rows = await client.fetch<
      Array<{ slug?: string; citySlug?: string; countrySlug?: string; _updatedAt?: string; _createdAt?: string }>
    >(query);
    if (!Array.isArray(rows)) return [];
    const bulk = bulkTouchTimestamps(rows);
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
      const lm = contentLastmod(row, bulk, row._createdAt);
      const prev = best.get(key);
      if (!prev || (lm && (!prev.lastModified || lm > prev.lastModified))) {
        best.set(key, { countrySlug, citySlug, slug, lastModified: lm });
      }
    }
    return Array.from(best.values());
  } catch (err) {
    console.warn('[Sanity] fetchSitemapDistrictEntries failed:', err);
    return [];
  }
}

export type SitemapPropertyEntry = {
  slug: string;
  localizedSlug: LocalizedSlug;
  /** Last individual edit, else creation (`contentLastmod`); never the import's bulk stamp. */
  lastModified?: Date;
  /** First photos of the gallery, under the one URL every other surface publishes. */
  images: string[];
  /** Photos, a price and a description: the listings a crawler should reach first. */
  complete: boolean;
  /** Locales whose page shows the listing's own text, not the English fallback. */
  ownTextLocales: readonly string[];
};

/** Gallery asset URLs → canonical named URLs, position preserved. */
export function sitemapImageUrls(urls: Array<string | null> | undefined, seoName: string): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .map((url, idx) =>
      typeof url === 'string' && url ? canonicalPropertyImageUrl(withImageSeoName(url, seoName, idx + 1)) : '',
    )
    .filter(Boolean);
}

/**
 * GROQ: the listing has text of its own in `locale`. The partner import seeds
 * every locale with the Albanian source (`setIfMissing`) until the translation
 * script overwrites it, so a title or description equal to the `sq` one is
 * the fallback wearing that locale's URL, not a translation. The page itself
 * falls back to English for a missing field (`resolveLocalizedString`).
 */
function ownTextInLocaleGroq(locale: string): string {
  const has = (field: string) => `coalesce(length(${field}.${locale}), 0) > 0`;
  if (locale === 'sq') return `(${has('title')} || ${has('description')})`;
  return `((${has('title')} && title.${locale} != title.sq) || (${has('description')} && description.${locale} != description.sq))`;
}

export async function fetchSitemapPropertyEntries(): Promise<SitemapPropertyEntry[]> {
  const client = getClient();
  if (!client) return [];
  const ownText = PROPERTY_URL_LOCALES.map((l) => `"${l}": ${ownTextInLocaleGroq(l)}`).join(', ');
  const query = `*[_type == "property" && defined(slug.current) && ${PUBLISHED_PROPERTY_FILTER} && (!defined(seo.noIndex) || seo.noIndex != true)]{
    "slug": slug.current,
    localizedSlug,
    _updatedAt,
    _createdAt,
    price,
    // Same order and the same filter as the listing page's gallery, so photo
    // N here carries the file name photo N has there.
    "images": gallery[defined(asset)][0...${SITEMAP_IMAGES_PER_URL}].asset->url,
    "hasDescription": coalesce(length(description.en), 0) > 0 || coalesce(length(description.sq), 0) > 0,
    "ownText": { ${ownText} },
    bedrooms,
    "typeSlug": type->slug.current,
    "districtSlug": district->slug.current,
    "citySlug": city->slug.current
  }`;
  try {
    const rows = await client.fetch<
      Array<{
        slug?: string;
        localizedSlug?: LocalizedSlug;
        _updatedAt?: string;
        _createdAt?: string;
        price?: number | null;
        images?: Array<string | null>;
        hasDescription?: boolean;
        ownText?: Partial<Record<string, boolean>>;
        bedrooms?: number;
        typeSlug?: string;
        districtSlug?: string;
        citySlug?: string;
      }>
    >(query);
    if (!Array.isArray(rows)) return [];
    const bulk = bulkTouchTimestamps(rows);
    const out: SitemapPropertyEntry[] = [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug) continue;
      const images = sitemapImageUrls(row.images, propertyImageSeoName(row));
      out.push({
        slug,
        localizedSlug: row.localizedSlug ?? null,
        lastModified: contentLastmod(row, bulk, row._createdAt),
        images,
        complete: images.length > 0 && typeof row.price === 'number' && row.price > 0 && row.hasDescription === true,
        ownTextLocales: PROPERTY_URL_LOCALES.filter((l) => row.ownText?.[l] === true),
      });
    }
    return out;
  } catch (err) {
    console.warn('[Sanity] fetchSitemapPropertyEntries failed:', err);
    return [];
  }
}

export type SitemapBlogEntry = { slug: string; lastModified?: Date };

/**
 * Published posts with an honest date: an individual save in Studio, else
 * `publishedAt` — the locale scripts stamp every post at once, and that
 * stamp says nothing about the article.
 */
export async function fetchSitemapBlogEntries(): Promise<SitemapBlogEntry[]> {
  const client = getClient();
  if (!client) return [];
  const query = `*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() && defined(slug.current) && (!defined(seo.noIndex) || seo.noIndex != true)]{
    "slug": slug.current,
    _updatedAt,
    publishedAt
  }`;
  try {
    const rows = await client.fetch<Array<{ slug?: string; _updatedAt?: string; publishedAt?: string }>>(query);
    if (!Array.isArray(rows)) return [];
    const bulk = bulkTouchTimestamps(rows);
    const out: SitemapBlogEntry[] = [];
    for (const row of rows) {
      const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
      if (!slug) continue;
      out.push({
        slug,
        lastModified: contentLastmod(row, bulk, row.publishedAt),
      });
    }
    return out;
  } catch (err) {
    console.warn('[Sanity] fetchSitemapBlogEntries failed:', err);
    return [];
  }
}


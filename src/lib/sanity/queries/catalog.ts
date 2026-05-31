import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { resolveLocalizedString, resolveLocalizedContent } from '../localized';
import { PUBLISHED_PROPERTY_FILTER, publishedPropertyFilter } from '../groq/propertyFilters';
import type { PropertyCatalogBanner } from '@/types/propertyCatalogBanner';
import type { CatalogFilters, CatalogProperty, CatalogResult } from '@/types/catalog';

const cachedFetchCatalogAreaBoundsFromData = sanityCache(
  async () => {
    const client = getClient();
    if (!client) return null;
    const query = `{
      "min": *[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && defined(area) && area > 0] | order(area asc)[0].area,
      "max": *[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && defined(area) && area > 0] | order(area desc)[0].area
    }`;
    try {
      const result = await client.fetch<{ min?: number; max?: number }>(query);
      if (
        typeof result?.min === 'number' &&
        typeof result?.max === 'number' &&
        Number.isFinite(result.min) &&
        Number.isFinite(result.max)
      ) {
        return { min: result.min, max: result.max };
      }
      return null;
    } catch (err) {
      console.warn('[Sanity] fetchCatalogAreaBoundsFromData failed:', err);
      return null;
    }
  },
  ['sanity-catalog-area-bounds'],
  { revalidate: 120, tags: [SANITY_TAGS.property] },
);

/**
 * Min/max area from published properties (m²). Used when CMS areaRange is absent.
 */
export async function fetchCatalogAreaBoundsFromData(): Promise<{
  min: number;
  max: number;
} | null> {
  return cachedFetchCatalogAreaBoundsFromData();
}


type CatalogWhereParams = {
  where: string;
  params: Record<string, unknown>;
};

function buildCatalogPredicateParts(
  prefix: string,
  filters: Pick<
    CatalogFilters,
    | 'agentSlug'
    | 'city'
    | 'district'
    | 'type'
    | 'deal'
    | 'minPrice'
    | 'maxPrice'
    | 'minArea'
    | 'maxArea'
    | 'beds'
    | 'amenities'
    | 'excludedPropertyIds'
  >,
): string[] {
  const {
    agentSlug,
    city,
    district,
    type,
    deal,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    beds,
    amenities,
    excludedPropertyIds,
  } = filters;

  const parts: string[] = [];

  if (agentSlug) {
    parts.push(`${prefix}agent->slug.current == $agentSlug`);
  }
  if (city) {
    parts.push(`${prefix}city->slug.current == $city`);
  }
  if (district) {
    parts.push(`${prefix}district->slug.current == $district`);
  }
  if (type) {
    parts.push(`${prefix}type->slug.current == $type`);
  }
  if (deal) {
    parts.push(`${prefix}status == $deal`);
  }
  if (typeof minPrice === 'number' && minPrice > 0) {
    parts.push(`${prefix}price >= $minPrice`);
  }
  if (typeof maxPrice === 'number' && maxPrice > 0) {
    parts.push(`${prefix}price <= $maxPrice`);
  }
  if (typeof minArea === 'number' && minArea > 0) {
    parts.push(`${prefix}area >= $minArea`);
  }
  if (typeof maxArea === 'number' && maxArea > 0) {
    parts.push(`${prefix}area <= $maxArea`);
  }
  if (typeof beds === 'number' && beds > 0) {
    parts.push(`${prefix}bedrooms >= $beds`);
  }

  if (Array.isArray(amenities) && amenities.length > 0) {
    parts.push(`count(${prefix}amenitiesRefs[@->slug.current in $amenities]) > 0`);
  }

  if (Array.isArray(excludedPropertyIds) && excludedPropertyIds.length > 0) {
    parts.push(`!(${prefix}_id in $excludedPropertyIds)`);
  }

  return parts;
}

function buildCatalogWhereClause(filters: CatalogFilters): CatalogWhereParams {
  const { excludedPropertyIds } = filters;

  const parts: string[] = ['_type == "property"', publishedPropertyFilter()];
  parts.push(...buildCatalogPredicateParts('', filters));

  const where = parts.length > 0 ? parts.join(' && ') : 'true';
  const params: Record<string, unknown> = {
    agentSlug: filters.agentSlug,
    city: filters.city,
    district: filters.district,
    type: filters.type,
    deal: filters.deal,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minArea: filters.minArea,
    maxArea: filters.maxArea,
    beds: filters.beds,
    amenities: filters.amenities,
    excludedPropertyIds,
  };

  return { where, params };
}

const cachedFetchCatalogProperties = sanityCache(
  async (filters: CatalogFilters): Promise<CatalogResult | null> => {
  const client = getClient();
  if (!client) return null;

  const { sort = 'newest', page = 1, pageSize = 12 } = filters;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 48
      ? pageSize
      : 12;
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;

  const { where, params } = buildCatalogWhereClause(filters);

  // Numeric ranks: promoted vs not; tier (premium > top > sale); featuredOrder with missing last in tier.
  const promotionOrder =
    'select(promoted == true => 1, 0) desc, select(promotionType == "premium" => 3, promotionType == "top" => 2, promotionType == "sale" => 1, 0) desc, coalesce(featuredOrder, 999999) asc';
  let order = `| order(${promotionOrder}, _createdAt desc)`;
  if (sort === 'priceAsc') order = `| order(${promotionOrder}, price asc)`;
  else if (sort === 'priceDesc') order = `| order(${promotionOrder}, price desc)`;
  else if (sort === 'areaAsc') order = `| order(${promotionOrder}, area asc)`;
  else if (sort === 'areaDesc') order = `| order(${promotionOrder}, area desc)`;
  else order = `| order(${promotionOrder}, _createdAt desc)`;

  const baseFilter = `*${where ? `[${where}]` : ''}`;
  const orderedSelector = `${baseFilter} ${order}`;

  const countQuery = `count(${baseFilter})`;
  const pageQuery = `${orderedSelector}[${start}...${end}] {
    _id,
    _type,
    title,
    "slug": slug.current,
    price,
    currency,
    area,
    bedrooms,
    bathrooms,
    status,
    promoted,
    promotionType,
    featuredOrder,
    discountPercent,
    investment,
    coordinatesLat,
    coordinatesLng,
    "city": city-> {
      _id,
      title,
      "slug": slug.current
    },
    "district": district-> {
      _id,
      title,
      "slug": slug.current,
      "citySlug": city->slug.current
    },
    "type": type-> {
      _id,
      title,
      "slug": slug.current
    },
    description,
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url
  }`;

  try {
    const [totalCount, items] = await Promise.all([
      client.fetch<number>(countQuery, params),
      client.fetch<CatalogProperty[]>(pageQuery, params),
    ]);

    return {
      items: Array.isArray(items) ? items : [],
      totalCount: typeof totalCount === 'number' ? totalCount : 0,
    };
  } catch (err) {
    console.warn('[Sanity] fetchCatalogProperties failed:', err);
    return null;
  }
  },
  ['sanity-catalog-properties'],
  {
    revalidate: 60,
    tags: [
      SANITY_TAGS.property,
      SANITY_TAGS.city,
      SANITY_TAGS.district,
      SANITY_TAGS.propertyType,
    ],
  },
);

/** Fetch paginated catalog properties with filters. */
export async function fetchCatalogProperties(
  filters: CatalogFilters,
): Promise<CatalogResult | null> {
  return cachedFetchCatalogProperties(filters);
}

type PropertyCatalogBannerCandidate = {
  _key?: string;
  internalLabel?: string;
  enabled?: boolean;
  order?: number;
  imageSmall?: { alt?: string; asset?: { url?: string } };
  imageBig?: { alt?: string; asset?: { url?: string } };
  property?: { _id?: string; slug?: string };
};

/**
 * Fetches up to 3 **eligible** catalog banners for `/[locale]/properties` given current catalog filters.
 *
 * This pushes most narrowing into GROQ:
 * - enabled only
 * - linked property exists, has slug
 * - linked property is not a draft
 * - linked property matches current catalog filters
 * - required images exist for both small and big variants
 *
 * Remaining small JS step:
 * - dedupe by linked `property._id` (CMS can accidentally duplicate)
 */
export async function fetchSelectedPropertyCatalogBanners(args: {
  locale: string;
  filters: Omit<CatalogFilters, 'page' | 'pageSize' | 'sort' | 'excludedPropertyIds'>;
  limit?: number;
}): Promise<PropertyCatalogBanner[]> {
  const client = getClient();
  if (!client) return [];

  const limit = typeof args.limit === 'number' && Number.isFinite(args.limit) && args.limit > 0
    ? Math.min(Math.floor(args.limit), 3)
    : 3;
  const locale = args.locale;

  const predicateParts = [
    publishedPropertyFilter('property->'),
    ...buildCatalogPredicateParts('property->', {
      ...args.filters,
      excludedPropertyIds: undefined,
    }),
  ];
  const propertyEligibility = predicateParts.length > 0 ? predicateParts.join(' && ') : 'true';

  // Pull a small, ordered window then dedupe-by-property-id in JS (GROQ can't reliably unique array objects by a nested field).
  const windowSize = Math.max(12, limit * 4);

  const query = `*[_type == "siteSettings" && _id == "siteSettings"][0]{
    "banners": coalesce(
      propertySettings.propertyCatalogBanners[
        enabled == true &&
        defined(property) &&
        defined(property->_id) &&
        !(property->_id in path("drafts.**")) &&
        defined(property->slug.current) &&
        ${propertyEligibility} &&
        defined(imageSmall.asset) &&
        defined(imageBig.asset) &&
        defined(imageSmall.alt) &&
        defined(imageBig.alt)
      ] | order(order asc, _key asc)[0...${windowSize}]{
        _key,
        "internalLabel": label,
        enabled,
        order,
        imageSmall{alt,asset->{url}},
        imageBig{alt,asset->{url}},
        "property": property->{
          _id,
          "slug": slug.current
        }
      },
      []
    )
  }.banners`;

  const { params } = buildCatalogWhereClause({
    ...args.filters,
    sort: 'newest',
    page: 1,
    pageSize: 1,
    excludedPropertyIds: undefined,
  });

  let candidates: PropertyCatalogBannerCandidate[] = [];
  try {
    const result = await client.fetch<PropertyCatalogBannerCandidate[] | null>(query, params);
    candidates = Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('[Sanity] fetchSelectedPropertyCatalogBanners failed:', err);
    return [];
  }

  const byPropertyId = new Map<string, PropertyCatalogBannerCandidate>();
  for (const c of candidates) {
    const pid = c?.property?._id;
    if (!pid || typeof pid !== 'string') continue;
    if (byPropertyId.has(pid)) continue; // keep first (already ordered)
    byPropertyId.set(pid, c);
  }

  const selected = Array.from(byPropertyId.values()).slice(0, limit);

  return selected.map((b, idx) => {
    const pid = b.property!._id!;
    const slug = b.property!.slug!;
    const key =
      typeof b._key === 'string' && b._key.trim()
        ? b._key
        : `catalog-banner-${idx}-${pid}`;
    const imageSmallUrl = b.imageSmall?.asset?.url ?? '';
    const imageSmallAlt = b.imageSmall?.alt ?? '';
    const imageBigUrl = b.imageBig?.asset?.url ?? '';
    const imageBigAlt = b.imageBig?.alt ?? '';
    return {
      key,
      propertyId: pid,
      propertySlug: slug,
      href: `/${locale}/property/${slug}`,
      imageSmallUrl,
      imageSmallAlt,
      imageBigUrl,
      imageBigAlt,
    };
  });
}

export type CatalogLocationOption = {
  value: string;
  label: string;
  /** Sanity `city.country->slug.current` */
  countrySlug?: string;
};

export type CatalogTypeOption = {
  value: string;
  label: string;
};

export type CatalogAmenityOption = {
  value: string;
  label: string;
};

export type CatalogDistrictOption = {
  value: string;
  label: string;
  citySlug?: string;
};

export type CatalogFilterOptions = {
  locations: CatalogLocationOption[];
  propertyTypes: CatalogTypeOption[];
  amenities: CatalogAmenityOption[];
  districts: CatalogDistrictOption[];
};

type RawFilterItem = { value?: string; title?: unknown; citySlug?: string; countrySlug?: string };

function mapToLocalizedOption(
  x: RawFilterItem,
  locale: string
): { value: string; label: string } {
  const rawTitle = x.title as
    | { en?: string; uk?: string; ru?: string; sq?: string; it?: string }
    | string
    | null
    | undefined;
  const localized =
    typeof rawTitle === 'object' && rawTitle !== null
      ? resolveLocalizedString(rawTitle as never, locale)
      : typeof rawTitle === 'string'
        ? rawTitle
        : '';
  const label = localized || x.value!;
  return { value: x.value!, label };
}

const cachedFetchCatalogFilterOptionsByLocale = new Map<
  string,
  () => Promise<CatalogFilterOptions>
>();

function getCachedFetchCatalogFilterOptions(
  locale: string,
): () => Promise<CatalogFilterOptions> {
  let fn = cachedFetchCatalogFilterOptionsByLocale.get(locale);
  if (!fn) {
    fn = sanityCache(
      async () => {
        const client = getClient();
        if (!client) {
          return { locations: [], propertyTypes: [], amenities: [], districts: [] };
        }

        const query = `{
          "locations": *[_type == "city"] | order(title asc) {
            "value": slug.current,
            title,
            "countrySlug": country->slug.current
          },
          "propertyTypes": *[_type == "propertyType" && active == true] | order(order asc) {
            "value": slug.current,
            title
          },
          "amenities": *[_type == "amenity" && active == true] | order(order asc, title asc) {
            "value": slug.current,
            title
          },
          "districts": *[_type == "district"] | order(title asc) {
            "value": slug.current,
            title,
            "citySlug": city->slug.current
          }
        }`;

        try {
          const result = await client.fetch<{
            locations?: { value?: string; title?: unknown }[];
            propertyTypes?: { value?: string; title?: unknown }[];
            amenities?: { value?: string; title?: unknown }[];
            districts?: { value?: string; title?: unknown; citySlug?: string }[];
          }>(query);

          const locations = Array.isArray(result?.locations)
            ? result.locations
                .filter((x): x is RawFilterItem => typeof x?.value === 'string' && !!x.value)
                .map((x) => ({
                  ...mapToLocalizedOption(x, locale),
                  countrySlug:
                    typeof x.countrySlug === 'string' && x.countrySlug.trim()
                      ? x.countrySlug.trim().toLowerCase()
                      : undefined,
                }))
            : [];

          const propertyTypes = Array.isArray(result?.propertyTypes)
            ? result.propertyTypes
                .filter((x): x is RawFilterItem => typeof x?.value === 'string' && !!x.value)
                .map((x) => mapToLocalizedOption(x, locale))
            : [];

          const amenities = Array.isArray(result?.amenities)
            ? result.amenities
                .filter((x): x is RawFilterItem => typeof x?.value === 'string' && !!x.value)
                .map((x) => mapToLocalizedOption(x, locale))
            : [];

          const districts = Array.isArray(result?.districts)
            ? result.districts
                .filter((x): x is RawFilterItem => typeof x?.value === 'string' && !!x.value)
                .map((x) => ({
                  ...mapToLocalizedOption(x, locale),
                  citySlug: typeof x.citySlug === 'string' ? x.citySlug : undefined,
                }))
            : [];

          return { locations, propertyTypes, amenities, districts };
        } catch (err) {
          console.warn('[Sanity] fetchCatalogFilterOptions failed:', err);
          return { locations: [], propertyTypes: [], amenities: [], districts: [] };
        }
      },
      ['sanity-catalog-filter-options', locale],
      {
        revalidate: 60,
        tags: [
          SANITY_TAGS.city,
          SANITY_TAGS.propertyType,
          SANITY_TAGS.amenity,
          SANITY_TAGS.district,
        ],
      }
    );
    cachedFetchCatalogFilterOptionsByLocale.set(locale, fn);
  }
  return fn;
}

/** Fetch options for catalog filters (cities, property types, amenities). */
export async function fetchCatalogFilterOptions(locale: string): Promise<CatalogFilterOptions> {
  return getCachedFetchCatalogFilterOptions(locale)();
}

const fetchCatalogCountryDocumentSlugsCached = sanityCache(
  async (): Promise<string[]> => {
    const client = getClient();
    if (!client) return [];
    try {
      const rows = await client.fetch<string[]>(
        `*[_type == "country" && defined(slug.current)].slug.current`
      );
      if (!Array.isArray(rows)) return [];
      return rows
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().toLowerCase());
    } catch (err) {
      console.warn('[Sanity] fetchCatalogCountryDocumentSlugs failed:', err);
      return [];
    }
  },
  ['sanity-country-document-slugs'],
  { revalidate: 300, tags: [SANITY_TAGS.country] }
);

/** Slugs of published `country` documents (for validating `/{locale}/[country]` hub segments). */
export async function fetchCatalogCountryDocumentSlugs(): Promise<string[]> {
  return fetchCatalogCountryDocumentSlugsCached();
}

export type FooterCityNavItem = {
  slug: string;
  label: string;
  countrySlug?: string;
};

/**
 * Cities for footer column: filtered by `city.country`, ordered by title, capped (default 6).
 */
export async function fetchFooterCitiesByCountry(
  locale: string,
  countrySlug: string,
  limit = 6
): Promise<FooterCityNavItem[]> {
  const key = countrySlug.trim().toLowerCase();
  if (!key) return [];
  const safeLimit = Math.min(Math.max(1, limit), 24);
  return sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_type == "city" && country->slug.current == $country] | order(title asc) {
        "slug": slug.current,
        title,
        "countrySlug": country->slug.current
      }`;
      try {
        const rows = await client.fetch<
          Array<{ slug?: string; title?: unknown; countrySlug?: string }>
        >(query, { country: key });
        if (!Array.isArray(rows)) return [];
        return rows
          .filter((r): r is { slug: string; title?: unknown; countrySlug?: string } => typeof r.slug === 'string' && r.slug.length > 0)
          .slice(0, safeLimit)
          .map((r) => {
            const label =
              resolveLocalizedString(r.title as never, locale) ||
              r.slug.replace(/-/g, ' ');
            const cs =
              typeof r.countrySlug === 'string' && r.countrySlug.trim()
                ? r.countrySlug.trim().toLowerCase()
                : undefined;
            return { slug: r.slug, label, countrySlug: cs };
          });
      } catch (err) {
        console.warn('[Sanity] fetchFooterCitiesByCountry failed:', err);
        return [];
      }
    },
    ['sanity-footer-cities', key, locale, String(safeLimit)],
    { revalidate: 120, tags: [SANITY_TAGS.city] }
  )();
}

/**
 * Sanity `city.country->slug.current` for catalog routing. Cached per city slug.
 */
export async function fetchCityCountrySlugByCitySlug(citySlug: string): Promise<string | null> {
  const key = citySlug.trim().toLowerCase();
  if (!key) return null;
  return sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      try {
        const slug = await client.fetch<string | null>(
          `*[_type == "city" && slug.current == $citySlug][0].country->slug.current`,
          { citySlug: key }
        );
        if (typeof slug !== 'string' || !slug.trim()) return null;
        return slug.trim().toLowerCase();
      } catch (err) {
        console.warn('[Sanity] fetchCityCountrySlugByCitySlug failed:', err);
        return null;
      }
    },
    ['sanity-city-country', key],
    { revalidate: 120, tags: [SANITY_TAGS.city, SANITY_TAGS.country] }
  )();
}

/** True if a `city` document exists for this slug (country may be unset). */
export async function fetchCityExistsBySlug(citySlug: string): Promise<boolean> {
  const key = citySlug.trim().toLowerCase();
  if (!key) return false;
  return sanityCache(
    async () => {
      const client = getClient();
      if (!client) return false;
      try {
        const exists = await client.fetch<boolean>(
          `count(*[_type == "city" && slug.current == $citySlug]) > 0`,
          { citySlug: key }
        );
        return Boolean(exists);
      } catch (err) {
        console.warn('[Sanity] fetchCityExistsBySlug failed:', err);
        return false;
      }
    },
    ['sanity-city-exists', key],
    { revalidate: 120, tags: [SANITY_TAGS.city] }
  )();
}

export type CatalogSeoPageResolved = {
  title: string;
  intro: unknown[];
  bottomText: unknown[];
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
};

const catalogSeoPageProjection = `{
  _id,
  title,
  intro,
  bottomText,
  seo {
    metaTitle,
    metaDescription,
    noIndex
  }
}`;

const cachedFetchCatalogSeoPageRoot = sanityCache(
  async () => {
    const client = getClient();
    if (!client) return null;
    const query = `*[_type == "catalogSeoPage" && active == true && pageScope == "propertiesRoot"][0] ${catalogSeoPageProjection}`;
    try {
      return await client.fetch(query);
    } catch (err) {
      console.warn('[Sanity] fetchCatalogSeoPageRoot failed:', err);
      return null;
    }
  },
  ['sanity-catalog-seo-root'],
  { revalidate: 60, tags: [SANITY_TAGS.catalogSeoPage] }
);

/** Fetch catalog SEO page for properties root. Returns null if none or inactive. */
export async function fetchCatalogSeoPageRoot(): Promise<{
  title?: unknown;
  intro?: unknown;
  bottomText?: unknown;
  seo?: { metaTitle?: unknown; metaDescription?: unknown; noIndex?: unknown };
} | null> {
  return cachedFetchCatalogSeoPageRoot();
}

/** Fetch catalog SEO page for a city. Returns null if none or inactive. */
export async function fetchCatalogSeoPageByCity(citySlug: string): Promise<{
  title?: unknown;
  intro?: unknown;
  bottomText?: unknown;
  seo?: { metaTitle?: unknown; metaDescription?: unknown; noIndex?: unknown };
} | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "catalogSeoPage" && active == true && pageScope == "city" && city->slug.current == $citySlug][0] ${catalogSeoPageProjection}`;
  try {
    return await client.fetch(query, { citySlug });
  } catch (err) {
    console.warn('[Sanity] fetchCatalogSeoPageByCity failed:', err);
    return null;
  }
}

/** Fetch catalog SEO page for a district. Returns null if none or inactive. */
export async function fetchCatalogSeoPageByDistrict(
  citySlug: string,
  districtSlug: string
): Promise<{
  title?: unknown;
  intro?: unknown;
  bottomText?: unknown;
  seo?: { metaTitle?: unknown; metaDescription?: unknown; noIndex?: unknown };
} | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "catalogSeoPage" && active == true && pageScope == "district" && city->slug.current == $citySlug && district->slug.current == $districtSlug][0] ${catalogSeoPageProjection}`;
  try {
    return await client.fetch(query, { citySlug, districtSlug });
  } catch (err) {
    console.warn('[Sanity] fetchCatalogSeoPageByDistrict failed:', err);
    return null;
  }
}

/** Resolve catalog SEO page raw result to localized strings/arrays. */
export function resolveCatalogSeoPage(
  raw: {
    title?: unknown;
    intro?: unknown;
    bottomText?: unknown;
    seo?: { metaTitle?: unknown; metaDescription?: unknown; noIndex?: unknown };
  } | null,
  locale: string
): CatalogSeoPageResolved | null {
  if (!raw) return null;
  const title = resolveLocalizedString(raw.title as never, locale);
  const intro = resolveLocalizedContent(raw.intro as never, locale);
  const bottomText = resolveLocalizedContent(raw.bottomText as never, locale);
  const seo = raw.seo;
  const metaTitle = seo?.metaTitle
    ? resolveLocalizedString(seo.metaTitle as never, locale)
    : '';
  const metaDescription = seo?.metaDescription
    ? resolveLocalizedString(seo.metaDescription as never, locale)
    : '';
  const noIndex = seo?.noIndex === true;
  return {
    title,
    intro: Array.isArray(intro) ? intro : [],
    bottomText: Array.isArray(bottomText) ? bottomText : [],
    metaTitle,
    metaDescription,
    noIndex,
  };
}


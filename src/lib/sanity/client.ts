import { createClient } from '@sanity/client';
import { resolveLocalizedString, resolveLocalizedContent } from './localized';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

function getClient() {
  if (!projectId) return null;
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: process.env.NODE_ENV === 'production',
  });
}

/** Fetch homePage document. Returns null if client not configured or on error. */
export async function fetchHomePage(): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "homePage"][0] {
  _id,
  _type,
  homepageSections[] {
    _key,
    _type,
    title,
    subtitle,
    shortLine,
    backgroundImage {
      asset-> { _id, url, metadata },
      crop,
      hotspot,
      alt
    },
    cta {
      href,
      label
    },
    mode,
    "properties": properties[]-> {
      _id,
      title,
      "slug": slug.current,
      price,
      currency,
      status,
      featured,
      investment,
      area,
      bedrooms,
      bathrooms,
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
      "mainImage": gallery[0] {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt
      }
    },
    "cities": cities[]-> {
      _id,
      title,
      "slug": slug.current,
      shortDescription,
      popular,
      order,
      heroImage {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt
      }
    },
    "districts": districts[]-> {
      _id,
      title,
      "slug": slug.current,
      shortDescription,
      "city": city-> {
        _id,
        title,
        "slug": slug.current
      },
      heroImage {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt
      }
    },
    "propertyTypes": propertyTypes[]-> {
      _id,
      title,
      "slug": slug.current,
      shortDescription,
      image {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt
      },
      order,
      active
    },
    description,
    benefits,
    primaryImage {
      asset-> { _id, url, metadata },
      crop,
      hotspot,
      alt
    },
    secondaryImage {
      asset-> { _id, url, metadata },
      crop,
      hotspot,
      alt
    },
    "posts": posts[]-> {
      _id,
      title,
      excerpt,
      "slug": slug.current,
      publishedAt,
      coverImage {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt,
        caption
      }
    },
    content,
    "items": items[] {
      _key,
      question,
      answer
    }
  },
  seo {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage {
      asset-> { _id, url, metadata },
      crop,
      hotspot,
      alt
    },
    noIndex
  }
}`;
  try {
    const result = await client.fetch(query);
    if (process.env.NODE_ENV === 'development') {
      const doc = result as { homepageSections?: { _type: string }[] } | null;
      const seoSection = Array.isArray(doc?.homepageSections)
        ? doc.homepageSections.find((s) => s._type === 'homeSeoTextSection')
        : undefined;
      console.log('[Sanity] fetchHomePage OK, hasSeoSection:', !!seoSection);
    }
    return result;
  } catch (err) {
    console.warn('[Sanity] fetch homePage failed:', err);
    return null;
  }
}

/** Fetch featured/popular properties for homePropertyCarouselSection mode=auto. */
export async function fetchFeaturedProperties(limit = 6): Promise<CatalogProperty[] | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "property" && (featured == true || defined(investment))][0...${limit}] {
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
    featured,
    investment,
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
    const result = await client.fetch<CatalogProperty[]>(query);
    return Array.isArray(result) ? result : null;
  } catch (err) {
    console.warn('[Sanity] fetchFeaturedProperties failed:', err);
    return null;
  }
}

export type HomeTopOffersGroup = 'popular' | 'new' | 'highDemand';
export type HomeTopOffersSort = 'newest' | 'priceAsc' | 'priceDesc' | 'areaAsc' | 'areaDesc';

/** Fetch top offers for home slider groups (base: property). */
export async function fetchHomeTopOffers(
  group: HomeTopOffersGroup,
  limit = 24,
  sort: HomeTopOffersSort = 'newest'
): Promise<CatalogProperty[] | null> {
  const client = getClient();
  if (!client) return null;

  let where = '_type == "property"';
  let order = '| order(_createdAt desc)';

  if (group === 'popular') {
    where = `${where} && featured == true`;
  } else if (group === 'highDemand') {
    where = `${where} && defined(investment)`;
  }

  if (sort === 'priceAsc') order = '| order(price asc)';
  else if (sort === 'priceDesc') order = '| order(price desc)';
  else if (sort === 'areaAsc') order = '| order(area asc)';
  else if (sort === 'areaDesc') order = '| order(area desc)';
  else order = '| order(_createdAt desc)';

  const query = `*[
    ${where}
  ] ${order}[0...${limit}] {
    _id,
    _type,
    title,
    "slug": slug.current,
    description,
    price,
    currency,
    area,
    bedrooms,
    bathrooms,
    status,
    featured,
    investment,
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
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url
  }`;

  try {
    const result = await client.fetch<CatalogProperty[]>(query);
    return Array.isArray(result) ? result : null;
  } catch (err) {
    console.warn('[Sanity] fetchHomeTopOffers failed:', err);
    return null;
  }
}

/** Fetch single property by slug. Returns null if not found or client not configured. */
export async function fetchPropertyBySlug(slug: string): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "property" && slug.current == $slug][0] {
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
    featured,
    investment,
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
    gallery[] {
      asset-> { _id, url, metadata },
      crop,
      hotspot,
      alt
    },
    coordinates,
    description,
    content
  }`;
  try {
    const result = await client.fetch(query, { slug });
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sanity] fetchPropertyBySlug:', slug, result ? 'found' : 'not found');
      if (result) {
        console.log('[Sanity Property] shape:', JSON.stringify(result, null, 2).slice(0, 800) + '...');
      }
    }
    return result;
  } catch (err) {
    console.warn('[Sanity] fetchPropertyBySlug failed:', err);
    return null;
  }
}

/** Fetch properties by slugs. Returns array of CatalogProperty. */
export async function fetchPropertiesBySlugs(slugs: string[]): Promise<CatalogProperty[]> {
  const client = getClient();
  if (!client || !Array.isArray(slugs) || slugs.length === 0) return [];

  const safeSlugs = slugs.filter((s) => typeof s === "string" && s.trim());
  if (safeSlugs.length === 0) return [];

  const query = `*[_type == "property" && slug.current in $slugs] {
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
    featured,
    investment,
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
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url
  }`;

  try {
    const items = await client.fetch<CatalogProperty[]>(query, { slugs: safeSlugs });
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn("[Sanity] fetchPropertiesBySlugs failed:", err);
    return [];
  }
}

/** Fetch siteSettings singleton. Returns null if not found or client not configured. */
export async function fetchSiteSettings(): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "siteSettings" && _id == "siteSettings"][0] {
    _id,
    _type,
    logo { asset-> { _id, url } },
    siteName,
    siteTagline,
    contactPhone,
    contactEmail,
    companyAddress,
    copyrightText,
    footerQuickLinks[] {
      _key,
      href,
      label
    },
    socialLinks[] {
      _key,
      platform,
      url
    },
    policyLinks[] {
      _key,
      href,
      label
    },
    defaultSeo {
      metaTitle,
      metaDescription,
      noIndex
    }
  }`;
  try {
    const result = await client.fetch(query);
    if (process.env.NODE_ENV === 'development' && result) {
      const s = result as Record<string, unknown>;
      const ql = Array.isArray(s?.footerQuickLinks) ? (s.footerQuickLinks as unknown[]).length : 0;
      const sl = Array.isArray(s?.socialLinks) ? (s.socialLinks as unknown[]).length : 0;
      console.log('[Sanity] fetchSiteSettings OK:', {
        hasFooterQuickLinks: ql > 0,
        hasSocialLinks: sl > 0,
        hasContactEmail: !!s?.contactEmail,
        hasCopyright: !!s?.copyrightText,
        hasPhone: !!s?.contactPhone,
      });
    }
    return result;
  } catch (err) {
    console.warn('[Sanity] fetchSiteSettings failed:', err);
    return null;
  }
}

/** Fetch active property types for homePropertyTypesSection when propertyTypes is empty. */
export async function fetchActivePropertyTypes(limit = 8): Promise<unknown[] | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "propertyType" && active == true] | order(order asc)[0...${limit}] {
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt,
    active,
    order
  }`;
  try {
    const result = await client.fetch<unknown[]>(query);
    return Array.isArray(result) ? result : null;
  } catch (err) {
    console.warn('[Sanity] fetchActivePropertyTypes failed:', err);
    return null;
  }
}

export type CatalogSort =
  | 'newest'
  | 'priceAsc'
  | 'priceDesc'
  | 'areaAsc'
  | 'areaDesc';

export type CatalogFilters = {
  city?: string;
  district?: string;
  type?: string;
  deal?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  amenities?: string[];
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

export type CatalogProperty = {
  _id: string;
  _type: 'property';
  title?: unknown;
  slug?: string;
  /** Short textual teaser/description for list cards. */
  description?: unknown;
  /** Source coordinates in Studio (flat fields). */
  coordinatesLat?: number | null;
  coordinatesLng?: number | null;
  price?: number;
  currency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  featured?: boolean;
  investment?: string;
  city?: {
    _id?: string;
    title?: unknown;
    slug?: string;
  };
  district?: {
    _id?: string;
    title?: unknown;
    slug?: string;
    citySlug?: string;
  };
  type?: {
    _id?: string;
    title?: unknown;
    slug?: string;
  };
  mainImageUrl?: string;
  /** All gallery image URLs for card carousel. */
  galleryUrls?: string[];
};

export type CatalogResult = {
  items: CatalogProperty[];
  totalCount: number;
};

/** Fetch paginated catalog properties with filters. Does NOT yet power the UI. */
export async function fetchCatalogProperties(
  filters: CatalogFilters,
): Promise<CatalogResult | null> {
  const client = getClient();
  if (!client) return null;

  const {
    city,
    district,
    type,
    deal,
    minPrice,
    maxPrice,
    beds,
    amenities,
    sort = 'newest',
    page = 1,
    pageSize = 12,
  } = filters;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 48
      ? pageSize
      : 12;
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;

  const parts: string[] = ['_type == "property"'];

  if (city) {
    parts.push('city->slug.current == $city');
  }
  if (district) {
    parts.push('district->slug.current == $district');
  }
  if (type) {
    parts.push('type->slug.current == $type');
  }
  if (deal) {
    parts.push('status == $deal');
  }
  if (typeof minPrice === 'number' && minPrice > 0) {
    parts.push('price >= $minPrice');
  }
  if (typeof maxPrice === 'number' && maxPrice > 0) {
    parts.push('price <= $maxPrice');
  }
  if (typeof beds === 'number' && beds > 0) {
    parts.push('bedrooms >= $beds');
  }

  if (Array.isArray(amenities) && amenities.length > 0) {
    parts.push('count(amenitiesRefs[@->slug.current in $amenities]) > 0');
  }

  const where = parts.length > 0 ? parts.join(' && ') : 'true';

  let order = '[_createdAt desc]';
  if (sort === 'priceAsc') order = '| order(price asc)';
  else if (sort === 'priceDesc') order = '| order(price desc)';
  else if (sort === 'areaAsc') order = '| order(area asc)';
  else if (sort === 'areaDesc') order = '| order(area desc)';
  else order = '| order(_createdAt desc)';

  const baseSelector = `*${where ? `[${where}]` : ''} ${order}`;

  const countQuery = `count(${baseSelector})`;
  const pageQuery = `${baseSelector}[${start}...${end}] {
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
    featured,
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

  const params: Record<string, unknown> = {
    city,
    district,
    type,
    deal,
    minPrice,
    maxPrice,
    beds,
    amenities,
  };

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
}

export type CatalogLocationOption = {
  value: string;
  label: string;
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

/** Fetch options for catalog filters (cities, property types, amenities). */
export async function fetchCatalogFilterOptions(locale: string): Promise<CatalogFilterOptions> {
  const client = getClient();
  if (!client) {
    return { locations: [], propertyTypes: [], amenities: [], districts: [] };
  }

  const query = `{
    "locations": *[_type == "city"] | order(title asc) {
      "value": slug.current,
      title
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
          .filter((x) => typeof x?.value === 'string' && !!x.value)
          .map((x) => {
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
          })
      : [];

    const propertyTypes = Array.isArray(result?.propertyTypes)
      ? result.propertyTypes
          .filter((x) => typeof x?.value === 'string' && !!x.value)
          .map((x) => {
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
          })
      : [];

    const amenities = Array.isArray(result?.amenities)
      ? result.amenities
          .filter((x) => typeof x?.value === 'string' && !!x.value)
          .map((x) => {
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
          })
      : [];

    const districts = Array.isArray(result?.districts)
      ? result.districts
          .filter((x) => typeof x?.value === 'string' && !!x.value)
          .map((x) => {
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
            return {
              value: x.value!,
              label,
              citySlug: typeof x.citySlug === 'string' ? x.citySlug : undefined,
            };
          })
      : [];

    return { locations, propertyTypes, amenities, districts };
  } catch (err) {
    console.warn('[Sanity] fetchCatalogFilterOptions failed:', err);
    return { locations: [], propertyTypes: [], amenities: [], districts: [] };
  }
}

export type CatalogSeoPageResolved = {
  title: string;
  intro: unknown[];
  bottomText: unknown[];
  metaTitle: string;
  metaDescription: string;
};

const catalogSeoPageProjection = `{
  _id,
  title,
  intro,
  bottomText,
  seo {
    metaTitle,
    metaDescription
  }
}`;

/** Fetch catalog SEO page for properties root. Returns null if none or inactive. */
export async function fetchCatalogSeoPageRoot(): Promise<{
  title?: unknown;
  intro?: unknown;
  bottomText?: unknown;
  seo?: { metaTitle?: unknown; metaDescription?: unknown };
} | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "catalogSeoPage" && active == true && pageScope == "propertiesRoot"][0] ${catalogSeoPageProjection}`;
  try {
    return await client.fetch(query);
  } catch (err) {
    console.warn('[Sanity] fetchCatalogSeoPageRoot failed:', err);
    return null;
  }
}

/**
 * Fetch landingPage document for a city route `/[locale]/cities/[city]`.
 * Returns null if not found or client not configured.
 */
export async function fetchCityLandingByCitySlug(citySlug: string): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[
    _type == "landingPage" &&
    pageType == "city" &&
    (
      linkedCity->slug.current == $citySlug ||
      slug.current == $citySlug
    )
  ][0] {
    _id,
    _type,
    pageType,
    pageSections[],
    seo
  }`;
  try {
    return await client.fetch(query, { citySlug });
  } catch (err) {
    console.warn("[Sanity] fetchCityLandingByCitySlug failed:", err);
    return null;
  }
}

/**
 * Fetch landingPage document for the homepage route `/[locale]`.
 * Returns null if not found or client not configured.
 */
export async function fetchHomeLanding(): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[
    _type == "landingPage" &&
    (
      _id == "landing-home" ||
      pageType == "home" ||
      slug.current == "home" ||
      slug.current == "landing-home"
    )
  ][0] {
    _id,
    _type,
    pageType,
    pageSections[],
    seo
  }`;
  try {
    return await client.fetch(query);
  } catch (err) {
    console.warn("[Sanity] fetchHomeLanding failed:", err);
    return null;
  }
}

/** Fetch catalog SEO page for a city. Returns null if none or inactive. */
export async function fetchCatalogSeoPageByCity(citySlug: string): Promise<{
  title?: unknown;
  intro?: unknown;
  bottomText?: unknown;
  seo?: { metaTitle?: unknown; metaDescription?: unknown };
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
  seo?: { metaTitle?: unknown; metaDescription?: unknown };
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

// --- Blog query projections (aligned with blog-schema-contract) ---

const blogAuthorProjection = `{
  _id,
  "slug": slug.current,
  name,
  active,
  role,
  "photo": photo{
    alt,
    asset->{url}
  },
  email
}`;

const blogCategoryListProjection = `{
  _id,
  "slug": slug.current,
  title
}`;

const blogCategoryDetailProjection = `{
  _id,
  "slug": slug.current,
  title,
  description,
  order,
  active,
  seo
}`;

/** Property projection for blog embeds (aligns with CatalogProperty / mapSanityPropertyToCard). */
const blogPropertyEmbedProjection = `{
  _id,
  "slug": slug.current,
  title,
  "description": shortDescription,
  shortDescription,
  price,
  currency,
  area,
  bedrooms,
  bathrooms,
  status,
  "mainImageUrl": gallery[0].asset->url,
  "galleryUrls": gallery[].asset->url,
  "city": city->{
    _id,
    title,
    "slug": slug.current
  },
  "district": district->{
    _id,
    title,
    "slug": slug.current,
    "citySlug": city->slug.current
  },
  "type": type->{
    _id,
    title,
    "slug": slug.current
  }
}`;

/** Content block projection for detail: dereferences posts and properties in inline blocks. */
const blogDetailContentBlockProjection = `{
  ...,
  "posts": select(_type == "blogRelatedPostsBlock" => posts[]->{
    _id,
    "slug": slug.current,
    title,
    excerpt,
    publishedAt,
    coverImage{alt,caption,asset->{url}},
    "categories": categories[]->{_id,"slug":slug.current,title},
    "author": author->{_id,name,"photo":photo{alt,asset->{url}}},
    authorName,
    authorRole,
    authorImage{asset->{url}}
  }, null),
  "properties": select(_type == "blogPropertyEmbedBlock" => properties[]->{
    _id,
    "slug": slug.current,
    title,
    shortDescription,
    price,
    currency,
    area,
    bedrooms,
    bathrooms,
    status,
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url,
    "city": city->{_id,title,"slug":slug.current},
    "district": district->{_id,title,"slug":slug.current,"citySlug":city->slug.current},
    "type": type->{_id,title,"slug":slug.current},
    "propertyType": propertyType->{_id,title,"slug":slug.current}
  }, null),
  asset->{url}
}`;

/** Minimal content projection for reading time only. No assets, no heavy refs. */
const blogContentForReadingTimeProjection = `{
  _type,
  children[]{text},
  text,
  content[]{
    _type,
    children[]{text},
    text,
    items[]{answer[]{children[]{text}}, cells},
    rows[]{cells}
  },
  items[]{answer[]{children[]{text}}, cells},
  rows[]{cells},
  "posts": select(_type == "blogRelatedPostsBlock" => posts[]->{excerpt, title}, null),
  "properties": select(_type == "blogPropertyEmbedBlock" => properties[]->{title, shortDescription}, null)
}`;

const blogListingProjection = `{
  _id,
  _type,
  "slug": slug.current,
  title,
  subtitle,
  excerpt,
  publishedAt,
  featured,
  coverImage{
    alt,
    caption,
    asset->{url}
  },
  "category": categories[0]->${blogCategoryListProjection},
  "categories": categories[]->${blogCategoryListProjection},
  "author": author->${blogAuthorProjection},
  authorName,
  authorRole,
  authorImage{
    asset->{url}
  },
  "contentForReadingTime": coalesce(content.en, content.uk, content.ru, content.sq, content["it"], [])[]${blogContentForReadingTimeProjection}
}`;

/** Fetch published blog posts for listing. Uses publishedAt <= now(). */
export async function fetchBlogPosts(): Promise<unknown[] | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) ${blogListingProjection}`;
  try {
    const result = await client.fetch<unknown[]>(query);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('[Sanity] fetchBlogPosts failed:', err);
    return null;
  }
}

export type FetchBlogPostsPaginatedParams = {
  category?: string;
  page?: number;
  pageSize?: number;
};

export type FetchBlogPostsPaginatedResult = {
  items: unknown[];
  totalCount: number;
};

/** Fetch published blog posts with category filter and pagination. */
export async function fetchBlogPostsPaginated(
  params: FetchBlogPostsPaginatedParams = {}
): Promise<FetchBlogPostsPaginatedResult> {
  const client = getClient();
  if (!client) return { items: [], totalCount: 0 };
  const { category, page = 1, pageSize = 12 } = params;
  const offset = Math.max(0, (page - 1) * pageSize);
  const limit = Math.max(1, pageSize);

  const categoryFilter = category?.trim()
    ? `&& $categorySlug in categories[]->slug.current`
    : '';
  const filter = `*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() ${categoryFilter}]`;
  const order = `| order(publishedAt desc)`;
  const slice = `[${offset}...${offset + limit}]`;

  const query = `${filter} ${order} ${slice} ${blogListingProjection}`;
  const countQuery = `count(${filter})`;

  try {
    const [items, totalCount] = await Promise.all([
      client.fetch<unknown[]>(query, category?.trim() ? { categorySlug: category.trim() } : {}),
      client.fetch<number>(countQuery, category?.trim() ? { categorySlug: category.trim() } : {}),
    ]);
    return {
      items: Array.isArray(items) ? items : [],
      totalCount: typeof totalCount === 'number' ? totalCount : 0,
    };
  } catch (err) {
    console.warn('[Sanity] fetchBlogPostsPaginated failed:', err);
    return { items: [], totalCount: 0 };
  }
}

/** Fetch blog post count for pagination. */
export async function fetchBlogPostCount(category?: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;
  const categoryFilter = category?.trim()
    ? `&& $categorySlug in categories[]->slug.current`
    : '';
  const query = `count(*[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() ${categoryFilter}])`;
  try {
    const result = await client.fetch<number>(
      query,
      category?.trim() ? { categorySlug: category.trim() } : {}
    );
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.warn('[Sanity] fetchBlogPostCount failed:', err);
    return 0;
  }
}

/** Fetch blog-settings singleton. Returns null if not found. */
export async function fetchBlogSettings(): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "blog-settings"][0]{
    title,
    intro,
    seo {
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage { asset->{url} },
      noIndex,
      noFollow
    }
  }`;
  try {
    const result = await client.fetch(query);
    return result ?? null;
  } catch (err) {
    console.warn('[Sanity] fetchBlogSettings failed:', err);
    return null;
  }
}

/** Fetch a single published blog post by slug. Returns null if not found or not yet published. */
export async function fetchBlogPostBySlug(slug: string): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "blogPost" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0]{
    _id,
    _type,
    "slug": slug.current,
    title,
    subtitle,
    excerpt,
    publishedAt,
    featured,
    coverImage{
      alt,
      caption,
      asset->{url}
    },
    "categories": categories[]->{_id,"slug":slug.current,title},
    "author": author->{_id,"slug":slug.current,name,active,role,"photo":photo{alt,asset->{url}},email},
    authorName,
    authorRole,
    authorImage{
      asset->{url}
    },
    seo,
    "relatedPosts": relatedPosts[]->{
      _id,
      "slug": slug.current,
      title,
      excerpt,
      publishedAt,
      coverImage{alt,caption,asset->{url}},
      "categories": categories[]->{_id,"slug":slug.current,title},
      "author": author->{_id,name,"photo":photo{alt,asset->{url}}},
      authorName,
      authorRole,
      authorImage{asset->{url}}
    },
    "properties": relatedProperties[]->{
      _id,
      "slug": slug.current,
      title,
      "description": shortDescription,
      price,
      currency,
      area,
      bedrooms,
      bathrooms,
      status,
      "mainImageUrl": gallery[0].asset->url,
      "galleryUrls": gallery[].asset->url,
      "city": city->{_id,title,"slug":slug.current},
      "district": district->{_id,title,"slug":slug.current,"citySlug":city->slug.current}
    },
    "content": {
      "en": content.en[]${blogDetailContentBlockProjection},
      "uk": content.uk[]${blogDetailContentBlockProjection},
      "ru": content.ru[]${blogDetailContentBlockProjection},
      "sq": content.sq[]${blogDetailContentBlockProjection},
      "it": content.it[]${blogDetailContentBlockProjection}
    }
  }`;
  try {
    const result = await client.fetch(query, { slug });
    return result ?? null;
  } catch (err) {
    console.warn('[Sanity] fetchBlogPostBySlug failed:', err);
    return null;
  }
}

/** Fetch blog categories. Returns active and inactive; frontend can filter by active if needed. */
export async function fetchBlogCategories(): Promise<unknown[] | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "blogCategory"] | order(order asc) {
    _id,
    "slug": slug.current,
    title,
    description,
    order,
    active,
    seo
  }`;
  try {
    const result = await client.fetch<unknown[]>(query);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('[Sanity] fetchBlogCategories failed:', err);
    return null;
  }
}

/** Resolve catalog SEO page raw result to localized strings/arrays. */
export function resolveCatalogSeoPage(
  raw: { title?: unknown; intro?: unknown; bottomText?: unknown; seo?: { metaTitle?: unknown; metaDescription?: unknown } } | null,
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
  return {
    title,
    intro: Array.isArray(intro) ? intro : [],
    bottomText: Array.isArray(bottomText) ? bottomText : [],
    metaTitle,
    metaDescription,
  };
}

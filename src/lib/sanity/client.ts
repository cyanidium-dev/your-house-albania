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
export async function fetchFeaturedProperties(limit = 6): Promise<unknown[] | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "property" && (featured == true || defined(investment))][0...${limit}] {
    _id,
    title,
    "slug": slug.current,
    price,
    currency,
    area,
    bedrooms,
    bathrooms,
    "city": city-> { title },
    "district": district-> { title },
    "mainImageUrl": gallery[0].asset->url
  }`;
  try {
    const result = await client.fetch<unknown[]>(query);
    return Array.isArray(result) ? result : null;
  } catch (err) {
    console.warn('[Sanity] fetchFeaturedProperties failed:', err);
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
    "mainImageUrl": gallery[0].asset->url
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
    "mainImageUrl": gallery[0].asset->url
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

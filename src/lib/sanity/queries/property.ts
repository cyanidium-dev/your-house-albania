import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { blogListingProjection } from './blog';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import type { CatalogProperty } from '@/types/catalog';

/** Fetch single property by slug. Returns null if not found or client not configured. */
export async function fetchPropertyBySlug(slug: string): Promise<unknown | null> {
  const client = getClient();
  if (!client) return null;
  const query = `*[_type == "property" && slug.current == $slug && ${PUBLISHED_PROPERTY_FILTER}][0] {
    _id,
    _type,
    title,
    "slug": slug.current,
    price,
    area,
    bedrooms,
    bathrooms,
    yearBuilt,
    status,
    promoted,
    promotionType,
    featuredOrder,
    discountPercent,
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
    "developer": developer-> {
      name,
      tier,
      tierNote,
      "linkedGuide": linkedGuide-> { "slug": slug.current, enabled, pageType }
    },
    "agent": agent-> {
      name,
      "slug": slug.current
    },
    gallery[] {
      asset-> { _id, url, metadata },
      crop,
      hotspot,
      alt,
      label
    },
    coordinatesLat,
    coordinatesLng,
    description,
    "amenitiesRefs": amenitiesRefs[]-> {
      _id,
      title,
      "slug": slug.current,
      description,
      iconKey,
      "customIconUrl": customIcon.asset->url,
      "customIconAlt": customIcon.alt
    },
    "propertyOffers": coalesce(propertyOffers[] {
      _key,
      title,
      iconKey,
      "customIconUrl": customIcon.asset->url,
      "customIconAlt": customIcon.alt
    }, []),
    seo {
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage { asset-> { url } },
      noIndex
    },
    "articlesSection": articlesSection {
      enabled,
      "posts": posts[]-> ${blogListingProjection}
    }
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
    area,
    bedrooms,
    bathrooms,
    status,
    promoted,
    promotionType,
    featuredOrder,
    discountPercent,
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

/** Fetch candidate properties for similar-properties block. Same-city first, then latest. Excludes current. */
export async function fetchSimilarPropertyCandidates(
  excludeId: string,
  citySlug: string | null | undefined,
  limit: number
): Promise<CatalogProperty[]> {
  const client = getClient();
  if (!client || limit <= 0) return [];

  const safeLimit = Math.min(limit, 24);
  const orderClause = citySlug
    ? `order((city->slug.current == $citySlug) desc, _createdAt desc)`
    : 'order(_createdAt desc)';

  const query = `*[_type == "property" && _id != $excludeId && ${PUBLISHED_PROPERTY_FILTER}] | ${orderClause}[0...$limit] {
    _id,
    _type,
    title,
    "slug": slug.current,
    price,
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

  const params: Record<string, unknown> = { excludeId, limit: safeLimit };
  if (citySlug) params.citySlug = citySlug;

  try {
    const items = await client.fetch<CatalogProperty[]>(query, params);
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn('[Sanity] fetchSimilarPropertyCandidates failed:', err);
    return [];
  }
}

const cachedFetchActivePropertyTypes = sanityCache(
  async (limit: number): Promise<unknown[] | null> => {
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
  },
  ['sanity-active-property-types'],
  { revalidate: 120, tags: [SANITY_TAGS.propertyType] },
);

/** Fetch active property types for homePropertyTypesSection when propertyTypes is empty. */
export async function fetchActivePropertyTypes(limit = 8): Promise<unknown[] | null> {
  return cachedFetchActivePropertyTypes(limit);
}


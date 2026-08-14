import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes';

// Home carousels honor PUBLIC_DEAL_TYPES (rentals hidden from public surfaces,
// product decision 2026-07). JSON array literal is valid GROQ.
const PUBLIC_DEAL_FILTER = `status in ${JSON.stringify(PUBLIC_DEAL_TYPES)}`;
import type { CatalogProperty } from '@/types/catalog';

const cachedFetchHomePage = sanityCache(
  async (): Promise<unknown | null> => {
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
    "properties": properties[]->[${PUBLISHED_PROPERTY_FILTER} && ${PUBLIC_DEAL_FILTER}] {
      _id,
      title,
      "slug": slug.current,
      price,
      currency,
      status,
      promoted,
      promotionType,
      featuredOrder,
      discountPercent,
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
        alt,
        label
      }
    },
    "cities": cities[]-> {
      _id,
      title,
      "slug": slug.current,
      "countrySlug": country->slug.current,
      shortDescription,
      popular,
      order,
      heroImage {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt,
        label
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
        "slug": slug.current,
        "countrySlug": country->slug.current
      },
      heroImage {
        asset-> { _id, url, metadata },
        crop,
        hotspot,
        alt,
        label
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
        ? doc?.homepageSections.find((s) => s._type === 'homeSeoTextSection')
        : undefined;
      console.log('[Sanity] fetchHomePage OK, hasSeoSection:', !!seoSection);
    }
    return result;
  } catch (err) {
    console.warn('[Sanity] fetch homePage failed:', err);
    return null;
  }
  },
  ['sanity-home-page'],
  {
    revalidate: 60,
    tags: [
      SANITY_TAGS.homePage,
      SANITY_TAGS.property,
      SANITY_TAGS.city,
      SANITY_TAGS.district,
      SANITY_TAGS.propertyType,
      SANITY_TAGS.blogPost,
    ],
  },
);

/** Fetch homePage document. Returns null if client not configured or on error. */
export async function fetchHomePage(): Promise<unknown | null> {
  return cachedFetchHomePage();
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

  let where = `_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && ${PUBLIC_DEAL_FILTER}`;
  let order = '| order(_createdAt desc)';

  if (group === 'popular') {
    where = `${where} && promoted == true`;
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
    const result = await client.fetch<CatalogProperty[]>(query);
    return Array.isArray(result) ? result : null;
  } catch (err) {
    console.warn('[Sanity] fetchHomeTopOffers failed:', err);
    return null;
  }
}


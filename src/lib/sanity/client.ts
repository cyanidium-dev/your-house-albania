import { createClient } from '@sanity/client';

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

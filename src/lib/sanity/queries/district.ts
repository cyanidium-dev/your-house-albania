import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { landingPageSectionsProjection } from './landing';

type LocalizedField = Record<string, string> | null | undefined;

type SanityImage = { asset?: { url?: string }; alt?: string } | null | undefined;

export type DistrictFaqItem = {
  _key?: string;
  question?: LocalizedField;
  answer?: LocalizedField;
  tag?: LocalizedField;
};

export type DistrictDoc = {
  _id?: string;
  slug?: string;
  title?: LocalizedField;
  heroTitle?: LocalizedField;
  heroSubtitle?: LocalizedField;
  heroShortLine?: LocalizedField;
  heroImage?: SanityImage;
  heroCta?: { href?: string; label?: LocalizedField } | null;
  shortDescription?: LocalizedField;
  description?: LocalizedField;
  galleryTitle?: LocalizedField;
  gallerySubtitle?: LocalizedField;
  gallery?: Array<{ _key?: string; asset?: { url?: string }; alt?: string; label?: string }>;
  faqTitle?: LocalizedField;
  faqItems?: DistrictFaqItem[];
  seoText?: LocalizedField;
  seo?: unknown;
  city?: {
    title?: LocalizedField;
    slug?: string;
    countrySlug?: string;
  } | null;
};

const DISTRICT_DOC_PROJECTION = `{
  _id,
  "slug": slug.current,
  title,
  heroTitle,
  heroSubtitle,
  heroShortLine,
  heroImage { asset-> { url }, alt },
  heroCta,
  shortDescription,
  description,
  galleryTitle,
  gallerySubtitle,
  "gallery": gallery[] { _key, asset-> { url }, alt, label },
  faqTitle,
  faqItems,
  seoText,
  seo { ..., ogImage { asset-> { url }, alt } },
  "city": city-> {
    title,
    "slug": slug.current,
    "countrySlug": country->slug.current
  }
}`;

/**
 * Published `district` document for `/[locale]/[country]/[city]/districts/[district]`.
 * `isPublished != false` keeps legacy documents created before the field existed.
 */
export async function fetchDistrictBySlugs(
  citySlug: string,
  districtSlug: string,
): Promise<DistrictDoc | null> {
  const city = typeof citySlug === 'string' ? citySlug.trim().toLowerCase() : '';
  const district = typeof districtSlug === 'string' ? districtSlug.trim().toLowerCase() : '';
  if (!city || !district) return null;

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[
    _type == "district" &&
    isPublished != false &&
    slug.current == $district &&
    city->slug.current == $city
  ][0] ${DISTRICT_DOC_PROJECTION}`;
      try {
        return await client.fetch<DistrictDoc | null>(query, { city, district });
      } catch (err) {
        console.warn('[Sanity] fetchDistrictBySlugs failed:', err);
        return null;
      }
    },
    ['sanity-district-by-slugs-v1', city, district],
    { revalidate: 60, tags: [SANITY_TAGS.district, SANITY_TAGS.city] },
  );

  return cached();
}

/**
 * Enabled `landingPage` with `pageType == "district"` linked to the given district.
 * When present, it replaces the fallback district template (same pattern as city info).
 */
export async function fetchDistrictLandingBySlugs(
  citySlug: string,
  districtSlug: string,
): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  slug?: string;
  title?: unknown;
  cardDescription?: unknown;
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const city = typeof citySlug === 'string' ? citySlug.trim().toLowerCase() : '';
  const district = typeof districtSlug === 'string' ? districtSlug.trim().toLowerCase() : '';
  if (!city || !district) return null;

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[
    _type == "landingPage" &&
    pageType == "district" &&
    enabled != false &&
    linkedDistrict->slug.current == $district &&
    linkedDistrict->city->slug.current == $city
  ][0] {
    _id,
    _type,
    pageType,
    "slug": slug.current,
    title,
    cardDescription,
    "pageSections": pageSections[]${landingPageSectionsProjection},
    contentUpdatedAt,
    seo
  }`;
      try {
        return await client.fetch(query, { city, district });
      } catch (err) {
        console.warn('[Sanity] fetchDistrictLandingBySlugs failed:', err);
        return null;
      }
    },
    ['sanity-district-landing-by-slugs-v1', city, district],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage, SANITY_TAGS.district] },
  );

  return cached();
}

export type DistrictCardItem = {
  _id?: string;
  slug?: string;
  title?: LocalizedField;
  shortDescription?: LocalizedField;
  heroImage?: SanityImage;
  propertiesCount?: number;
};

/**
 * Published districts of a city for the districts hub grid and interlinking blocks.
 * Ordered like the Studio list: `order asc`, then title.
 */
export async function fetchPublishedDistrictsByCity(citySlug: string): Promise<DistrictCardItem[]> {
  const city = typeof citySlug === 'string' ? citySlug.trim().toLowerCase() : '';
  if (!city) return [];

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[
    _type == "district" &&
    isPublished != false &&
    defined(slug.current) &&
    city->slug.current == $city
  ] | order(order asc, title.en asc) {
    _id,
    "slug": slug.current,
    title,
    shortDescription,
    heroImage { asset-> { url }, alt },
    "propertiesCount": count(*[_type == "property" && district._ref == ^._id && isPublished == true])
  }`;
      try {
        const rows = await client.fetch<DistrictCardItem[]>(query, { city });
        return Array.isArray(rows) ? rows.filter((r) => typeof r.slug === 'string' && r.slug) : [];
      } catch (err) {
        console.warn('[Sanity] fetchPublishedDistrictsByCity failed:', err);
        return [];
      }
    },
    ['sanity-districts-by-city-v1', city],
    { revalidate: 60, tags: [SANITY_TAGS.district, SANITY_TAGS.city, SANITY_TAGS.property] },
  );

  return cached();
}

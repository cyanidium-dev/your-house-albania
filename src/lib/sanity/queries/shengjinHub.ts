import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import { HUB_CARD_PROJECTION, type GermanHubSeaListing } from './germanHub';
import type { ShengjinFlatRow } from '@/lib/shengjinHub/facts';
import { SHENGJIN_CITY, SHENGJIN_FLAT_TYPES, SHENGJIN_GUIDE_SLUGS } from '@/lib/shengjinHub/config';

/** A card's fields for the listings the hub shows: the same projection as the German hub. */
export type ShengjinHubListing = GermanHubSeaListing;

const FLAT_FILTER = `_type == "property" && ${PUBLISHED_PROPERTY_FILTER} &&
      status == "sale" && !defined(duplicateOf) &&
      city->slug.current == $city &&
      type->slug.current in $types`;

const FLAT_PARAMS = { city: SHENGJIN_CITY, types: SHENGJIN_FLAT_TYPES };

/**
 * Every live flat for sale in Shëngjin, one light row each: what the budget
 * bands, the layout table, the sea count and the sea ranking need. The cards
 * of the dozen that are shown are read afterwards by id.
 */
export const fetchShengjinFlats = sanityCache(
  async (): Promise<ShengjinFlatRow[]> => {
    const client = getClient();
    if (!client) return [];
    const query = `*[${FLAT_FILTER}]{
      _id, "slug": slug.current, price, priceUnit, area, bedrooms,
      seaDistanceMeters, beachfront,
      "typeSlug": type->slug.current, "citySlug": city->slug.current,
      "mainImageUrl": gallery[0].asset->url
    }`;
    try {
      const rows = await client.fetch<ShengjinFlatRow[]>(query, FLAT_PARAMS);
      return Array.isArray(rows) ? rows.filter((r) => typeof r.slug === 'string' && r.slug.length > 0) : [];
    } catch (err) {
      console.warn('[Sanity] fetchShengjinFlats failed:', err);
      return [];
    }
  },
  ['sanity-shengjin-hub-flats'],
  { revalidate: 3600, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);

/** The cards of the selected listings, in the order of `ids`; a listing gone since the ranking drops out. */
export const fetchShengjinCards = sanityCache(
  async (ids: readonly string[]): Promise<ShengjinHubListing[]> => {
    const client = getClient();
    if (!client || ids.length === 0) return [];
    try {
      const rows = await client.fetch<ShengjinHubListing[]>(`*[${FLAT_FILTER} && _id in $ids] ${HUB_CARD_PROJECTION}`, {
        ...FLAT_PARAMS,
        ids: [...ids],
      });
      if (!Array.isArray(rows)) return [];
      const byId = new Map(rows.map((r) => [r._id, r]));
      return ids.flatMap((id) => {
        const row = byId.get(id);
        return row && typeof row.slug === 'string' && row.slug.length > 0 ? [row] : [];
      });
    } catch (err) {
      console.warn('[Sanity] fetchShengjinCards failed:', err);
      return [];
    }
  },
  ['sanity-shengjin-hub-cards'],
  { revalidate: 3600, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);

export type ShengjinGuide = {
  slug: string;
  /** Localized title object from the CMS. */
  title: unknown;
  /** `landingPage.locales`: the page exists only in these locales (empty = all). */
  locales?: string[] | null;
  noIndex?: boolean | null;
};

/**
 * The two Shëngjin comparisons (`SHENGJIN_GUIDE_SLUGS`), in that order, with
 * their titles in every language. A guide that is not published is left out.
 */
export const fetchShengjinGuides = sanityCache(
  async (): Promise<ShengjinGuide[]> => {
    const client = getClient();
    if (!client) return [];
    const query = `*[_type == "landingPage" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      "slug": slug.current, title, locales, "noIndex": seo.noIndex
    }`;
    try {
      const rows = await client.fetch<ShengjinGuide[]>(query, { slugs: SHENGJIN_GUIDE_SLUGS });
      if (!Array.isArray(rows)) return [];
      const bySlug = new Map(rows.map((r) => [r.slug, r]));
      return SHENGJIN_GUIDE_SLUGS.flatMap((slug) => {
        const row = bySlug.get(slug);
        return row ? [row] : [];
      });
    } catch (err) {
      console.warn('[Sanity] fetchShengjinGuides failed:', err);
      return [];
    }
  },
  ['sanity-shengjin-hub-guides'],
  { revalidate: 3600, tags: [SANITY_TAGS.landingPage] },
);

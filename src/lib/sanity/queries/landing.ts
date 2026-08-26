import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding';
import { dealTypeToLandingDocumentSlug } from '@/lib/sanity/dealLandingSlug';
import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { blogListingProjection } from './blog';
import { resolveLocalizedString } from '../localized';

/**
 * Fetch landingPage document for a city editorial route `/[locale]/[country]/[city]/info` (legacy `/cities/[city]` redirects).
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
    "slug": slug.current,
    title,
    subtitle,
    cardDescription,
    "linkedCity": linkedCity->{
      title,
      shortDescription,
      heroImage { asset-> { url } }
    },
    "linkedZoneId": linkedCity._ref,
    "linkedZoneType": "city",
    "linkedZoneSlug": linkedCity->slug.current,
    "linkedZoneCitySlug": linkedCity->slug.current,
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
  try {
    return await client.fetch(query, { citySlug });
  } catch (err) {
    console.warn("[Sanity] fetchCityLandingByCitySlug failed:", err);
    return null;
  }
}

/** Projection for landing page sections with asset/ref dereferencing. */
export const landingPageSectionsProjection = `{
  _key,
  _type,
  title,
  subtitle,
  shortLine,
  cta,
  secondaryCta,
  mode,
  linkTargetType,
  search,
  content,
  body,
  "items": items[] {
    _key,
    label,
    // linkedGallerySection captions each slide with its own title field.
    // Without this the gallery renders images with no captions at all.
    title,
    href,
    question,
    answer,
    tag,
    cta,
    value,
    sublabel,
    trend,
    confidence,
    kind,
    capEur,
    note,
    image {
      asset-> { url },
      alt
    }
  },
  "callout": callout {
    title,
    subtitle,
    primaryCta,
    secondaryCta,
    secondaryIcon
  },
  // articlesSection mode "selected": must be dereferenced, otherwise the refs
  // carry no slug and BlogSmall renders nothing (same projection the property
  // route uses).
  "posts": posts[]-> ${blogListingProjection},
  enabled,
  presentation,
  limit,
  sort,
  properties,
  "propertyTypes": propertyTypes[]-> {
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    image { asset-> { url }, alt }
  },
  headings,
  rows,
  columns,
  confidenceEnabled,
  sourceNote,
  lastUpdated,
  sources,
  methodologyNote,
  intro,
  defaultRatePct,
  minRatePct,
  maxRatePct,
  maxLtvPct,
  defaultTermYears,
  maxTermYears,
  disclaimer,
  presets,
  taxRatePct,
  tracker,
  developer,
  developers,
  zoneMode,
  zone,
  zones,
  city,
  "filters": filters {
    "city": city->slug.current,
    "district": district->slug.current,
    "propertyType": propertyType->slug.current,
    deal
  },
  autoMode,
  metrics,
  showSources,
  // relatedPagesAutoSection (TZ-16): section-level tag filter + alias slugs for
  // the explicit city/zone escape hatches (the raw city/zone refs are above).
  topicTags,
  "relatedCitySlug": city->slug.current,
  "relatedZone": zone->{"slug": slug.current, "type": _type, "citySlug": select(_type == "district" => city->slug.current, slug.current)},
  sortBy,
  linkRows,
  displayMode,
  showTiers,
  closingText,
  description,
  variant,
  eyebrow,
  supportingText,
  mediaMode,
  mediaSide,
  promoMediaType,
  videoUrl,
  groupedMediaMode,
  "images": images[] {
    _key,
    asset-> { url },
    alt,
    image { asset-> { url }, alt }
  },
  "contentGroups": contentGroups[] {
    _key,
    groupTitle,
    description,
    bullets,
    groupDisplay,
    "cards": cards[] {
      _key,
      value,
      label,
      description
    }
  },
  benefits,
  "benefitItems": benefitItems[] {
    _key,
    label,
    iconKey
  },
  trustStripText,
  category,
  readingTimeMinutes,
  "author": author {
    name,
    role,
    initials,
    "avatarUrl": avatar.asset->url
  },
  "stats": stats[] {
    _key,
    value,
    label
  },
  "pullQuote": pullQuote {
    text,
    author
  },
  highlightsDisplay,
  "highlightsCards": highlightsCards[] {
    _key,
    value,
    label,
    description
  },
  image { asset-> { url }, alt },
  primaryImage { asset-> { url }, alt },
  secondaryImage { asset-> { url }, alt },
  imageMode,
  backgroundImage { asset-> { url }, alt },
  "cities": cities[]-> {
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    vibe,
    heroImage { asset-> { url }, alt, label },
    "countrySlug": country->slug.current,
    "propertiesCount": count(*[_type=="property" && city._ref==^._id && isPublished==true])
  },
  "resolvedManualItems": coalesce(
    manualItems[]-> {
      _id,
      _type,
      title,
      "slug": slug.current,
      shortDescription,
      vibe,
      heroImage { asset-> { url }, alt, label },
      "countrySlug": country->slug.current,
      "city": city-> { "slug": slug.current, "countrySlug": country->slug.current },
      "propertiesCount": select(
        _type == "city" => count(*[_type=="property" && city._ref==^._id && isPublished==true]),
        _type == "district" => count(*[_type=="property" && district._ref==^._id && isPublished==true]),
        0
      )
    },
    manualItems[] {
      _id,
      _type,
      title,
      "slug": slug.current,
      shortDescription,
      vibe,
      heroImage { asset-> { url }, alt, label },
      "countrySlug": country->slug.current,
      "city": city-> { "slug": slug.current, "countrySlug": country->slug.current }
    }
  ),
  "agents": agents[]-> {
    _id,
    name,
    "slug": slug.current,
    photo { alt, asset-> { url } },
    agentLogo { alt, asset-> { url } },
    telegramUrl,
    instagramUrl,
    facebookUrl,
    youtubeUrl
  },
  "landings": select(
    count(coalesce(landings, manualItems)) > 0 && defined((coalesce(landings, manualItems))[0]._ref) => (coalesce(landings, manualItems))[]-> {
      _id,
      pageType,
      "slug": slug.current,
      title,
      cardTitle,
      cardDescription,
      cardImage { asset-> { url }, alt },
      "linkedCity": linkedCity-> { "slug": slug.current, "countrySlug": country->slug.current },
      "linkedDistrict": linkedDistrict-> {
        "slug": slug.current,
        "citySlug": city->slug.current,
        "countrySlug": city->country->slug.current
      }
    },
    (coalesce(landings, manualItems))[] {
      _id,
      pageType,
      "slug": coalesce(slug.current, slug),
      title,
      cardTitle,
      cardDescription,
      cardImage { asset-> { url }, alt },
      "linkedCity": linkedCity-> { "slug": slug.current, "countrySlug": country->slug.current },
      "linkedDistrict": linkedDistrict-> {
        "slug": slug.current,
        "citySlug": city->slug.current,
        "countrySlug": city->country->slug.current
      }
    }
  )
}`;

/**
 * Fetch landingPage document for the cities index route `/[locale]/cities`.
 * Returns null if not found or client not configured.
 */
export async function fetchCitiesIndexLanding(): Promise<{
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
      _id == "landing-cities" ||
      pageType == "cityIndex"
    )
  ][0] {
    _id,
    _type,
    pageType,
    "slug": slug.current,
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
  try {
    return await client.fetch(query);
  } catch (err) {
    console.warn("[Sanity] fetchCitiesIndexLanding failed:", err);
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
    "slug": slug.current,
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
  try {
    return await client.fetch(query);
  } catch (err) {
    console.warn("[Sanity] fetchHomeLanding failed:", err);
    return null;
  }
}

/**
 * Fetch landingPage for deal-type marketing routes (`/sale`, `/rent`, `/short-term-rent`).
 * Resolves the CMS document by **slug only** (`dealTypeToLandingDocumentSlug`); pageType is not used
 * (deal landings share a common pageType such as "investment" in Studio).
 */
export async function fetchDealTypeLanding(deal: PropertiesDealParam): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  slug?: string;
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const slug = dealTypeToLandingDocumentSlug(deal);
  if (!slug) return null;

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[_type == "landingPage" && slug.current == $slug][0] {
    _id,
    _type,
    pageType,
    "slug": slug.current,
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
      try {
        return await client.fetch(query, { slug });
      } catch (err) {
        console.warn('[Sanity] fetchDealTypeLanding failed:', err);
        return null;
      }
    },
    ['sanity-deal-landing-v2', deal],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage] },
  );

  return cached();
}

/**
 * Fetch a `landingPage` by `slug.current` (e.g. custom marketing pages).
 * Same document shape and `landingPageSectionsProjection` as `fetchDealTypeLanding`.
 */
export async function fetchLandingPageBySlug(slug: string): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  slug?: string;
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const trimmed = typeof slug === 'string' ? slug.trim() : '';
  if (!trimmed) return null;

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[_type == "landingPage" && slug.current == $slug][0] {
    _id,
    _type,
    pageType,
    "slug": slug.current,
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
      try {
        return await client.fetch(query, { slug: trimmed });
      } catch (err) {
        console.warn('[Sanity] fetchLandingPageBySlug failed:', err);
        return null;
      }
    },
    ['sanity-landing-by-slug', trimmed],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage] },
  );

  return cached();
}

/**
 * Fetch an enabled `landingPage` with `pageType == "custom"` for the universal
 * `/[locale]/guides/[slug]` route. `enabled != false` (not `== true`) so legacy
 * documents created before the field existed keep working.
 */
export async function fetchGuideLandingBySlug(slug: string): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  slug?: string;
  title?: unknown;
  cardDescription?: unknown;
  cardImage?: { asset?: { url?: string } };
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const trimmed = typeof slug === 'string' ? slug.trim() : '';
  if (!trimmed) return null;

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[
    _type == "landingPage" &&
    pageType == "custom" &&
    enabled != false &&
    slug.current == $slug
  ][0] {
    _id,
    _type,
    pageType,
    "slug": slug.current,
    title,
    cardDescription,
    cardImage { asset-> { url } },
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
      try {
        return await client.fetch(query, { slug: trimmed });
      } catch (err) {
        console.warn('[Sanity] fetchGuideLandingBySlug failed:', err);
        return null;
      }
    },
    ['sanity-guide-landing-by-slug', trimmed],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage] },
  );

  return cached();
}

/**
 * Fetch an enabled `landingPage` with `pageType == "unique"` for the top-level
 * `/[locale]/<slug>` surface (rendered by the [country] single-segment resolver
 * as its final fallback — geo/deal/type segments win; see ROUTING.md).
 */
export async function fetchUniqueLandingBySlug(slug: string): Promise<{
  _id?: string;
  _type?: string;
  pageType?: string;
  slug?: string;
  title?: unknown;
  cardDescription?: unknown;
  cardImage?: { asset?: { url?: string } };
  pageSections?: unknown[];
  seo?: unknown;
} | null> {
  const trimmed = typeof slug === 'string' ? slug.trim() : '';
  if (!trimmed) return null;

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[
    _type == "landingPage" &&
    pageType == "unique" &&
    enabled != false &&
    slug.current == $slug
  ][0] {
    _id,
    _type,
    pageType,
    "slug": slug.current,
    title,
    cardDescription,
    cardImage { asset-> { url } },
    "pageSections": pageSections[]${landingPageSectionsProjection},
    topicTags,
    contentUpdatedAt,
    seo
  }`;
      try {
        return await client.fetch(query, { slug: trimmed });
      } catch (err) {
        console.warn('[Sanity] fetchUniqueLandingBySlug failed:', err);
        return null;
      }
    },
    ['sanity-unique-landing-by-slug', trimmed],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage] },
  );

  return cached();
}

export type CityLandingNavItem = { slug: string; label: string; countrySlug?: string };

/**
 * City links for drawer nav: only `landingPage` documents with `pageType == "city"` and a linked city slug.
 */
export async function fetchCityLandingNavItems(locale: string): Promise<CityLandingNavItem[]> {
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_type == "landingPage" && pageType == "city" && defined(linkedCity->slug.current)] | order(linkedCity->slug.current asc) {
        "slug": linkedCity->slug.current,
        "title": linkedCity->title,
        "countrySlug": linkedCity->country->slug.current
      }`;
      try {
        const rows = await client.fetch<Array<{ slug?: string; title?: unknown; countrySlug?: string }>>(query);
        if (!Array.isArray(rows)) return [];
        return rows
          .filter((r): r is { slug: string; title?: unknown; countrySlug?: string } => typeof r.slug === 'string' && r.slug.length > 0)
          .map((r) => ({
            slug: r.slug,
            label: resolveLocalizedString(r.title as never, locale) || r.slug,
            countrySlug:
              typeof r.countrySlug === 'string' && r.countrySlug.trim()
                ? r.countrySlug.trim().toLowerCase()
                : undefined,
          }));
      } catch (err) {
        console.warn('[Sanity] fetchCityLandingNavItems failed:', err);
        return [];
      }
    },
    ['sanity-city-nav-items-v1', locale],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage, SANITY_TAGS.city] },
  );

  return cached();
}


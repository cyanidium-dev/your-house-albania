import { resolveLocalizedString } from './localized';
import { catalogFilterPath, catalogPath } from '@/lib/routes/catalog';

/** Preferred order: Durrës, Tirana, Vlorë, Sarandë. Slugs: durres, tirana, vlore, sarande */
const PREFERRED_SLUGS = ['durres', 'tirana', 'vlore', 'sarande'];

export type CityCard = {
  _id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  heroImageUrl: string;
};

type SanityCity = {
  _id?: string;
  title?: unknown;
  slug?: string | { current?: string };
  shortDescription?: unknown;
  heroImageUrl?: string;
  heroImage?: { asset?: { url?: string } };
};

export function mapSanityCityToCard(c: SanityCity, locale: string): CityCard {
  const slug = typeof c.slug === 'string' ? c.slug : c.slug?.current ?? '';
  const heroUrl =
    c.heroImageUrl ??
    (c.heroImage as { asset?: { url?: string } } | undefined)?.asset?.url ??
    '';
  return {
    _id: c._id,
    title: resolveLocalizedString(c.title as never, locale) || '—',
    slug,
    shortDescription: resolveLocalizedString(c.shortDescription as never, locale) || '',
    heroImageUrl: heroUrl,
  };
}

/** Normalize cities: first 4 in preferred order (Durrës, Tirana, Vlorë, Sarandë), then others. */
export function normalizeCitiesOrder(cities: SanityCity[], locale: string): CityCard[] {
  const cards = cities.map((c) => mapSanityCityToCard(c, locale)).filter((c) => c.slug);
  const bySlug = new Map(cards.map((c) => [c.slug.toLowerCase(), c]));
  const result: CityCard[] = [];
  for (const slug of PREFERRED_SLUGS) {
    const card = bySlug.get(slug);
    if (card) {
      result.push(card);
      bySlug.delete(slug);
    }
  }
  for (const [, card] of bySlug) {
    result.push(card);
  }
  return result.slice(0, 4);
}

export type LocationCarouselCard = {
  _id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  heroImageUrl: string;
  /** Resolved href for this item (city landing or district catalog). */
  href: string;
};

type ResolvedItem = {
  _id?: string;
  _type?: string;
  title?: unknown;
  slug?: string | { current?: string };
  shortDescription?: unknown;
  heroImage?: { asset?: { url?: string } };
  heroImageUrl?: string;
  city?: { slug?: string | { current?: string } };
};

function slugOf(x: unknown): string {
  if (!x) return '';
  if (typeof x === 'string') return x;
  return (x as { current?: string } | null | undefined)?.current ?? '';
}

/** Map resolvedManualItems (city or district) to LocationCarouselCard with correct href. */
export function mapResolvedManualItemsToCards(
  items: ResolvedItem[],
  locale: string,
  linkTargetType: 'catalog' | 'landing' | undefined
): LocationCarouselCard[] {
  const linkLanding = linkTargetType === 'landing';
  const result: LocationCarouselCard[] = [];
  for (const item of items) {
    const slug = slugOf(item.slug);
    if (!slug) continue;
    const title = resolveLocalizedString(item.title as never, locale) || '—';
    const shortDescription = resolveLocalizedString(item.shortDescription as never, locale) || '';
    const heroUrl =
      item.heroImageUrl ??
      (item.heroImage as { asset?: { url?: string } } | undefined)?.asset?.url ??
      '';
    const citySlug = slugOf(item.city?.slug);
    const href =
      item._type === 'district'
        ? citySlug
          ? catalogFilterPath({ locale, city: citySlug, district: slug })
          : catalogPath(locale)
        : linkLanding
          ? `/${locale}/cities/${slug}`
          : catalogFilterPath({ locale, city: slug });
    result.push({
      _id: item._id,
      title,
      slug,
      shortDescription,
      heroImageUrl: heroUrl,
      href,
    });
  }
  return result;
}

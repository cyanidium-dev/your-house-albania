import { resolveLocalizedString } from './localized';

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

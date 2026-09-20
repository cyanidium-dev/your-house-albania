/**
 * Site-level JSON-LD: one Organization and one WebSite, emitted from the locale
 * layout on every page as a single @graph.
 *
 * Both nodes are identical in every locale and on every URL. Their `@id`s are
 * what the rest of the structured data points at — Article `publisher`, the
 * founders' `worksFor`, the About page's `about` — so a crawler that meets the
 * entity on a blog post in Polish and on a listing in Albanian is looking at
 * the same node, not at seven near-copies that disagree about `url`.
 */

export type SiteJsonLdInput = {
  baseUrl: string;
  /** Brand name displayed everywhere (Organization.name, WebSite.name). */
  brandName?: string;
  /** Public-facing longer name for Organization. */
  legalName?: string;
  /** Absolute URL to the brand logo. */
  logoUrl?: string;
  /** Social profile / sameAs links. Optional, helps disambiguate the entity. */
  sameAs?: string[];
  /**
   * Catalog URL template the SearchAction should hit, after the origin. The one
   * value that may differ by locale (`/{locale}/catalog?q=…`), so a search
   * lands in the visitor's language instead of on a locale redirect.
   */
  searchUrlTemplate?: string;
  /** Contact email, from the CMS. */
  email?: string;
  /** Contact phone, from the CMS. Dropped when it is the seeded placeholder. */
  telephone?: string;
  /** Messenger entry points, emitted as `contactPoint.url`. */
  messengers?: Array<{ name: string; url: string }>;
  /** Locale codes the site is published in → `knowsLanguage` / `inLanguage`. */
  languages?: readonly string[];
  /** The founders, by stable Person `@id`. */
  founders?: Array<{ id: string; name: string }>;
};

const DEFAULT_BRAND = 'Domlivo';
const DEFAULT_LEGAL = 'Domlivo — Real estate in Albania';
const DEFAULT_SEARCH_TEMPLATE = '/catalog?q={search_term_string}';
/**
 * What the organisation is, in one factual sentence. English in every locale:
 * the node has to be identical wherever it is emitted.
 */
export const ORGANIZATION_DESCRIPTION =
  'Property marketplace for Albania: listings published by owners and partner agencies, sourced market research, and an AI assistant that answers from it.';

/**
 * The phone number the CMS was seeded with. It reaches nobody, so publishing it
 * as the organisation's `telephone` would be a false contact detail.
 */
const PLACEHOLDER_PHONE_DIGITS = '355690000000';

function abs(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  if (!path) return base;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

/** `@id` of the one Organization node. Same value in every locale. */
export function organizationId(baseUrl: string): string {
  return `${abs(baseUrl, '/')}#organization`;
}

/** `@id` of the one WebSite node. Same value in every locale. */
export function websiteId(baseUrl: string): string {
  return `${abs(baseUrl, '/')}#website`;
}

/** A real, publishable phone number — or undefined. */
export function publishablePhone(raw: string | null | undefined): string | undefined {
  const phone = typeof raw === 'string' ? raw.trim() : '';
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits === PLACEHOLDER_PHONE_DIGITS) return undefined;
  return phone;
}

function cleanList(values: readonly string[] | undefined): string[] {
  return (values ?? []).map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

export function buildOrganizationNode(input: SiteJsonLdInput): Record<string, unknown> {
  const { baseUrl, brandName = DEFAULT_BRAND, legalName = DEFAULT_LEGAL, logoUrl } = input;
  const email = input.email?.trim() || undefined;
  const telephone = publishablePhone(input.telephone);
  const languages = cleanList(input.languages);
  const sameAs = cleanList(input.sameAs);
  const messengers = (input.messengers ?? []).filter((m) => m?.url?.trim());
  const founders = (input.founders ?? []).filter((f) => f?.id && f?.name);

  const contactPoints: Record<string, unknown>[] = [];
  if (email || telephone) {
    contactPoints.push({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      ...(email ? { email } : {}),
      ...(telephone ? { telephone } : {}),
      ...(languages.length > 0 ? { availableLanguage: languages } : {}),
    });
  }
  for (const messenger of messengers) {
    contactPoints.push({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      name: messenger.name,
      url: messenger.url.trim(),
    });
  }

  return {
    '@type': 'Organization',
    '@id': organizationId(baseUrl),
    name: brandName,
    legalName,
    description: ORGANIZATION_DESCRIPTION,
    url: abs(baseUrl, '/'),
    ...(logoUrl ? { logo: { '@type': 'ImageObject', url: abs(baseUrl, logoUrl) } } : {}),
    ...(email ? { email } : {}),
    ...(telephone ? { telephone } : {}),
    areaServed: { '@type': 'Country', name: 'Albania' },
    ...(languages.length > 0 ? { knowsLanguage: languages } : {}),
    ...(founders.length > 0
      ? { founder: founders.map((f) => ({ '@type': 'Person', '@id': f.id, name: f.name })) }
      : {}),
    ...(contactPoints.length > 0 ? { contactPoint: contactPoints } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildWebSiteNode(input: SiteJsonLdInput): Record<string, unknown> {
  const { baseUrl, brandName = DEFAULT_BRAND, searchUrlTemplate = DEFAULT_SEARCH_TEMPLATE } = input;
  const languages = cleanList(input.languages);
  return {
    '@type': 'WebSite',
    '@id': websiteId(baseUrl),
    name: brandName,
    url: abs(baseUrl, '/'),
    ...(languages.length > 0 ? { inLanguage: languages } : {}),
    publisher: { '@id': organizationId(baseUrl) },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: abs(baseUrl, searchUrlTemplate),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildSiteJsonLd(input: SiteJsonLdInput): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationNode(input), buildWebSiteNode(input)],
  };
}

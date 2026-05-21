/**
 * Build site-level JSON-LD: WebSite (with SearchAction for Google Sitelinks
 * searchbox) + Organization (for Knowledge Panel). Emit both as a single
 * @graph payload — Google reads it the same as two separate script tags but
 * stays cheaper to render.
 */

export type SiteJsonLdInput = {
  baseUrl: string;
  locale: string;
  /** Brand name displayed everywhere (Organization.name, WebSite.name). */
  brandName?: string;
  /** Public-facing legal name / longer description for Organization. */
  legalName?: string;
  /** Absolute URL to the brand logo (square, ≥112×112). */
  logoUrl?: string;
  /** Social profile / sameAs links. Optional, helps disambiguate the entity. */
  sameAs?: string[];
  /** Catalog URL template that the searchbox should hit, e.g. "/catalog?q={search_term_string}". */
  searchUrlTemplate?: string;
  /** Contact email / phone shown in Organization.contactPoint. */
  contactPoint?: {
    email?: string;
    telephone?: string;
    contactType?: string;
  };
};

const DEFAULT_BRAND = 'Domlivo';
const DEFAULT_LEGAL = 'Domlivo — Real estate in Albania';
const DEFAULT_SEARCH_TEMPLATE = '/catalog?q={search_term_string}';

function abs(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  if (!path) return base;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

export function buildSiteJsonLd(input: SiteJsonLdInput): object {
  const {
    baseUrl,
    locale,
    brandName = DEFAULT_BRAND,
    legalName = DEFAULT_LEGAL,
    logoUrl,
    sameAs,
    searchUrlTemplate = DEFAULT_SEARCH_TEMPLATE,
    contactPoint,
  } = input;

  const homeUrl = abs(baseUrl, `/${locale}`);
  const orgId = `${abs(baseUrl, '/')}#organization`;
  const websiteId = `${abs(baseUrl, '/')}#website`;

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': orgId,
    name: brandName,
    legalName,
    url: abs(baseUrl, '/'),
    ...(logoUrl ? { logo: { '@type': 'ImageObject', url: abs(baseUrl, logoUrl) } } : {}),
    ...(Array.isArray(sameAs) && sameAs.length > 0 ? { sameAs } : {}),
  };
  if (contactPoint && (contactPoint.email || contactPoint.telephone)) {
    organization.contactPoint = {
      '@type': 'ContactPoint',
      contactType: contactPoint.contactType || 'customer support',
      ...(contactPoint.email ? { email: contactPoint.email } : {}),
      ...(contactPoint.telephone ? { telephone: contactPoint.telephone } : {}),
    };
  }

  const website: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: brandName,
    url: homeUrl,
    inLanguage: locale,
    publisher: { '@id': orgId },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: abs(baseUrl, `/${locale}${searchUrlTemplate}`),
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  };
}

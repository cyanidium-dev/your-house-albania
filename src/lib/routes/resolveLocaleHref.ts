import { routing } from '@/i18n/routing'
import { isSolePublicDealRouteSegment } from '@/lib/catalog/publicDealTypes'
import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG } from '@/lib/routes/catalogPathPrimitives'

/** `/{country}/{city}[/{district}]/{deal}` with nothing after the deal but a query or hash. */
const PLACE_DEAL_LISTING = /^(\/[^/?#]+\/[^/?#]+(?:\/[^/?#]+)?)\/([^/?#]+)(?=[?#]|$)/

/**
 * Drop the deal segment from a city or district listing link while that deal
 * is the only public one. CMS CTAs ("See listings", "Listings in Golem") were
 * written against `/albania/durres/golem-durres/sale`, which now 308s to
 * `/albania/durres/golem-durres`; rewriting the href sends the link's weight to
 * the indexed URL instead of through a redirect. Typed listings
 * (`/sale/apartment`) are left alone — they are canonical as written.
 */
export function canonicalizePlaceListingPath(path: string): string {
  const match = PLACE_DEAL_LISTING.exec(path)
  if (!match) return path
  const [whole, place, deal] = match
  const country = place.split('/')[1]?.toLowerCase()
  if (country !== LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG) return path
  if (!isSolePublicDealRouteSegment(deal.toLowerCase())) return path
  return place + path.slice(whole.length)
}

/**
 * Strip a locale segment an editor left on an internal path.
 *
 * CMS copy is full of links pasted from the live site, so a Russian article
 * carries `/en/blog/...`. Prefixing that with the reader's locale produced
 * `/ru/en/blog/...`, which 404s. Any configured locale at the head of the path
 * is dropped; the reader's own locale is added back by the caller.
 */
function stripLocalePrefix(path: string, locales: readonly string[]): string {
  const [, first, ...rest] = path.split('/')
  if (!first || !locales.includes(first)) return path
  return rest.length > 0 ? `/${rest.join('/')}` : '/'
}

/**
 * Locale-prefix internal paths for links, matching legacy CTA/marketing behavior.
 * - External http(s), mailto, tel, hash anchors pass through.
 * - A leading locale segment is replaced by the current one, whichever locale it
 *   names — so a link is never double-prefixed and never sends a reader to the
 *   wrong language.
 * - Leading `/` → `/${locale}${path}`; bare segments → `/${locale}/${segment}`.
 */
export function resolveLocaleHref(
  href: string,
  locale: string,
  locales: readonly string[] = routing.locales,
): string {
  const h = typeof href === 'string' ? href.trim() : ''
  if (!h) return '#'
  if (
    h.startsWith('http://') ||
    h.startsWith('https://') ||
    h.startsWith('mailto:') ||
    h.startsWith('tel:')
  ) {
    return h
  }
  if (h.startsWith('#')) return h
  if (h.startsWith('/')) {
    const path = canonicalizePlaceListingPath(stripLocalePrefix(h, locales))
    return path === '/' ? `/${locale}` : `/${locale}${path}`
  }
  return `/${locale}/${h}`
}

/**
 * One rule for every CMS-sourced CTA: trim label and href; if either is empty
 * render nothing; otherwise resolve the href with `resolveLocaleHref`.
 * Returns `null` when the CTA should not render.
 */
export function resolveCta(
  label: unknown,
  href: unknown,
  locale: string,
): { label: string; href: string } | null {
  const l = typeof label === 'string' ? label.trim() : ''
  const h = typeof href === 'string' ? href.trim() : ''
  if (!l || !h) return null
  return { label: l, href: resolveLocaleHref(h, locale) }
}

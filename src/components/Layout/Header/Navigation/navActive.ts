import type { PrimaryNavItem } from '@/data/navConfig'
import { NON_LISTING_FIRST_SEGMENTS } from '@/lib/routes/listingQueryRewrite'

export function resolveNavHref(href: string, locale: string): string {
  if (href === '/') return `/${locale}`
  return `/${locale}${href}`
}

function stripQuery(path: string): string {
  const i = path.indexOf('?')
  return i >= 0 ? path.slice(0, i) : path
}

function isUnder(pathname: string, base: string): boolean {
  const p = stripQuery(pathname).replace(/\/$/, '') || '/'
  const b = base.replace(/\/$/, '') || '/'
  return p === b || p.startsWith(`${b}/`)
}

/**
 * Which bar entry the current page belongs to. "Buy" covers every listing
 * route: the national hub, the catalogue, the cities hub and any
 * `/{locale}/{country}/…` geo page, which is every first segment that is not
 * a route of its own.
 */
export function isPrimaryNavItemActive(item: PrimaryNavItem, pathname: string | null, locale: string): boolean {
  const path = pathname ?? ''
  if (item.kind === 'link') return isUnder(path, resolveNavHref(item.href, locale))
  if (isUnder(path, `/${locale}/sale`) || isUnder(path, `/${locale}/catalog`) || isUnder(path, `/${locale}/cities`)) {
    return true
  }
  const parts = stripQuery(path).split('/').filter(Boolean)
  if (parts.length < 2 || parts[0] !== locale) return false
  return !NON_LISTING_FIRST_SEGMENTS.has(parts[1].toLowerCase())
}

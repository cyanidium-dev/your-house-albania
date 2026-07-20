/**
 * Static drawer navigation shape. City children are injected at runtime from Sanity (see Header).
 */
import { NON_GEO_DEAL_NAV_HREF } from './nonGeoDealNavHref'
import { isPublicDealQuery } from '@/lib/catalog/publicDealTypes'

/** Nav key → catalog deal query, for `PUBLIC_DEAL_TYPES` filtering. */
export const NAV_KEY_TO_DEAL_QUERY: Record<string, string> = {
  buy: 'sale',
  rent: 'rent',
  shortTermRent: 'short-term',
}

/** Keeps non-deal items; deal items only when their deal type is publicly exposed. */
export function isPublicNavKey(key: string): boolean {
  const deal = NAV_KEY_TO_DEAL_QUERY[key]
  return deal === undefined || isPublicDealQuery(deal)
}

export type DrawerNavLinkItem = {
  kind: 'link'
  key: string
  href: string
}

export type DrawerNavExpandableItem = {
  kind: 'expandable'
  key: string
  href: string
}

export type DrawerNavItem = DrawerNavLinkItem | DrawerNavExpandableItem

export const DRAWER_NAV_ITEMS: DrawerNavItem[] = (
  [
    { kind: 'link', key: 'home', href: '/' },
    { kind: 'link', key: 'buy', href: NON_GEO_DEAL_NAV_HREF.buy },
    { kind: 'link', key: 'rent', href: NON_GEO_DEAL_NAV_HREF.rent },
    { kind: 'link', key: 'shortTermRent', href: NON_GEO_DEAL_NAV_HREF.shortTermRent },
    { kind: 'expandable', key: 'cities', href: '/cities' },
    { kind: 'expandable', key: 'realtors', href: '/for-realtors' },
    { kind: 'link', key: 'blog', href: '/blog' },
    { kind: 'link', key: 'contacts', href: '/contacts' },
  ] as DrawerNavItem[]
).filter((item) => isPublicNavKey(item.key))

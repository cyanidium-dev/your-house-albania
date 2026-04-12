/**
 * Static drawer navigation shape. City children are injected at runtime from Sanity (see Header).
 */
import { NON_GEO_DEAL_NAV_HREF } from './nonGeoDealNavHref'

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

export const DRAWER_NAV_ITEMS: DrawerNavItem[] = [
  { kind: 'link', key: 'home', href: '/' },
  { kind: 'link', key: 'buy', href: NON_GEO_DEAL_NAV_HREF.buy },
  { kind: 'link', key: 'rent', href: NON_GEO_DEAL_NAV_HREF.rent },
  { kind: 'link', key: 'shortTermRent', href: NON_GEO_DEAL_NAV_HREF.shortTermRent },
  { kind: 'expandable', key: 'cities', href: '/cities' },
  { kind: 'expandable', key: 'realtors', href: '/for-realtors' },
  { kind: 'link', key: 'blog', href: '/blog' },
  { kind: 'link', key: 'contacts', href: '/contacts' },
]

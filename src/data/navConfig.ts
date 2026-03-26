/**
 * Static drawer navigation shape. City children are injected at runtime from Sanity (see Header).
 */
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

/** Parent label only (no href); children are disabled placeholders until routes exist. */
export type DrawerNavExpandablePlaceholderItem = {
  kind: 'expandablePlaceholder'
  key: string
  childKeys: readonly string[]
}

export type DrawerNavItem =
  | DrawerNavLinkItem
  | DrawerNavExpandableItem
  | DrawerNavExpandablePlaceholderItem

export const DRAWER_NAV_ITEMS: DrawerNavItem[] = [
  { kind: 'link', key: 'home', href: '/' },
  { kind: 'link', key: 'sale', href: '/sale' },
  { kind: 'link', key: 'rent', href: '/rent' },
  { kind: 'link', key: 'shortTermRent', href: '/short-term-rent' },
  { kind: 'expandable', key: 'cities', href: '/cities' },
  {
    kind: 'expandablePlaceholder',
    key: 'realtors',
    childKeys: ['realtorsAbout', 'realtorsRegister'] as const,
  },
  { kind: 'link', key: 'blog', href: '/blog' },
  { kind: 'link', key: 'contacts', href: '/contacts' },
]

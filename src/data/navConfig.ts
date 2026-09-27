/**
 * Primary navigation: the same five entries on the desktop bar and in the
 * drawer. Labels come from `Header.nav.*`; hrefs are locale-less and get the
 * locale prefix at render time.
 *
 * Rebuilt 2026-09-26 from the IA audit (docs/ux/IA-AUDIT-2026-09-26.md):
 * - "Buy" opens the cities directly (Durrës and Tirana pinned first), and the
 *   city price pages, because those are the pages that get the clicks:
 *   listings under /albania/durres and the /info pages carry more Search
 *   Console clicks than everything else except the blog and the guides.
 * - Guides, Blog and About get a link of their own; the About page is where
 *   the founders and the Organization live.
 * - The realtor section is gone from the menu (0 clicks in 3 months on
 *   /for-realtors, /how-to-publish and /register). Listing a property is a
 *   secondary scenario now: a note on /contacts and one footer link.
 * - Rent and short-term rent are not public deal types; they never rendered.
 */

export type NavLinkItem = {
  kind: 'link'
  key: 'guides' | 'blog' | 'about' | 'contacts'
  href: `/${string}`
}

export type NavBuyItem = {
  kind: 'buy'
  key: 'buy'
  /** The national sale hub, where the whole menu points when opened as a link. */
  href: `/${string}`
}

export type PrimaryNavItem = NavBuyItem | NavLinkItem

export const PRIMARY_NAV_ITEMS: readonly PrimaryNavItem[] = [
  { kind: 'buy', key: 'buy', href: '/sale' },
  { kind: 'link', key: 'guides', href: '/guides' },
  { kind: 'link', key: 'blog', href: '/blog' },
  { kind: 'link', key: 'about', href: '/about' },
  { kind: 'link', key: 'contacts', href: '/contacts' },
]

/** Where the "list your property" scenario lives now. */
export const ADD_PROPERTY_HREF = '/contacts#add-property' as const

/**
 * Cities that open the Buy menu, in this order, when they exist in the CMS
 * list. Durrës holds 95% of the stock; Tirana has the search demand (708
 * impressions in 3 months, mostly on its price page). Everything else follows
 * in the CMS order (listing count, descending).
 */
export const PINNED_CITY_SLUGS: readonly string[] = ['durres', 'tirana']

/** How many cities the Buy menu shows. Five cities have listings today. */
export const MAX_MENU_CITIES = 6

/** How many city price pages the Buy menu shows. */
export const MAX_MENU_PRICE_PAGES = 6

/**
 * Pins `PINNED_CITY_SLUGS` to the front, keeps the incoming order for the rest,
 * drops duplicates and cuts at `limit`.
 */
export function orderMenuCities<T extends { slug: string }>(cities: readonly T[], limit: number): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  const push = (city: T) => {
    const slug = city.slug.toLowerCase()
    if (seen.has(slug)) return
    seen.add(slug)
    out.push(city)
  }
  for (const slug of PINNED_CITY_SLUGS) {
    const hit = cities.find((c) => c.slug.toLowerCase() === slug)
    if (hit) push(hit)
  }
  for (const city of cities) push(city)
  return out.slice(0, limit)
}

/** One entry of a menu column, already localised and locale-prefixed. */
export type MenuLink = {
  key: string
  label: string
  href: string
}

/** Everything the Buy menu renders, built once per request on the server. */
export type BuyMenuData = {
  /** City listing pages, pinned order. */
  cities: MenuLink[]
  /** City price pages (`/{country}/{city}/info`), pinned order. */
  priceCities: MenuLink[]
  /** `/{locale}/sale` */
  allListingsHref: string
  /** `/{locale}/cities` */
  allCitiesHref: string
}
